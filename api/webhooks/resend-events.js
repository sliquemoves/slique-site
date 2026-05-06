// api/webhooks/resend-events.js
// Receives Resend webhook events (delivered/opened/clicked/bounced/complained).
// Verifies the Svix signature, looks up the email_sends row by
// resend_message_id, writes to email_events, and on hard bounces
// or complaints adds the recipient to suppressions.

import crypto from 'node:crypto';
import { supabaseAdmin } from '../../src/lib/supabase-admin.js';
import { startRun, finishRun } from '../../src/lib/agent-run-logger.js';
import { addSuppression } from '../../src/lib/suppression-check.js';

// Resend signs webhooks using Svix. The secret is provided when you create
// the webhook in the Resend dashboard and is prefixed with "whsec_".
function verifySvixSignature({ secret, svixId, svixTimestamp, svixSignature, rawBody }) {
  if (!secret || !svixId || !svixTimestamp || !svixSignature || !rawBody) return false;

  const stripped = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let key;
  try {
    key = Buffer.from(stripped, 'base64');
  } catch {
    return false;
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', key).update(signedPayload).digest('base64');

  // svix-signature header is a space-separated list of "v1,<sig>" entries
  const provided = svixSignature.split(' ').map(s => s.trim().split(',')[1]).filter(Boolean);

  return provided.some(sig => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

// Maps the Resend event type to our email_events.type column,
// and flags whether it warrants adding the recipient to suppressions.
function classifyEvent(resendType) {
  switch (resendType) {
    case 'email.sent':         return { type: 'sent',        suppress: null };
    case 'email.delivered':    return { type: 'delivered',   suppress: null };
    case 'email.delivery_delayed': return { type: 'delayed', suppress: null };
    case 'email.opened':       return { type: 'opened',      suppress: null };
    case 'email.clicked':      return { type: 'clicked',     suppress: null };
    case 'email.bounced':      return { type: 'bounced',     suppress: 'hard_bounce' };
    case 'email.complained':   return { type: 'complained',  suppress: 'complaint' };
    default:                   return { type: resendType,    suppress: null };
  }
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await request.text();

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  const ok = verifySvixSignature({
    secret: process.env.RESEND_WEBHOOK_SECRET,
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody,
  });

  if (!ok) {
    console.error('[resend-events] Bad signature');
    return new Response('Bad signature', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const runId = await startRun('webhook_processing');

  try {
    const resendType = payload?.type;
    const messageId = payload?.data?.email_id ?? payload?.data?.id;

    if (!messageId) {
      await finishRun(runId, 'failed', {
        notes: `No email_id on payload (type=${resendType})`,
      });
      return Response.json({ ok: true, ignored: true });
    }

    const { type, suppress } = classifyEvent(resendType);

    const { data: send, error: sendErr } = await supabaseAdmin
      .from('email_sends')
      .select('id, snapshot_to_email')
      .eq('resend_message_id', messageId)
      .maybeSingle();

    if (sendErr) throw new Error(`Lookup email_sends: ${sendErr.message}`);

    if (!send) {
      // Could be a stray event for a message we never recorded; ignore but ack.
      console.log(`[resend-events] No matching send for resend id ${messageId} (${resendType})`);
      await finishRun(runId, 'success', {
        notes: `No matching send for ${messageId} (${resendType})`,
      });
      return Response.json({ ok: true, matched: false });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('email_events')
      .insert({
        send_id: send.id,
        type,
        occurred_at: payload?.created_at ?? new Date().toISOString(),
        payload,
      });

    if (insertErr) throw new Error(`Insert email_events: ${insertErr.message}`);

    if (suppress && send.snapshot_to_email) {
      await addSuppression(
        send.snapshot_to_email,
        suppress,
        `Auto-added by resend-events webhook (${resendType})`
      );
    }

    await finishRun(runId, 'success', {
      processed: 1,
      succeeded: 1,
      notes: `${resendType} for ${send.snapshot_to_email}`,
    });

    return Response.json({ ok: true });

  } catch (err) {
    console.error('[resend-events] Error:', err);
    await finishRun(runId, 'failed', { errorLog: { fatal: err.message } });
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// Vercel only sends a Buffer to handlers if we read .text() — which we do.
// Disable Vercel's automatic body parsing so signature verification works
// against the exact raw bytes Resend signed.
export const config = {
  api: {
    bodyParser: false,
  },
};
