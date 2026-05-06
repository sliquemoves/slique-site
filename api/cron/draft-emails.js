// api/cron/draft-emails.js
// Vercel cron handler — runs daily.
// For each enriched event, asks Claude to write a short, specific
// outreach email and inserts it into email_drafts as pending_review.

import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { verifyCronAuth } from '../../src/lib/cron-auth.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { askClaudeJSON } from '../../src/lib/claude-client.js';
import {
  DRAFT_SYSTEM_PROMPT,
  buildDraftPrompt,
  DRAFT_PROMPT_VERSION,
} from '../../src/lib/prompts/draft-emails.js';

const MAX_DRAFTS_PER_RUN = 20;
const MODEL = 'claude-sonnet-4-5';
const SLEEP_BETWEEN_CALLS_MS = 500;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!verifyCronAuth(req)) {
    return res.status(401).send('Unauthorized');
  }

  const runId = await startRun('drafting');
  const errors = [];
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let draftsCreated = 0;

  try {
    // Pull enriched events that don't already have a draft. Highest score first.
    const { data: events, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('id, venue_id, name, event_date, event_type, artist_or_host, score')
      .eq('status', 'enriched')
      .order('score', { ascending: false })
      .limit(MAX_DRAFTS_PER_RUN);

    if (eventErr) throw new Error(`Failed to load events: ${eventErr.message}`);

    if (!events || events.length === 0) {
      await finishRun(runId, 'success', { notes: 'No enriched events to draft.' });
      return res.status(200).json({ ok: true, message: 'Nothing to draft' });
    }

    const venueIds = [...new Set(events.map(e => e.venue_id))];

    const [{ data: venues, error: venueErr }, { data: contacts, error: contactErr }] = await Promise.all([
      supabaseAdmin.from('venues').select('id, name, city, type').in('id', venueIds),
      supabaseAdmin.from('contacts').select('id, venue_id, name, role, email').in('venue_id', venueIds),
    ]);

    if (venueErr) throw new Error(`Failed to load venues: ${venueErr.message}`);
    if (contactErr) throw new Error(`Failed to load contacts: ${contactErr.message}`);

    const venueById = new Map((venues ?? []).map(v => [v.id, v]));
    const contactByVenueId = new Map();
    for (const c of contacts ?? []) {
      // First contact per venue wins; we'll improve picking later.
      if (!contactByVenueId.has(c.venue_id)) contactByVenueId.set(c.venue_id, c);
    }

    console.log(`[draft-emails] ${events.length} events queued`);

    for (const event of events) {
      processed++;

      try {
        const venue = venueById.get(event.venue_id);
        const contact = contactByVenueId.get(event.venue_id);

        if (!venue) throw new Error('Venue not found');
        if (!contact) throw new Error('No contact for venue (event should be discovered, not enriched)');

        const userPrompt = buildDraftPrompt({ venue, event, contact });
        const draft = await askClaudeJSON(DRAFT_SYSTEM_PROMPT, userPrompt, {
          model: MODEL,
          maxTokens: 800,
        });

        if (!draft?.subject || !draft?.body) {
          throw new Error('Claude returned a draft missing subject or body');
        }

        const { error: insertErr } = await supabaseAdmin
          .from('email_drafts')
          .insert({
            event_id: event.id,
            contact_id: contact.id,
            subject: draft.subject.slice(0, 300),
            body: draft.body,
            status: 'pending_review',
            model_used: MODEL,
            prompt_version: DRAFT_PROMPT_VERSION,
          });

        if (insertErr) throw new Error(`Insert draft: ${insertErr.message}`);

        const { error: bumpErr } = await supabaseAdmin
          .from('events')
          .update({ status: 'drafted' })
          .eq('id', event.id);

        if (bumpErr) throw new Error(`Bump event: ${bumpErr.message}`);

        draftsCreated++;
        succeeded++;
        console.log(`[draft-emails] ${venue.name} — ${event.name}: drafted`);

      } catch (err) {
        failed++;
        const msg = `event ${event.id} (${event.name}): ${err.message}`;
        console.error(`[draft-emails] ${msg}`);
        errors.push(msg);
      }

      if (processed < events.length) {
        await sleep(SLEEP_BETWEEN_CALLS_MS);
      }
    }

    await finishRun(runId, failed === 0 ? 'success' : 'partial', {
      processed,
      succeeded,
      failed,
      errorLog: errors.length > 0 ? errors : null,
      notes: `${draftsCreated} drafts created`,
    });

    return res.status(200).json({
      ok: true,
      processed,
      succeeded,
      failed,
      draftsCreated,
    });

  } catch (err) {
    console.error('[draft-emails] Fatal error:', err);
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
