// api/applications.js
// POST endpoint for the /programs Phoenix driver-recruitment landing page.
// Receives an application from the on-page form, sends a notification
// email to the admin via Resend, and (optionally) a confirmation email
// to the applicant. Mirrors the pattern in api/send-booking-emails.js so
// deliverability behaves the same (from-name, reply-to, plain-text fallback,
// list-unsubscribe).

const FROM_EMAIL = 'programs@sliquemoves.com';
const FROM_NAME = 'Slique Programs';
// Notification destination — override via APPLICATIONS_TO env var per deploy.
const NOTIFICATION_EMAIL = process.env.APPLICATIONS_TO || 'admin@sliquemoves.com';
const REPLY_TO = 'admin@sliquemoves.com';

const DRIVING_LABELS = {
  yes: 'Currently driving',
  no: 'Not driving',
  approved_inactive: 'Approved but not active',
};

const EXPERIENCE_LABELS = {
  '1-2': '1–2 years',
  '3-5': '3–5 years',
  '6-10': '6–10 years',
  '10+': '10+ years',
};

const START_LABELS = {
  this_week: 'This week',
  two_weeks: 'Within 2 weeks',
  one_month: 'Within a month',
  exploring: 'Just exploring',
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateRef(seed) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'PHX-';
  const s = String(seed || Date.now()).replace(/-/g, '');
  for (let i = 0; i < 6; i++) ref += chars[parseInt(s[i] || '0', 16) % chars.length];
  return ref;
}

async function sendResend(apiKey, { to, subject, html, text, replyTo, headers }) {
  const body = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  return await res.json();
}

// ─── Internal notification email ─────────────────────────────────────────────
function teamHtml(app, refCode) {
  const row = (label, value) => `
    <tr>
      <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#bdbdbd;font-family:Arial,Helvetica,sans-serif;width:38%;vertical-align:top">${label}</td>
      <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08);font-size:15px;font-family:'Cormorant Garamond',Georgia,serif;color:#ffffff">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>New Driver Application</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.2)">
    <tr><td style="height:3px;background:#C66B3D;line-height:3px;font-size:0">&nbsp;</td></tr>
    <tr><td style="padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.1)">
      <div style="font-size:9px;letter-spacing:0.5em;text-transform:uppercase;color:#C66B3D;margin-bottom:8px">Phoenix · Slique Programs</div>
      <h1 style="font-size:24px;font-weight:300;color:#ffffff;letter-spacing:0.04em;margin:0;font-family:'Cormorant Garamond',Georgia,serif">New Driver <em>Application</em></h1>
      <div style="margin-top:10px"><span style="display:inline-block;padding:5px 14px;background:#C66B3D;color:#000000;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;font-weight:600">Lead</span></div>
    </td></tr>
    <tr><td style="padding:0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${row('Reference', `<span style="font-family:'Courier New',monospace;letter-spacing:0.2em">${refCode}</span>`)}
        ${row('Name', escapeHtml(app.full_name))}
        ${row('Phone', `<a href="tel:${escapeHtml(app.phone)}" style="color:#ffffff;text-decoration:none">${escapeHtml(app.phone)}</a>`)}
        ${row('Email', `<a href="mailto:${escapeHtml(app.email)}" style="color:#ffffff;text-decoration:none">${escapeHtml(app.email)}</a>`)}
        ${row('Currently driving', escapeHtml(DRIVING_LABELS[app.currently_driving] || app.currently_driving || '—'))}
        ${row('Experience', escapeHtml(EXPERIENCE_LABELS[app.experience] || app.experience || '—'))}
        ${row('Start when', escapeHtml(START_LABELS[app.start_when] || app.start_when || '—'))}
        ${app.notes ? row('Notes', escapeHtml(app.notes).replace(/\n/g, '<br>')) : ''}
      </table>
    </td></tr>
    <tr><td style="padding:28px 36px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <a href="mailto:${escapeHtml(app.email)}" style="display:inline-block;padding:12px 28px;background:#C66B3D;color:#000000;border:1px solid #C66B3D;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;text-decoration:none;font-weight:700">Reply to Applicant</a>
    </td></tr>
    <tr><td style="padding:18px 36px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <p style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0">Slique Programs · Internal</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function teamText(app, refCode) {
  return `SLIQUE PROGRAMS — NEW PHOENIX DRIVER APPLICATION

Reference: ${refCode}

Name: ${app.full_name}
Phone: ${app.phone}
Email: ${app.email}
Currently driving: ${DRIVING_LABELS[app.currently_driving] || app.currently_driving || '—'}
Experience: ${EXPERIENCE_LABELS[app.experience] || app.experience || '—'}
Start when: ${START_LABELS[app.start_when] || app.start_when || '—'}
${app.notes ? `\nNotes:\n${app.notes}\n` : ''}
Reply: mailto:${app.email}`;
}

// ─── Applicant confirmation email ────────────────────────────────────────────
function applicantHtml(app, refCode) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Application received</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.2)">
    <tr><td style="height:3px;background:#C66B3D;line-height:3px;font-size:0">&nbsp;</td></tr>
    <tr><td style="padding:36px 36px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">
      <div style="font-size:10px;letter-spacing:0.5em;text-transform:uppercase;color:#C66B3D;margin-bottom:14px">Phoenix · Slique Moves</div>
      <h1 style="font-size:28px;font-weight:300;color:#ffffff;letter-spacing:0.04em;margin:0;font-family:'Cormorant Garamond',Georgia,serif">Application <em>received</em></h1>
      <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Reference ${refCode}</p>
    </td></tr>
    <tr><td style="padding:28px 36px;color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;font-family:Georgia,serif">
      <p style="margin:0 0 16px">Hi ${escapeHtml(app.full_name.split(' ')[0])},</p>
      <p style="margin:0 0 16px">Thanks for applying to drive with Slique Moves in Phoenix. We've received your application and will be in touch within 48 hours to verify your license and rideshare eligibility.</p>
      <p style="margin:0 0 16px">If you have questions in the meantime, just reply to this email.</p>
      <p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px">— Slique Moves</p>
    </td></tr>
    <tr><td style="padding:18px 36px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <p style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin:0">Slique Moves · Phoenix Driver Program</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function applicantText(app, refCode) {
  return `SLIQUE MOVES — PHOENIX DRIVER APPLICATION

Reference: ${refCode}

Hi ${app.full_name.split(' ')[0]},

Thanks for applying to drive with Slique Moves in Phoenix. We've received
your application and will be in touch within 48 hours to verify your
license and rideshare eligibility.

If you have questions in the meantime, just reply to this email.

— Slique Moves`;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const body = req.body || {};
    const app = {
      full_name: String(body.full_name || '').trim().slice(0, 200),
      phone: String(body.phone || '').trim().slice(0, 40),
      email: String(body.email || '').trim().toLowerCase().slice(0, 200),
      currently_driving: String(body.currently_driving || '').trim().slice(0, 40),
      experience: String(body.experience || '').trim().slice(0, 20),
      start_when: String(body.start_when || '').trim().slice(0, 40),
      notes: String(body.notes || '').trim().slice(0, 2000),
    };

    // Minimal server-side validation
    if (!app.full_name || !app.phone || !app.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const refCode = generateRef(Date.now());

    const teamSubject = `New Phoenix driver applicant: ${app.full_name}`;
    const applicantSubject = `Application received — ${refCode}`;

    const [teamResult, applicantResult] = await Promise.allSettled([
      sendResend(apiKey, {
        to: NOTIFICATION_EMAIL,
        subject: teamSubject,
        html: teamHtml(app, refCode),
        text: teamText(app, refCode),
        replyTo: app.email,
      }),
      sendResend(apiKey, {
        to: app.email,
        subject: applicantSubject,
        html: applicantHtml(app, refCode),
        text: applicantText(app, refCode),
        replyTo: REPLY_TO,
        headers: {
          'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        },
      }),
    ]);

    // The team notification is the one that matters; applicant email is best-effort.
    if (teamResult.status === 'rejected') {
      console.error('[applications] Team notify failed:', teamResult.reason);
      return res.status(502).json({ error: 'Failed to deliver application' });
    }

    return res.status(200).json({
      ok: true,
      reference: refCode,
      applicantEmail: applicantResult.status,
    });
  } catch (err) {
    console.error('[applications] Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
