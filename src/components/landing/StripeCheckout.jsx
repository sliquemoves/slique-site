import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Inner form — must live inside <Elements> to use the Stripe hooks.
function CheckoutForm({ amountLabel, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);

    // redirect: 'if_required' keeps the customer in the modal for card/Apple Pay
    // (only redirects for payment methods that strictly require it).
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (payError) {
      setError(payError.message || 'Payment could not be completed.');
      setBusy(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
      return;
    }
    setError('Payment was not completed. Please try again.');
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || busy}
        className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : `Pay ${amountLabel}`}
      </Button>
      <p className="text-center text-[11px] text-gray-400">
        Payments are securely processed by Stripe. Apple Pay shown on supported devices.
      </p>
    </form>
  );
}

// Wrapper — provides the Elements context bound to a specific PaymentIntent.
export default function StripeCheckout({ clientSecret, amountLabel, onSuccess }) {
  if (!clientSecret || !stripePromise) return null;
  const options = {
    clientSecret,
    appearance: {
      theme: 'flat',
      variables: { colorPrimary: '#000000', borderRadius: '0px', fontFamily: 'system-ui, sans-serif' },
    },
  };
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm amountLabel={amountLabel} onSuccess={onSuccess} />
    </Elements>
  );
}
