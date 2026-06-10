import React, { useState } from 'react';
import {
  Elements, ExpressCheckoutElement, PaymentElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Inner form — must live inside <Elements> to use the Stripe hooks.
function CheckoutForm({ amountLabel, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // null = still detecting; true/false = whether Apple Pay / Google Pay is available here.
  const [walletAvailable, setWalletAvailable] = useState(null);
  const [showCard, setShowCard] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
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
    // 'succeeded' = card/Apple Pay cleared; 'processing' = ACH bank debit
    // accepted and settling. Both mean the customer is done — record the booking.
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onSuccess(paymentIntent);
      return;
    }
    setError('Payment was not completed. Please try again.');
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {/* Apple Pay / Google Pay button. Renders only on supported devices
          (Safari/iOS with a Wallet card) once the domain is verified in Stripe. */}
      {walletAvailable !== false && (
        <ExpressCheckoutElement
          onReady={({ availablePaymentMethods }) => setWalletAvailable(!!availablePaymentMethods)}
          onConfirm={confirm}
          options={{ paymentMethods: { link: 'never' } }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Card fallback — shown automatically when no wallet is available, or on
          request via the link below. Keeps non-Apple visitors able to pay. */}
      {(walletAvailable === false || showCard) ? (
        <form onSubmit={(e) => { e.preventDefault(); confirm(); }} className="space-y-4">
          {walletAvailable && (
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-gray-400">
              <span className="flex-1 h-px bg-gray-200" /> or pay with card <span className="flex-1 h-px bg-gray-200" />
            </div>
          )}
          <PaymentElement options={{ layout: 'tabs' }} />
          <Button
            type="submit"
            disabled={!stripe || busy}
            className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : `Pay ${amountLabel}`}
          </Button>
        </form>
      ) : walletAvailable && (
        <button
          type="button"
          onClick={() => setShowCard(true)}
          className="w-full text-center text-[11px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
        >
          Pay with card instead
        </button>
      )}
    </div>
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
