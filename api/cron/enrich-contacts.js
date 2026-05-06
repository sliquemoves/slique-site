// api/cron/enrich-contacts.js
// Vercel cron handler — runs daily.
// For each venue that has a 'discovered' event but no contact yet,
// asks Perplexity for a sales/events contact, writes to contacts,
// and bumps each affected event to status='enriched'.

import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { verifyCronAuth } from '../../src/lib/cron-auth.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { askPerplexityJSON } from '../../src/lib/perplexity-client.js';
import { isSuppressed } from '../../src/lib/suppression-check.js';
import {
  ENRICH_SYSTEM_PROMPT,
  buildEnrichPrompt,
} from '../../src/lib/prompts/enrich-contacts.js';

const MAX_VENUES_PER_RUN = 15;
const SLEEP_BETWEEN_CALLS_MS = 1000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!verifyCronAuth(req)) {
    return res.status(401).send('Unauthorized');
  }

  const runId = await startRun('enrichment');
  const errors = [];
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let contactsCreated = 0;
  let eventsAdvanced = 0;

  try {
    // Pull every event in 'discovered' status. We'll group by venue so we
    // only ask Perplexity once per venue and reuse the contact across the
    // venue's events.
    const { data: discoveredEvents, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id, venue_id, name, event_date, score')
      .eq('status', 'discovered')
      .order('score', { ascending: false })
      .limit(200);

    if (eventErr) throw new Error(`Failed to load events: ${eventErr.message}`);

    if (!discoveredEvents || discoveredEvents.length === 0) {
      await finishRun(runId, 'success', { notes: 'No discovered events to enrich.' });
      return res.status(200).json({ ok: true, message: 'Nothing to enrich' });
    }

    // Group event IDs by venue
    const venueIdToEventIds = new Map();
    for (const ev of discoveredEvents) {
      const arr = venueIdToEventIds.get(ev.venue_id) ?? [];
      arr.push(ev.id);
      venueIdToEventIds.set(ev.venue_id, arr);
    }

    const venueIds = [...venueIdToEventIds.keys()].slice(0, MAX_VENUES_PER_RUN);

    // Load venue details + check for any existing contact
    const { data: venues, error: venueErr } = await supabaseAdmin
      .from('venues')
      .select('id, name, city, type, website')
      .in('id', venueIds);

    if (venueErr) throw new Error(`Failed to load venues: ${venueErr.message}`);

    // Find venues that already have at least one contact — skip Perplexity for those
    const { data: existingContacts, error: contactErr } = await supabaseAdmin
      .from('contacts')
      .select('id, venue_id, email')
      .in('venue_id', venueIds);

    if (contactErr) throw new Error(`Failed to load contacts: ${contactErr.message}`);

    const venuesWithContacts = new Set((existingContacts ?? []).map(c => c.venue_id));

    console.log(`[enrich-contacts] ${venues.length} venues queued; ${venuesWithContacts.size} already have contacts`);

    for (const venue of venues) {
      processed++;
      const eventIds = venueIdToEventIds.get(venue.id) ?? [];

      try {
        // Skip Perplexity if we already have a contact for this venue
        if (venuesWithContacts.has(venue.id)) {
          const { error: bumpErr } = await supabaseAdmin
            .from('events')
            .update({ status: 'enriched' })
            .in('id', eventIds);
          if (bumpErr) throw new Error(`Bump events: ${bumpErr.message}`);

          eventsAdvanced += eventIds.length;
          succeeded++;
          console.log(`[enrich-contacts] ${venue.name}: reused existing contact (${eventIds.length} events)`);
          continue;
        }

        // Ask Perplexity for the venue's events/sales contact
        const userPrompt = buildEnrichPrompt(venue);
        const { data: contactData, citations } = await askPerplexityJSON(
          ENRICH_SYSTEM_PROMPT,
          userPrompt,
          { maxTokens: 1500 }
        );

        if (!contactData || typeof contactData !== 'object') {
          throw new Error('Perplexity returned non-object response');
        }

        const email = contactData.email?.toLowerCase().trim();

        if (!email || !contactData.source_url) {
          console.log(`[enrich-contacts] ${venue.name}: no contact found`);
          // Don't advance the event — leave it 'discovered' so a future
          // run with better data or a different model can try again.
          succeeded++;
          continue;
        }

        // Suppression check — never write an already-suppressed address as a fresh lead
        if (await isSuppressed(email)) {
          console.log(`[enrich-contacts] ${venue.name}: ${email} is suppressed, skipping`);
          succeeded++;
          continue;
        }

        // Insert the contact
        const { error: insertErr } = await supabaseAdmin
          .from('contacts')
          .insert({
            venue_id: venue.id,
            name: contactData.name?.slice(0, 200) ?? null,
            role: contactData.role?.slice(0, 200) ?? null,
            email,
            source_url: contactData.source_url.slice(0, 1000),
            verified_status: 'unverified',
            raw_payload: { perplexity_response: contactData, citations },
          });

        if (insertErr) {
          // 23505 = unique violation; treat as already-known and continue
          if (insertErr.code !== '23505') {
            throw new Error(`Insert contact: ${insertErr.message}`);
          }
        } else {
          contactsCreated++;
        }

        // Advance every event for this venue
        const { error: bumpErr } = await supabaseAdmin
          .from('events')
          .update({ status: 'enriched' })
          .in('id', eventIds);
        if (bumpErr) throw new Error(`Bump events: ${bumpErr.message}`);

        eventsAdvanced += eventIds.length;
        succeeded++;
        console.log(`[enrich-contacts] ${venue.name}: contact saved, ${eventIds.length} events advanced`);

      } catch (err) {
        failed++;
        const msg = `${venue.name}: ${err.message}`;
        console.error(`[enrich-contacts] ${msg}`);
        errors.push(msg);
      }

      if (processed < venues.length) {
        await sleep(SLEEP_BETWEEN_CALLS_MS);
      }
    }

    await finishRun(runId, failed === 0 ? 'success' : 'partial', {
      processed,
      succeeded,
      failed,
      errorLog: errors.length > 0 ? errors : null,
      notes: `${contactsCreated} new contacts, ${eventsAdvanced} events advanced to enriched`,
    });

    return res.status(200).json({
      ok: true,
      processed,
      succeeded,
      failed,
      contactsCreated,
      eventsAdvanced,
    });

  } catch (err) {
    console.error('[enrich-contacts] Fatal error:', err);
    await finishRun(runId, 'failed', {
      processed,
      succeeded,
      failed,
      errorLog: { fatal: err.message, errors },
    });
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export const config = {
  maxDuration: 300,
};
