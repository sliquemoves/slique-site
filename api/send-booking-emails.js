// api/send-booking-emails.js
// Vercel serverless function — runs on the server, NOT in the browser.
// This keeps your Resend API key safe.
//
// Setup:
//   1. Add RESEND_API_KEY to your Vercel environment variables
//      (Vercel Dashboard → Settings → Environment Variables)
//   2. Set NOTIFICATION_EMAIL below to your team inbox
//   3. Set FROM_EMAIL to your verified Resend sender

const FROM_EMAIL = 'reservations@sliquemoves.com';
const FROM_NAME = 'Slique Moves';
const NOTIFICATION_EMAIL = 'admin@sliquemoves.com';

const SERVICE_LABELS = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate Travel',
  special_event: 'Special Event',
};

const VEHICLE_LABELS = {
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
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Customer email (luxury, gothic, presidential) ───────────────────────────
function customerHtml(booking, refCode, confirmationUrl) {
  const drop = booking.dropoff_location ? `
    <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
      <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Destination</span>
      <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.dropoff_location}</span>
    </div>` : '';
  const notes = booking.special_requests ? `
    <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
      <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Special Notes</span>
      <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.special_requests}</span>
    </div>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
  body{margin:0;padding:0;background:#0a0a0a;font-family:'Cormorant Garamond',Georgia,serif;-webkit-font-smoothing:antialiased}
</style>
</head><body>
<div style="background:#0a0a0a;padding:40px 16px">
  <div style="max-width:580px;margin:0 auto;background:#080705;border:1px solid rgba(201,168,76,0.2)">
    <div style="height:3px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.6) 30%,rgba(201,168,76,0.9) 50%,rgba(201,168,76,0.6) 70%,transparent)"></div>
    <div style="padding:40px 48px 32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.08)">
      <p style="font-size:10px;letter-spacing:0.5em;text-transform:uppercase;color:rgba(201,168,76,0.5);margin:0 0 24px">Slique Moves</p>
      <svg width="64" height="64" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 20px">
        <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(201,168,76,0.2)" stroke-width="0.8"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(201,168,76,0.12)" stroke-width="0.5"/>
        <path d="M28,32 L32,22 L40,28 L48,22 L52,32" fill="none" stroke="#C9A84C" stroke-width="1" stroke-linejoin="round"/>
        <rect x="27" y="32" width="26" height="16" rx="0.5" fill="none" stroke="#C9A84C" stroke-width="0.8"/>
        <path d="M33,40 L38,45 L48,35" fill="none" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M32,50 Q40,56 48,50" fill="none" stroke="rgba(201,168,76,0.35)" stroke-width="0.6"/>
      </svg>
      <h1 style="font-size:28px;font-weight:300;color:#e8e0d0;letter-spacing:0.04em;margin:0;line-height:1.3">Reservation <em style="font-style:italic;color:#C9A84C">Confirmed</em></h1>
      <p style="margin:8px 0 0;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(201,168,76,0.4)">Your journey has been arranged</p>
    </div>

    <div style="text-align:center;padding:24px 48px 4px">
      <svg viewBox="0 0 400 24" xmlns="http://www.w3.org/2000/svg" style="max-width:240px">
        <line x1="0" y1="12" x2="150" y2="12" stroke="#C9A84C" stroke-width="0.5" opacity="0.4"/>
        <polygon points="195,6 210,12 195,18 180,12" fill="#C9A84C" opacity="0.7"/>
        <line x1="240" y1="12" x2="400" y2="12" stroke="#C9A84C" stroke-width="0.5" opacity="0.4"/>
      </svg>
    </div>

    <div style="text-align:center;padding:4px 48px 28px">
      <p style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(201,168,76,0.4);margin:0 0 8px">Confirmation Reference</p>
      <p style="font-family:'Courier New',monospace;font-size:24px;letter-spacing:0.25em;color:#C9A84C;margin:0">${refCode}</p>
    </div>

    <div style="padding:0 48px 32px">
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Guest</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.customer_name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Date of Journey</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${formatDate(booking.pickup_date)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Departure Time</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.pickup_time}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Service</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${SERVICE_LABELS[booking.service_type] || booking.service_type}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Vehicle</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Passengers</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.passengers}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.07)">
        <span style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.45)">Origin</span>
        <span style="font-size:13px;font-weight:300;color:#d4c9b0;letter-spacing:0.02em;text-align:right;max-width:60%">${booking.pickup_location}</span>
      </div>
      ${drop}
      ${notes}
    </div>

    <div style="padding:0 48px 32px;text-align:center">
      <span style="display:inline-block;padding:8px 24px;border:1px solid rgba(201,168,76,0.25);font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(201,168,76,0.6);background:rgba(201,168,76,0.04)">· Awaiting Confirmation</span>
    </div>

    <div style="padding:24px 48px 32px;text-align:center;border-top:1px solid rgba(201,168,76,0.06)">
      <p style="font-size:13px;font-weight:300;color:rgba(255,255,255,0.22);line-height:2;letter-spacing:0.02em;margin:0">
        Our team will contact you at <a href="mailto:${booking.email}" style="color:rgba(201,168,76,0.55);text-decoration:none">${booking.email}</a><br/>
        within 2 hours to finalise your arrangements.<br/><br/>
        For immediate assistance, please reach us at<br/>
        <a href="mailto:admin@sliquemoves.com" style="color:rgba(201,168,76,0.55);text-decoration:none">admin@sliquemoves.com</a>
      </p>
    </div>

    <div style="padding:0 48px 40px;text-align:center">
      <a href="${confirmationUrl}" style="display:inline-block;padding:14px 40px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-family:'Cormorant Garamond',Georgia,serif;font-size:9px;letter-spacing:0.45em;text-transform:uppercase;text-decoration:none">View My Reservation</a>
    </div>

    <div style="padding:20px 48px;text-align:center;border-top:1px solid rgba(201,168,76,0.06)">
      <p style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(201,168,76,0.2);margin:0">Slique Moves &nbsp;·&nbsp; Excellence in Motion</p>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── Internal team notification email ────────────────────────────────────────
function teamHtml(booking, refCode, adminUrl) {
  const drop = booking.dropoff_location ? `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
      <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Dropoff</span>
      <span style="font-size:14px;font-weight:400;color:#1a1a1a;text-align:right;max-width:65%">${booking.dropoff_location}</span>
    </div>` : '';
  const notes = booking.special_requests ? `
    <div style="display:flex;justify-content:space-between;padding:10px 0">
      <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Notes</span>
      <span style="font-size:14px;font-weight:400;color:#1a1a1a;text-align:right;max-width:65%">${booking.special_requests}</span>
    </div>` : '';
  const submittedAt = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap');body{margin:0;padding:0}</style>
</head><body style="background:#f5f4f0;font-family:'Cormorant Garamond',Georgia,serif;margin:0;padding:0">
<div style="background:#f5f4f0;padding:40px 16px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-top:3px solid #0a0a0a">
    <div style="background:#0a0a0a;padding:28px 40px">
      <p style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(201,168,76,0.6);margin:0 0 4px">Slique Moves · Internal</p>
      <h1 style="font-size:20px;font-weight:300;color:#e8e0d0;letter-spacing:0.05em;margin:0">New <em style="font-style:italic;color:#C9A84C">Booking</em> Received</h1>
    </div>

    <div style="padding:24px 40px;border-bottom:1px solid #f0ede8">
      <p style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#888;margin:0 0 12px">Reference</p>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Booking ID</span>
        <span style="font-family:'Courier New',monospace;font-size:16px;letter-spacing:0.2em;color:#0a0a0a;font-weight:600">${refCode}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Submitted</span>
        <span style="font-size:14px;color:#1a1a1a">${submittedAt}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Status</span>
        <span style="font-size:14px;color:#d4a017;font-weight:600">Pending Confirmation</span>
      </div>
    </div>

    <div style="padding:24px 40px;border-bottom:1px solid #f0ede8">
      <p style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#888;margin:0 0 12px">Guest Information</p>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Name</span>
        <span style="font-size:14px;color:#1a1a1a">${booking.customer_name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Email</span>
        <a href="mailto:${booking.email}" style="font-size:14px;color:#0a0a0a;text-decoration:none">${booking.email}</a>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Phone</span>
        <a href="tel:${booking.phone}" style="font-size:14px;color:#0a0a0a;text-decoration:none">${booking.phone}</a>
      </div>
    </div>

    <div style="padding:24px 40px;border-bottom:1px solid #f0ede8">
      <p style="font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#888;margin:0 0 12px">Journey Details</p>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Date</span>
        <span style="font-size:14px;color:#1a1a1a">${formatDate(booking.pickup_date)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Time</span>
        <span style="font-size:14px;color:#1a1a1a">${booking.pickup_time}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Service</span>
        <span style="font-size:14px;color:#1a1a1a">${SERVICE_LABELS[booking.service_type] || booking.service_type}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Vehicle</span>
        <span style="font-size:14px;color:#1a1a1a">${VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f5f4f0">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Passengers</span>
        <span style="font-size:14px;color:#1a1a1a">${booking.passengers}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;${drop || notes ? 'border-bottom:1px solid #f5f4f0' : ''}">
        <span style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#aaa">Pickup</span>
        <span style="font-size:14px;color:#1a1a1a;text-align:right;max-width:65%">${booking.pickup_location}</span>
      </div>
      ${drop}
      ${notes}
    </div>

    <div style="padding:28px 40px;text-align:center;background:#fafaf8">
      <a href="${adminUrl}" style="display:inline-block;margin:0 8px;padding:12px 28px;background:#0a0a0a;color:#C9A84C;border:1px solid #0a0a0a;font-family:'Cormorant Garamond',Georgia,serif;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;text-decoration:none">Open in Admin</a>
      <a href="mailto:${booking.email}" style="display:inline-block;margin:0 8px;padding:12px 28px;background:transparent;color:#666;border:1px solid #ddd;font-family:'Cormorant Garamond',Georgia,serif;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;text-decoration:none">Reply to Guest</a>
    </div>

    <div style="padding:20px 40px;text-align:center">
      <p style="font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:#bbb;margin:0">Slique Moves Internal Notification</p>
    </div>
  </div>
</div>
</body></html>`;
}

// ─── Send email via Resend ───────────────────────────────────────────────────
async function sendResend(apiKey, { to, subject, html, replyTo }) {
  const body = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;

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

// ─── Main handler ────────────────────────────────────────────────────────────
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

    // Send both emails in parallel
    const [customerResult, teamResult] = await Promise.allSettled([
      sendResend(apiKey, {
        to: booking.email,
        subject: `Your Reservation is Confirmed — ${refCode}`,
        html: customerHtml(booking, refCode, confirmationUrl),
        replyTo: NOTIFICATION_EMAIL,
      }),
      sendResend(apiKey, {
        to: NOTIFICATION_EMAIL,
        subject: `🚘 New Booking — ${booking.customer_name} · ${formatDate(booking.pickup_date)}`,
        html: teamHtml(booking, refCode, adminUrl),
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
