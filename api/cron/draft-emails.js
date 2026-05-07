// api/cron/draft-emails.js
// Vercel cron handler — runs daily.
// For each enriched event, asks Claude to write a short, specific
// outreach email and inserts it into email_drafts as pending_review.

import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { verifyCronAuth } from '../../src/lib/cron-auth.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { askClaudeJSON, DEFAULT_MODEL } from '../../src/lib/claude-client.js';
import { sanitizeDraft } from '../../src/lib/sanitize-draft.js';
import {
  DRAFT_SYSTEM_PROMPT,
  buildDraftPrompt,
  DRAFT_PROMPT_VERSION,
} from '../../src/lib/prompts/draft-emails.js';

const MAX_DRAFTS_PER_RUN = 20;
const SLEEP_BETWEEN_CALLS_MS = 500;
// Don't draft a second email to the same contact inside this window.
// Counts existing drafts in pending_review / approved / sent.
const CONTACT_COOLDOWN_DAYS = 30;

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
  let skippedRecentContact = 0;
  let dedupedDrafts = 0;

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

    // Cooldown pre-check: pull every "recent" draft for the candidate contacts
    // in one query, then skip any contact already in the set during the loop.
    // Also catches same-venue dupes inside this run — the loop is sorted by
    // score desc, so the first event for a venue wins and we add its contact
    // to the set before processing the next event for the same venue.
    const candidateContactIds = [
      ...new Set(
        events
          .map(e => contactByVenueId.get(e.venue_id)?.id)
          .filter(Boolean)
      ),
    ];

    const cooldownCutoff = new Date(
      Date.now() - CONTACT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const contactsWithRecentDraft = new Set();
    if (candidateContactIds.length > 0) {
      const { data: recentDrafts, error: recentErr } = await supabaseAdmin
        .from('email_drafts')
        .select('contact_id')
        .in('contact_id', candidateContactIds)
        .in('status', ['pending_review', 'approved', 'sent'])
        .gte('created_at', cooldownCutoff);

      if (recentErr) throw new Error(`Failed to load recent drafts: ${recentErr.message}`);
      for (const d of recentDrafts ?? []) contactsWithRecentDraft.add(d.contact_id);
    }

    console.log(`[draft-emails] ${events.length} events queued; ${contactsWithRecentDraft.size} contacts already drafted in last ${CONTACT_COOLDOWN_DAYS}d`);

    for (const event of events) {
      processed++;

      try {
        const venue = venueById.get(event.venue_id);
        const contact = contactByVenueId.get(event.venue_id);

        if (!venue) throw new Error('Venue not found');
        if (!contact) throw new Error('No contact for venue (event should be discovered, not enriched)');

        // Cooldown: skip if this contact already has a recent draft.
        // Leave the event in 'enriched' so it can be revisited after cooldown.
        if (contactsWithRecentDraft.has(contact.id)) {
          skippedRecentContact++;
          succeeded++;
          console.log(`[draft-emails] ${venue.name} — ${event.name}: skipped (contact ${contact.id} drafted in last ${CONTACT_COOLDOWN_DAYS}d)`);
          continue;
        }

        const userPrompt = buildDraftPrompt({ venue, event, contact });
        const draft = await askClaudeJSON(DRAFT_SYSTEM_PROMPT, userPrompt, {
          model: DEFAULT_MODEL,
          maxTokens: 800,
        });

        if (!draft?.subject || !draft?.body) {
          throw new Error('Claude returned a draft missing subject or body');
        }

        // Post-generation safety net — strip em dashes / double-hyphens that
        // sneak past the prompt rules. En dashes (used for ranges) are kept.
        const cleanSubject = sanitizeDraft(draft.subject).slice(0, 300);
        const cleanBody = sanitizeDraft(draft.body);

        const { error: insertErr } = await supabaseAdmin
          .from('email_drafts')
          .insert({
            event_id: event.id,
            contact_id: contact.id,
            subject: cleanSubject,
            body: cleanBody,
            status: 'pending_review',
            model_used: DEFAULT_MODEL,
            prompt_version: DRAFT_PROMPT_VERSION,
          });

        if (insertErr) throw new Error(`Insert draft: ${insertErr.message}`);

        const { error: bumpErr } = await supabaseAdmin
          .from('events')
          .update({ status: 'drafted' })
          .eq('id', event.id);

        if (bumpErr) throw new Error(`Bump event: ${bumpErr.message}`);

        // Mark the contact as "just drafted" so any lower-scored event for
        // the same venue queued later in this run skips on the cooldown check.
        contactsWithRecentDraft.add(contact.id);

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

    // Post-loop dedupe: if any contact has more than one pending_review draft,
    // keep the one whose event has the highest score and delete the rest.
    // Catches races between concurrent runs and any historical leakage.
    try {
      const { data: pending, error: pendingErr } = await supabaseAdmin
        .from('email_drafts')
        .select('id, contact_id, event_id, events ( score )')
        .eq('status', 'pending_review');

      if (pendingErr) throw new Error(`Load pending drafts: ${pendingErr.message}`);

      const byContact = new Map();
      for (const d of pending ?? []) {
        if (!d.contact_id) continue;
        const arr = byContact.get(d.contact_id) ?? [];
        arr.push({
          id: d.id,
          event_id: d.event_id,
          score: d.events?.score ?? 0,
        });
        byContact.set(d.contact_id, arr);
      }

      const draftIdsToDelete = [];
      const eventIdsToRevert = [];
      for (const drafts of byContact.values()) {
        if (drafts.length <= 1) continue;
        // Sort by score desc — first wins, the rest are losers.
        drafts.sort((a, b) => b.score - a.score);
        for (const loser of drafts.slice(1)) {
          draftIdsToDelete.push(loser.id);
          if (loser.event_id) eventIdsToRevert.push(loser.event_id);
        }
      }

      if (draftIdsToDelete.length > 0) {
        const { error: delErr } = await supabaseAdmin
          .from('email_drafts')
          .delete()
          .in('id', draftIdsToDelete);

        if (delErr) throw new Error(`Delete duplicate drafts: ${delErr.message}`);

        if (eventIdsToRevert.length > 0) {
          // Revert the orphaned events to 'enriched' so the pipeline view
          // doesn't show them as drafted when no draft exists for them.
          const { error: revertErr } = await supabaseAdmin
            .from('events')
            .update({ status: 'enriched' })
            .in('id', eventIdsToRevert);
          if (revertErr) console.error(`[draft-emails] Revert orphan events: ${revertErr.message}`);
        }

        dedupedDrafts = draftIdsToDelete.length;
        console.log(`[draft-emails] dedupe removed ${dedupedDrafts} duplicate pending_review drafts`);
      }
    } catch (err) {
      // Dedupe failures are non-fatal — log into the run and continue.
      console.error('[draft-emails] Dedupe step failed:', err);
      errors.push(`dedupe: ${err.message}`);
    }

    await finishRun(runId, failed === 0 ? 'success' : 'partial', {
      processed,
      succeeded,
      failed,
      errorLog: errors.length > 0 ? errors : null,
      notes: `${draftsCreated} drafts created, ${skippedRecentContact} skipped (cooldown), ${dedupedDrafts} deduped`,
    });

    return res.status(200).json({
      ok: true,
      processed,
      succeeded,
      failed,
      draftsCreated,
      skippedRecentContact,
      dedupedDrafts,
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
