// api/create-payment-intent.js
// Creates a Stripe PaymentIntent for a daily-rental booking.
//
// SECURITY: the charged amount is computed HERE from the vehicle + dates — the
// client never sends a price. This prevents anyone from tampering with the
// total in the browser.
//
// Dormant until STRIPE_SECRET_KEY is set in the environment; without it the
// endpoint returns 503 and the booking form falls back to the inquiry flow.
//
// Keep RENTAL_RATES in sync with src/lib/fleet.js (DAILY_RENTALS rates).

import Stripe from 'stripe';

const RENTAL_RATES = {
  porsche_718s:    249,
  amg_c43:         149,
  corvette_c8:     429,
  tesla_model_y:   149,
  amg_cle53:       499,
  corvette_c8_z06: 699,
};

// Customer-facing processing surcharge (matches the rental modal's displayed total).
const PROCESSING_RATE = 0.035;

// Whole days between two YYYY-MM-DD strings (>= 1).
function nightsBetween(start, end) {
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(503).json({ error: 'Payments not configured' });
  }

  try {
    const { vehicle_type, pickup_date, return_date } = req.body || {};

    const rate = RENTAL_RATES[vehicle_type];
    if (!rate) return res.status(400).json({ error: 'Unknown vehicle' });
    if (!pickup_date || !return_date) return res.status(400).json({ error: 'Missing dates' });

    const nights = nightsBetween(pickup_date, return_date);
    if (nights < 1) return res.status(400).json({ error: 'Return must be after pickup' });

    const subtotal = nights * rate;
    const total = subtotal * (1 + PROCESSING_RATE);
    const amountCents = Math.round(total * 100);

    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      // Card ONLY (covers Apple Pay & Google Pay wallets). No ACH/Klarna/Link —
      // funds must clear instantly before a rental is confirmed. The explicit
      // list also suppresses the Link inline sign-up in the Payment Element.
      payment_method_types: ['card'],
      metadata: { vehicle_type, pickup_date, return_date, nights: String(nights), daily_rate: String(rate) },
    });

    return res.status(200).json({ clientSecret: intent.client_secret, amount: amountCents });
  } catch (err) {
    console.error('[create-payment-intent] failed', err);
    return res.status(500).json({ error: 'Could not start payment' });
  }
}
