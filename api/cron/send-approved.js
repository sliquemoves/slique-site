// api/cron/send-approved.js
// Vercel cron handler — runs daily.
// Sends every approved draft via Resend, snapshots the message,
// updates the pipeline, and respects suppressions + a daily cap.

import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { verifyCronAuth } from '../../src/lib/cron-auth.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { sendOutreachEmail } from '../../src/lib/resend-client.js';
import { isSuppressed } from '../../src/lib/suppression-check.js';

const DEFAULT_DAILY_LIMIT = 5;
const SLEEP_BETWEEN_SENDS_MS = 1500;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Tiny HTML escape for the body wrapper. The draft body is plain text
// with \n\n paragraph separators; we never trust it as HTML.
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(bodyText, unsubscribeUrl) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const signature = `
<p style="margin:24px 0 0 0;">Cyril<br>
Slique — Twin Cities Chauffeur<br>
<a href="https://sliquemoves.com" style="color:#000;">sliquemoves.com</a></p>`;

  const footer = `
<p style="font-size:11px;color:#999;margin-top:36px;">
  If you'd rather not hear from us, <a href="${unsubscribeUrl}" style="color:#999;">unsubscribe here</a>.
</p>`;

  return `<!doctype html><html><body style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#222;max-width:560px;">
${paragraphs}${signature}${footer}
</body></html>`;
}

function buildText(bodyText, unsubscribeUrl) {
  return `${bodyText}

—
Cyril
Slique — Twin Cities Chauffeur
sliquemoves.com

To unsubscribe: ${unsubscribeUrl}`;
}

function unsubscribeUrlFor(email) {
  const base = process.env.PUBLIC_SITE_URL ?? 'https://sliquemoves.com';
  return `${base}/api/webhooks/unsubscribe?email=${encodeURIComponent(email)}`;
}

export default async function handler(request) {
  if (!verifyCronAuth(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const dailyLimit = Number(process.env.SEND_DAILY_LIMIT ?? DEFAULT_DAILY_LIMIT);

  const runId = await startRun('sending');
  const errors = [];
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let suppressedCount = 0;

  try {
    const { data: drafts, error: draftErr } = await supabaseAdmin
      .from('email_drafts')
      .select('id, event_id, contact_id, subject, body, status')
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(dailyLimit);

    if (draftErr) throw new Error(`Failed to load drafts: ${draftErr.message}`);

    if (!drafts || drafts.length === 0) {
      await finishRun(runId, 'success', { notes: 'No approved drafts to send.' });
      return Response.json({ ok: true, message: 'Nothing to send', dailyLimit });
    }

    // Pull every contact + event referenced by these drafts so we can snapshot
    const contactIds = [...new Set(drafts.map(d => d.contact_id))];
    const eventIds = [...new Set(drafts.map(d => d.event_id))];

    const [{ data: contacts }, { data: events }] = await Promise.all([
      supabaseAdmin.from('contacts').select('id, email, name, role').in('id', contactIds),
      supabaseAdmin.from('events').select('id').in('id', eventIds),
    ]);

    const contactById = new Map((contacts ?? []).map(c => [c.id, c]));
    const eventIdSet = new Set((events ?? []).map(e => e.id));

    console.log(`[send-approved] ${drafts.length} approved drafts (limit ${dailyLimit})`);

    for (const draft of drafts) {
      processed++;

      try {
        const contact = contactById.get(draft.contact_id);
        if (!contact) throw new Error(`Missing contact ${draft.contact_id}`);
        if (!eventIdSet.has(draft.event_id)) throw new Error(`Missing event ${draft.event_id}`);

        const toEmail = contact.email?.toLowerCase().trim();
        if (!toEmail) throw new Error('Contact has no email');

        // Re-check suppressions at send time. If newly suppressed, mark draft rejected.
        if (await isSuppressed(toEmail)) {
          await supabaseAdmin
            .from('email_drafts')
            .update({ status: 'rejected', rejection_reason: 'suppressed_at_send' })
            .eq('id', draft.id);
          suppressedCount++;
          succeeded++;
          console.log(`[send-approved] draft ${draft.id}: suppressed at send, marked rejected`);
          continue;
        }

        const unsubUrl = unsubscribeUrlFor(toEmail);
        const html = buildHtml(draft.body, unsubUrl);
        const text = buildText(draft.body, unsubUrl);

        const result = await sendOutreachEmail({
          to: toEmail,
          subject: draft.subject,
          html,
          text,
        });

        if (!result.success) {
          // sendOutreachEmail also performs an internal isSuppressed check;
          // if that one short-circuited, treat the same as above.
          if (result.suppressed) {
            await supabaseAdmin
              .from('email_drafts')
              .update({ status: 'rejected', rejection_reason: 'suppressed_at_send' })
              .eq('id', draft.id);
            suppressedCount++;
            succeeded++;
            continue;
          }
          // Real failure — leave draft 'approved' for retry tomorrow
          throw new Error(result.error ?? 'Resend send failed');
        }

        const sentAt = new Date().toISOString();

        // Snapshot — these never change even if drafts/contacts are later edited
        const { error: sendInsertErr } = await supabaseAdmin
          .from('email_sends')
          .insert({
            draft_id: draft.id,
            event_id: draft.event_id,
            contact_id: draft.contact_id,
            resend_message_id: result.messageId,
            sent_at: sentAt,
            snapshot_to_email: toEmail,
            snapshot_subject: draft.subject,
            snapshot_body: draft.body,
          });

        if (sendInsertErr) throw new Error(`Insert email_sends: ${sendInsertErr.message}`);

        // Bump draft → sent, event → sent, touch contact.last_contacted_at
        const [d1, d2, d3] = await Promise.all([
          supabaseAdmin.from('email_drafts').update({ status: 'sent' }).eq('id', draft.id),
          supabaseAdmin.from('events').update({ status: 'sent' }).eq('id', draft.event_id),
          supabaseAdmin.from('contacts').update({ last_contacted_at: sentAt }).eq('id', draft.contact_id),
        ]);

        if (d1.error) console.error('[send-approved] bump draft:', d1.error.message);
        if (d2.error) console.error('[send-approved] bump event:', d2.error.message);
        if (d3.error) console.error('[send-approved] touch contact:', d3.error.message);

        succeeded++;
        console.log(`[send-approved] sent draft ${draft.id} to ${toEmail}`);

      } catch (err) {
        failed++;
        const msg = `draft ${draft.id}: ${err.message}`;
        console.error(`[send-approved] ${msg}`);
        errors.push(msg);
      }

      if (processed < drafts.length) {
        await sleep(SLEEP_BETWEEN_SENDS_MS);
      }
    }

    await finishRun(runId, failed === 0 ? 'success' : 'partial', {
      processed,
      succeeded,
      failed,
      errorLog: errors.length > 0 ? errors : null,
      notes: `Sent ${succeeded - suppressedCount}, suppressed ${suppressedCount}, failed ${failed}, daily limit ${dailyLimit}`,
    });

    return Response.json({
      ok: true,
      processed,
      succeeded,
      failed,
      suppressed: suppressedCount,
      dailyLimit,
    });

  } catch (err) {
    console.error('[send-approved] Fatal error:', err);
    await finishRun(runId, 'failed', {
      processed,
      succeeded,
      failed,
      errorLog: { fatal: err.message, errors },
    });
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export const config = {
  maxDuration: 300,
};
