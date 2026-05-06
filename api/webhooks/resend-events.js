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

// Maps the Resend event type to our email_events.event_type column,
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

// Read the raw request body as a string. We need the exact bytes Resend signed,
// so we disable bodyParser below and stream the body ourselves.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const rawBody = await readRawBody(req);

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  const ok = verifySvixSignature({
    secret: process.env.RESEND_WEBHOOK_SECRET,
    svixId,
    svixTimestamp,
    svixSignature,
    rawBody,
  });

  if (!ok) {
    console.error('[resend-events] Bad signature');
    return res.status(401).send('Bad signature');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const runId = await startRun('webhook_processing');

  try {
    const resendType = payload?.type;
    const messageId = payload?.data?.email_id ?? payload?.data?.id;

    if (!messageId) {
      await finishRun(runId, 'failed', {
        notes: `No email_id on payload (type=${resendType})`,
      });
      return res.status(200).json({ ok: true, ignored: true });
    }

    const { type, suppress } = classifyEvent(resendType);

    const { data: send, error: sendErr } = await supabaseAdmin
      .from('email_sends')
      .select('id, to_email')
      .eq('resend_message_id', messageId)
      .maybeSingle();

    if (sendErr) throw new Error(`Lookup email_sends: ${sendErr.message}`);

    if (!send) {
      // Could be a stray event for a message we never recorded; ignore but ack.
      console.log(`[resend-events] No matching send for resend id ${messageId} (${resendType})`);
      await finishRun(runId, 'success', {
        notes: `No matching send for ${messageId} (${resendType})`,
      });
      return res.status(200).json({ ok: true, matched: false });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('email_events')
      .insert({
        send_id: send.id,
        event_type: type,
        occurred_at: payload?.created_at ?? new Date().toISOString(),
        payload,
      });

    if (insertErr) throw new Error(`Insert email_events: ${insertErr.message}`);

    if (suppress && send.to_email) {
      await addSuppression(
        send.to_email,
        suppress,
        `Auto-added by resend-events webhook (${resendType})`
      );
    }

    await finishRun(runId, 'success', {
      processed: 1,
      succeeded: 1,
      notes: `${resendType} for ${send.to_email}`,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[resend-events] Error:', err);
    await finishRun(runId, 'failed', { errorLog: { fatal: err.message } });
    return res.status(500).json({ ok: false, error: err.message });
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
