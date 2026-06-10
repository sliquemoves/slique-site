// src/lib/stripe.js
// Frontend Stripe loader. Stays inert until VITE_STRIPE_PUBLISHABLE_KEY is set —
// when it's absent, `stripeEnabled` is false and the rental form keeps using the
// inquiry flow instead of collecting payment.

import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripeEnabled = !!PUBLISHABLE_KEY;

// loadStripe returns a promise; only create it when we actually have a key.
export const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;
