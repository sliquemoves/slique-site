// lib/resend-client.js
// Wrapper around Resend's API for sending outreach emails.
// Always sends From: Cyril | Slique <cyril@sliquemoves.com>
// Always sets Reply-To: cyril@sliquemoves.com
// Always checks suppression list before sending.

import { isSuppressed } from './suppression-check.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Cyril | Slique <cyril@sliquemoves.com>';
const REPLY_TO = 'cyril@sliquemoves.com';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing env var: RESEND_API_KEY');
}

/**
 * Send a single outreach email via Resend.
 * Checks suppression list before sending.
 *
 * @param {{ to: string, subject: string, html: string, text: string }} params
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, suppressed?: boolean }>}
 */
export async function sendOutreachEmail({ to, subject, html, text }) {
  // Always check suppression first
  const suppressed = await isSuppressed(to);
  if (suppressed) {
    console.log(`[resend-client] Skipping suppressed address: ${to}`);
    return { success: false, suppressed: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      html,
      text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`[resend-client] Send failed to ${to}:`, data);
    return { success: false, error: data.message ?? 'Unknown Resend error' };
  }

  console.log(`[resend-client] Sent to ${to}: ${data.id}`);
  return { success: true, messageId: data.id };
}
