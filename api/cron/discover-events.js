// api/cron/discover-events.js
// Vercel cron handler — runs daily.
// For each Tier 1 and Tier 2 venue, asks Perplexity for upcoming events
// and inserts new rows into the events table.
// Dedupes via the (venue_id, event_date, name) unique constraint.

import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { verifyCronAuth } from '../../src/lib/cron-auth.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { askPerplexityJSON } from '../../src/lib/perplexity-client.js';
import { scoreLead } from '../../src/lib/scoring.js';
import {
  DISCOVERY_SYSTEM_PROMPT,
  buildDiscoveryPrompt,
} from '../../src/lib/prompts/discover-events.js';

// Limit how many venues we hit per run to control API spend.
// Tier 3 venues are processed less frequently (rotate weekly).
const MAX_VENUES_PER_RUN = 25;

// Sleep between Perplexity calls to avoid rate limits
const SLEEP_BETWEEN_CALLS_MS = 1000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(request) {
  // Auth guard
  if (!verifyCronAuth(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const runId = await startRun('discovery');
  const errors = [];
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let totalEventsInserted = 0;

  try {
    // Pull venues — prioritize Tier 1, include Tier 2, rotate Tier 3
    const { data: venues, error: venueError } = await supabaseAdmin
      .from('venues')
      .select('id, name, city, type, tier')
      .lte('tier', 2)
      .order('tier', { ascending: true })
      .limit(MAX_VENUES_PER_RUN);

    if (venueError) throw new Error(`Failed to load venues: ${venueError.message}`);

    if (!venues || venues.length === 0) {
      await finishRun(runId, 'success', {
        notes: 'No venues to process. Run seed_venues.sql first.',
      });
      return Response.json({ ok: true, message: 'No venues' });
    }

    console.log(`[discover-events] Processing ${venues.length} venues`);

    for (const venue of venues) {
      processed++;

      try {
        // Ask Perplexity for upcoming events at this venue
        const userPrompt = buildDiscoveryPrompt(venue);
        const { data: events, citations } = await askPerplexityJSON(
          DISCOVERY_SYSTEM_PROMPT,
          userPrompt,
          { maxTokens: 3000 }
        );

        if (!Array.isArray(events)) {
          throw new Error('Perplexity returned non-array response');
        }

        // Filter out events that are missing required fields or in the past
        const today = new Date().toISOString().split('T')[0];
        const validEvents = events.filter(e =>
          e.name &&
          e.event_date &&
          e.source_url &&
          e.event_date >= today
        );

        if (validEvents.length === 0) {
          console.log(`[discover-events] ${venue.name}: no valid events found`);
          succeeded++;
          continue;
        }

        // Insert events with scoring
        const rows = validEvents.map(e => ({
          venue_id: venue.id,
          name: e.name.slice(0, 500),
          event_date: e.event_date,
          event_type: e.event_type ?? 'other',
          artist_or_host: e.artist_or_host?.slice(0, 500) ?? null,
          source_url: e.source_url.slice(0, 1000),
          status: 'discovered',
          score: scoreLead({
            venueTier: venue.tier,
            eventType: e.event_type,
            eventDate: e.event_date,
          }),
          raw_payload: { perplexity_response: e, citations },
        }));

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('events')
          .upsert(rows, {
            onConflict: 'venue_id,event_date,name',
            ignoreDuplicates: true,
          })
          .select('id');

        if (insertError) {
          throw new Error(`Insert failed: ${insertError.message}`);
        }

        const insertedCount = inserted?.length ?? 0;
        totalEventsInserted += insertedCount;
        console.log(`[discover-events] ${venue.name}: ${insertedCount} new events (${validEvents.length} found)`);
        succeeded++;

      } catch (err) {
        failed++;
        const msg = `${venue.name}: ${err.message}`;
        console.error(`[discover-events] ${msg}`);
        errors.push(msg);
      }

      // Throttle between venues
      if (processed < venues.length) {
        await sleep(SLEEP_BETWEEN_CALLS_MS);
      }
    }

    await finishRun(runId, failed === 0 ? 'success' : 'partial', {
      processed,
      succeeded,
      failed,
      errorLog: errors.length > 0 ? errors : null,
      notes: `Inserted ${totalEventsInserted} new events across ${succeeded} venues`,
    });

    return Response.json({
      ok: true,
      processed,
      succeeded,
      failed,
      newEvents: totalEventsInserted,
    });

  } catch (err) {
    console.error('[discover-events] Fatal error:', err);
    await finishRun(runId, 'failed', {
      processed,
      succeeded,
      failed,
      errorLog: { fatal: err.message, errors },
    });
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

// Vercel cron jobs use Node runtime by default. Explicit for clarity.
export const config = {
  maxDuration: 300, // 5 minutes — covers ~25 venues with 1s throttle
};
