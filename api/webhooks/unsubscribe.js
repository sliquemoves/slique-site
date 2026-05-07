// api/webhooks/unsubscribe.js
// Public, no-auth GET endpoint linked from every outreach footer.
// Adds the email to the suppressions table and returns a branded
// confirmation page (black, Cormorant Garamond, gold accent).

import { addSuppression } from '../../src/lib/suppression-check.js';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOLD = '#C9A961';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render the branded unsubscribe page.
 * Two states share the same layout, only the headline + body copy change.
 */
function renderPage({ headline, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Slique</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #000;
    color: #fff;
    min-height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: 'Cormorant Garamond', Georgia, serif;
  }
  .frame {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
  }
  .panel {
    width: 100%;
    max-width: 600px;
    text-align: center;
  }
  .wordmark {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 300;
    font-size: clamp(56px, 13vw, 104px);
    letter-spacing: 0.18em;
    color: #fff;
    text-transform: uppercase;
    margin: 0;
    line-height: 1;
  }
  .accent {
    width: 64px;
    height: 1px;
    background: ${GOLD};
    margin: 36px auto 40px auto;
  }
  .headline {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 300;
    font-style: italic;
    font-size: clamp(24px, 4.6vw, 32px);
    letter-spacing: 0.04em;
    color: #fff;
    margin: 0 0 22px 0;
  }
  .body {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 400;
    font-size: clamp(15px, 2.6vw, 18px);
    line-height: 1.65;
    color: rgba(255,255,255,0.72);
    margin: 0 0 56px 0;
    letter-spacing: 0.015em;
  }
  .return {
    display: inline-block;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 10px;
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    border-bottom: 1px solid rgba(201,169,97,0.35);
    padding-bottom: 4px;
    transition: color 200ms ease, border-color 200ms ease;
  }
  .return:hover, .return:focus-visible {
    color: ${GOLD};
    border-color: ${GOLD};
    outline: none;
  }
  @media (max-width: 480px) {
    .frame { padding: 28px 18px; }
    .accent { margin: 28px auto 32px auto; }
    .body { margin-bottom: 44px; }
  }
</style>
</head>
<body>
<div class="frame">
  <div class="panel">
    <h1 class="wordmark">Slique</h1>
    <div class="accent" aria-hidden="true"></div>
    <p class="headline">${headline}</p>
    <p class="body">${body}</p>
    <a class="return" href="https://sliquemoves.com">Return to sliquemoves.com</a>
  </div>
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  const raw = (req.query?.email ?? '').toString();
  const email = raw.toLowerCase().trim();

  // State 2 — missing or malformed email param.
  if (!email || !EMAIL_RX.test(email)) {
    const html = renderPage({
      headline: 'Unsubscribe link is invalid or expired.',
      body: 'Reply to any of our emails to be removed.',
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).send(html);
  }

  // State 1 — happy path. Add to suppressions, swallow DB errors so the
  // recipient still sees the confirmation (we never want to leak failure
  // details on a public endpoint).
  try {
    await addSuppression(email, 'unsubscribed', 'Public unsubscribe link');
  } catch (err) {
    console.error('[unsubscribe] Failed to add suppression:', err);
  }

  const html = renderPage({
    headline: 'You’ve been unsubscribed.',
    body: `We won’t reach out again. If this was a mistake, just reply to any past message.`,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
}
