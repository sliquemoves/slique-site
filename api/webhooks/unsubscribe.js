// api/webhooks/unsubscribe.js
// Public, no-auth GET endpoint linked from every outreach footer.
// Adds the email to the suppressions table and returns a styled
// confirmation page in Slique's black-and-white aesthetic.

import { addSuppression } from '../../src/lib/suppression-check.js';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage({ heading, body, accent = '#ffffff' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slique — ${escapeHtml(heading)}</title>
<style>
  html,body { margin:0; padding:0; background:#000; color:#fff; min-height:100%; font-family: system-ui, -apple-system, sans-serif; }
  .wrap { max-width:520px; margin:0 auto; padding:80px 24px; text-align:center; }
  .eyebrow { font-size:9px; letter-spacing:0.5em; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:18px; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight:300; font-size:34px; letter-spacing:0.04em; color:${accent}; margin:0 0 24px 0; }
  p  { font-size:15px; line-height:1.6; color:rgba(255,255,255,0.7); margin:0 0 18px 0; }
  .rule { width:40px; height:1px; background:rgba(255,255,255,0.2); margin:32px auto; }
  a { color:#fff; text-decoration:underline; text-decoration-color:rgba(255,255,255,0.4); text-underline-offset:3px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">Slique Moves</div>
  <h1>${escapeHtml(heading)}</h1>
  <div class="rule"></div>
  ${body}
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  const raw = (req.query?.email ?? '').toString();
  const email = raw.toLowerCase().trim();

  if (!email || !EMAIL_RX.test(email)) {
    const html = renderPage({
      heading: 'Invalid request',
      body: `<p>That unsubscribe link doesn't include a valid email address. If you'd still like to opt out, reply to any message from us with the word <em>unsubscribe</em>.</p>`,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(html);
  }

  try {
    await addSuppression(email, 'unsubscribed', 'Public unsubscribe link');
  } catch (err) {
    console.error('[unsubscribe] Failed to add suppression:', err);
    // Still show success — we don't want to leak failure modes to the public,
    // and addSuppression internally swallows DB errors with logging.
  }

  const html = renderPage({
    heading: 'You\'re unsubscribed',
    body: `
      <p><strong style="color:#fff;">${escapeHtml(email)}</strong> won\'t receive any more outreach from Slique.</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);">If this was a mistake or you change your mind, just reply to any prior message and we\'ll re-enable contact.</p>
      <p style="margin-top:36px;"><a href="https://sliquemoves.com">Return to sliquemoves.com</a></p>
    `,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
}
