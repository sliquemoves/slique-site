// api/send-booking-emails.js
// Sends confirmation emails via Resend.
// Black & white gothic theme. Deliverability-tuned (plain-text fallback,
// natural subject, clean HTML, list-unsubscribe header).

const FROM_EMAIL = 'reservations@sliquemoves.com';
const FROM_NAME = 'Slique Moves';
const NOTIFICATION_EMAIL = 'admin@sliquemoves.com';
const REPLY_TO = 'admin@sliquemoves.com';

const SERVICE_LABELS = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate Travel',
  special_event: 'Special Event',
};

const VEHICLE_LABELS = {
  escalade_suv: 'Escalade SUV',
  mercedes_limo: 'Mercedes Limousine',
  mercedes_sprinter: 'Mercedes Sprinter Van',
  mercedes_amg: 'Mercedes AMG Sedan',
  luxury_sedan: 'Black Luxury Sedan',
  luxury_suv: 'Black Luxury SUV',
};

function generateRef(id) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SLQ-';
  const seed = id ? String(id).replace(/-/g, '') : Date.now().toString(16);
  for (let i = 0; i < 6; i++) ref += chars[parseInt(seed[i] || '0', 16) % chars.length];
  return ref;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function format12Hour(time24) {
  if (!time24) return '';
  const [h] = time24.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

// Reusable detail "bubble" cell for trip info
const bubble = (label, value) => `
  <td style="padding:6px;width:50%;vertical-align:top">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#141414;border:1px solid rgba(255,255,255,0.18)">
      <tr><td style="padding:16px 20px">
        <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#bdbdbd;margin-bottom:8px;font-family:Arial,Helvetica,sans-serif">${label}</div>
        <div style="font-size:17px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;color:#ffffff;letter-spacing:0.02em">${value}</div>
      </td></tr>
    </table>
  </td>
`;

// Full-width bubble (for long values like address)
const wideBubble = (label, value) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#141414;border:1px solid rgba(255,255,255,0.18);margin-bottom:8px">
    <tr><td style="padding:16px 20px">
      <div style="font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#bdbdbd;margin-bottom:8px;font-family:Arial,Helvetica,sans-serif">${label}</div>
      <div style="font-size:17px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;color:#ffffff;letter-spacing:0.02em">${value}</div>
    </td></tr>
  </table>
`;

// Section heading — centered, bright white, with bars on both sides
const sectionHeading = (text) => `
  <div style="text-align:center;margin-bottom:16px">
    <span style="display:inline-block;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:700;border-left:2px solid #ffffff;border-right:2px solid #ffffff;padding:0 14px">${text}</span>
  </div>
`;

// ─── Customer email ──────────────────────────────────────────────────────────
function customerHtml(booking, refCode, confirmationUrl) {
  const dropBubble = booking.dropoff_location ? wideBubble('Destination', booking.dropoff_location) : '';
  const notesBubble = booking.special_requests ? wideBubble('Special Notes', booking.special_requests) : '';

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reservation Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Cormorant Garamond',Georgia,serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000">
<tr><td align="center" style="padding:40px 16px">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.2)">

    <!-- Top accent bar -->
    <tr><td style="height:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6) 30%,#ffffff 50%,rgba(255,255,255,0.6) 70%,transparent);line-height:3px;font-size:0">&nbsp;</td></tr>

    <!-- Header -->
    <tr><td style="padding:40px 48px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">
      <div style="font-size:10px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:24px">Slique Moves</div>

      <!-- Crest -->
      <svg width="64" height="64" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 20px">
        <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.5"/>
        <path d="M28,32 L32,22 L40,28 L48,22 L52,32" fill="none" stroke="#ffffff" stroke-width="1" stroke-linejoin="round"/>
        <rect x="27" y="32" width="26" height="16" rx="0.5" fill="none" stroke="#ffffff" stroke-width="0.8"/>
        <path d="M33,40 L38,45 L48,35" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M32,50 Q40,56 48,50" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.6"/>
      </svg>

      <h1 style="font-size:28px;font-weight:300;color:#ffffff;letter-spacing:0.04em;margin:0;line-height:1.3">Reservation <em style="font-style:italic">Confirmed</em></h1>
      <p style="margin:8px 0 0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.5)">Your journey has been arranged</p>
    </td></tr>

    <!-- Reference -->
    <tr><td style="padding:28px 48px;text-align:center">
      <div style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px">Confirmation Reference</div>
      <div style="font-family:'Courier New',monospace;font-size:24px;letter-spacing:0.25em;color:#ffffff">${refCode}</div>
    </td></tr>

    <!-- Trip details — bubbles -->
    <tr><td style="padding:0 42px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${bubble('Guest', booking.customer_name)}${bubble('Service', SERVICE_LABELS[booking.service_type] || booking.service_type)}</tr>
        <tr>${bubble('Date', formatDate(booking.pickup_date))}${bubble('Time', format12Hour(booking.pickup_time))}</tr>
        <tr>${bubble('Vehicle', VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type)}${bubble('Passengers', booking.passengers)}</tr>
      </table>
      <div style="padding:6px">
        ${wideBubble('Pickup Location', booking.pickup_location)}
        ${dropBubble}
        ${notesBubble}
      </div>
    </td></tr>

    <!-- CONFIRMED badge -->
    <tr><td style="padding:8px 48px 32px;text-align:center">
      <span style="display:inline-block;padding:8px 24px;border:1px solid rgba(255,255,255,0.3);font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#ffffff;background:rgba(255,255,255,0.06)">✦ Confirmed</span>
    </td></tr>

    <!-- Message -->
    <tr><td style="padding:24px 48px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <p style="font-size:14px;font-weight:300;color:rgba(255,255,255,0.5);line-height:1.9;letter-spacing:0.02em;margin:0">
        Our team is preparing for your journey.<br/>
        For any questions or changes, please reply to this email or call us at<br/>
        <a href="tel:+16122751722" style="color:#ffffff;text-decoration:none">(612) 275-1722</a>
      </p>
    </td></tr>

    <!-- View Reservation -->
    <tr><td style="padding:0 48px 40px;text-align:center">
      <a href="${confirmationUrl}" style="display:inline-block;padding:14px 40px;background:#ffffff;border:1px solid #ffffff;color:#000000;font-family:'Cormorant Garamond',Georgia,serif;font-size:9px;letter-spacing:0.45em;text-transform:uppercase;text-decoration:none;font-weight:600">View My Reservation</a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:20px 48px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <p style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0">Slique Moves &nbsp;·&nbsp; Excellence in Motion</p>
      <p style="font-size:9px;color:rgba(255,255,255,0.2);margin:8px 0 0">Minneapolis, MN · admin@sliquemoves.com</p>
    </td></tr>

  </table>

</td></tr></table>
</body></html>`;
}

// Plain-text version (helps deliverability — most spam filters require it)
function customerText(booking, refCode, confirmationUrl) {
  return `SLIQUE MOVES — RESERVATION CONFIRMED

Confirmation Reference: ${refCode}

Hello ${booking.customer_name},

Your reservation has been confirmed. Below are your trip details:

Date: ${formatDate(booking.pickup_date)}
Time: ${format12Hour(booking.pickup_time)}
Service: ${SERVICE_LABELS[booking.service_type] || booking.service_type}
Vehicle: ${VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type}
Passengers: ${booking.passengers}
Pickup: ${booking.pickup_location}${booking.dropoff_location ? `\nDestination: ${booking.dropoff_location}` : ''}${booking.special_requests ? `\nSpecial Notes: ${booking.special_requests}` : ''}

For any questions or changes, please reply to this email or call us at (612) 275-1722.

View your reservation: ${confirmationUrl}

Slique Moves · Excellence in Motion
Minneapolis, MN
admin@sliquemoves.com`;
}

// ─── Internal team notification ──────────────────────────────────────────────
function teamHtml(booking, refCode, adminUrl) {
  const submittedAt = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Booking</title></head>
<body style="margin:0;padding:0;background:#000000;font-family:'Cormorant Garamond',Georgia,serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000">
<tr><td align="center" style="padding:40px 16px">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.2)">

    <tr><td style="height:3px;background:#ffffff;line-height:3px;font-size:0">&nbsp;</td></tr>

    <tr><td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.1)">
      <div style="font-size:9px;letter-spacing:0.5em;text-transform:uppercase;color:#ffffff;margin-bottom:6px">Slique Moves · Internal</div>
      <h1 style="font-size:24px;font-weight:300;color:#ffffff;letter-spacing:0.04em;margin:0">New <em style="font-style:italic">Booking</em></h1>
      <div style="margin-top:10px"><span style="display:inline-block;padding:5px 14px;background:#ffffff;color:#000000;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;font-weight:600">Action Required</span></div>
    </td></tr>

    <!-- Ref -->
    <tr><td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.12)">
      ${sectionHeading('Reference')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${bubble('Booking ID', `<span style="font-family:'Courier New',monospace;font-size:15px;letter-spacing:0.2em">${refCode}</span>`)}${bubble('Submitted', submittedAt)}</tr>
      </table>
    </td></tr>

    <!-- Guest -->
    <tr><td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.12)">
      ${sectionHeading('Guest Information')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${bubble('Name', booking.customer_name)}${bubble('Phone', `<a href="tel:${booking.phone}" style="color:#ffffff;text-decoration:none">${booking.phone}</a>`)}</tr>
        <tr>${bubble('Email', `<a href="mailto:${booking.email}" style="color:#ffffff;text-decoration:none">${booking.email}</a>`)}<td style="padding:6px;width:50%"></td></tr>
      </table>
    </td></tr>

    <!-- Journey -->
    <tr><td style="padding:28px 40px;border-bottom:1px solid rgba(255,255,255,0.12)">
      ${sectionHeading('Journey Details')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>${bubble('Date', formatDate(booking.pickup_date))}${bubble('Time', format12Hour(booking.pickup_time))}</tr>
        <tr>${bubble('Service', SERVICE_LABELS[booking.service_type] || booking.service_type)}${bubble('Vehicle', VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type)}</tr>
        <tr>${bubble('Passengers', booking.passengers)}${bubble('Status', 'Pending')}</tr>
        <tr>${bubble('Pickup', booking.pickup_location)}${booking.dropoff_location ? bubble('Dropoff', booking.dropoff_location) : '<td style="padding:6px;width:50%"></td>'}</tr>
        ${booking.special_requests ? `<tr>${bubble('Special Notes', booking.special_requests)}<td style="padding:6px;width:50%"></td></tr>` : ''}
      </table>
    </td></tr>

    <!-- Actions -->
    <tr><td style="padding:28px 40px;text-align:center">
      <a href="${adminUrl}" style="display:inline-block;margin:0 6px;padding:12px 28px;background:#ffffff;color:#000000;border:1px solid #ffffff;font-family:'Cormorant Garamond',Georgia,serif;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;text-decoration:none;font-weight:600">Open Admin</a>
      <a href="mailto:${booking.email}" style="display:inline-block;margin:0 6px;padding:12px 28px;background:transparent;color:#ffffff;border:1px solid rgba(255,255,255,0.4);font-family:'Cormorant Garamond',Georgia,serif;font-size:9px;letter-spacing:0.35em;text-transform:uppercase;text-decoration:none">Reply to Guest</a>
    </td></tr>

    <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.08)">
      <p style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:#ffffff;margin:0">Slique Moves Internal Notification</p>
    </td></tr>

  </table>

</td></tr></table>
</body></html>`;
}

function teamText(booking, refCode, adminUrl) {
  const submittedAt = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });
  return `SLIQUE MOVES — NEW BOOKING

Reference: ${refCode}
Submitted: ${submittedAt}

GUEST
Name: ${booking.customer_name}
Phone: ${booking.phone}
Email: ${booking.email}

JOURNEY
Date: ${formatDate(booking.pickup_date)}
Time: ${format12Hour(booking.pickup_time)}
Service: ${SERVICE_LABELS[booking.service_type] || booking.service_type}
Vehicle: ${VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type}
Passengers: ${booking.passengers}
Pickup: ${booking.pickup_location}${booking.dropoff_location ? `\nDropoff: ${booking.dropoff_location}` : ''}${booking.special_requests ? `\nNotes: ${booking.special_requests}` : ''}

Open admin: ${adminUrl}`;
}

// ─── Send via Resend ─────────────────────────────────────────────────────────
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

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { booking, appUrl } = req.body;
    if (!booking || !booking.id) {
      return res.status(400).json({ error: 'Missing booking data' });
    }

    const refCode = generateRef(booking.id);
    const baseUrl = appUrl || 'https://sliquemoves.com';
    const confirmationUrl = `${baseUrl}/BookingConfirmation?id=${booking.id}`;
    const adminUrl = `${baseUrl}/Admin`;

    // Subject lines that look natural (not spammy)
    const customerSubject = `Reservation confirmed — ${refCode}`;
    const teamSubject = `New booking: ${booking.customer_name}, ${formatDate(booking.pickup_date)}`;

    const [customerResult, teamResult] = await Promise.allSettled([
      sendResend(apiKey, {
        to: booking.email,
        subject: customerSubject,
        html: customerHtml(booking, refCode, confirmationUrl),
        text: customerText(booking, refCode, confirmationUrl),
        replyTo: REPLY_TO,
        headers: {
          'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        },
      }),
      sendResend(apiKey, {
        to: NOTIFICATION_EMAIL,
        subject: teamSubject,
        html: teamHtml(booking, refCode, adminUrl),
        text: teamText(booking, refCode, adminUrl),
        replyTo: booking.email,
      }),
    ]);

    return res.status(200).json({
      ok: true,
      customer: customerResult.status,
      team: teamResult.status,
      ...(customerResult.status === 'rejected' && { customerError: String(customerResult.reason) }),
      ...(teamResult.status === 'rejected' && { teamError: String(teamResult.reason) }),
    });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
