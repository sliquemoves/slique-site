import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { insertBooking } from '@/lib/insertBooking';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, X, Check } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import StripeCheckout from './StripeCheckout';
import { stripeEnabled } from '@/lib/stripe';
import ZelleIcon, { ZELLE_PURPLE } from '@/components/ZelleIcon';

const todayStr = () => new Date().toISOString().split('T')[0];

// Local-time 'YYYY-MM-DD' (no UTC drift).
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Legacy bookings folded the return date into notes before the column existed.
function returnFromNotes(notes) {
  if (!notes) return null;
  const m = String(notes).match(/Return date:\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// Processing fee applied on top of the rental subtotal.
const PROCESSING_RATE = 0.035;

// Format a number as USD, e.g. 1234.5 → "$1,234.50".
const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Number of whole days between two YYYY-MM-DD strings (>= 1).
function rentalDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

/* ────────────────────────────────────────────────────────────────
   submitRentalInquiry — the SINGLE place that decides where a daily
   rental inquiry is persisted.

   Today: there's no dedicated rentals table, so we reuse the existing
   `bookings` table with service_type='daily_rental'. The booking
   schema is hourly-charter shaped (pickup_time + pickup_location are
   NOT NULL), so we set a sentinel pickup_time and fold the rental-only
   fields (return date, daily rate, day count) into special_requests.

   We deliberately DON'T touch the `availability` table — that's for
   hourly chauffeur slots; daily rentals don't block hourly inventory.

   When you later run the SQL migration for a clean `rental_inquiries`
   table, this is the one function to rewrite — the UI above stays put.
   ──────────────────────────────────────────────────────────────── */
async function submitRentalInquiry({ car, form, payment }) {
  const days = rentalDays(form.pickup_date, form.return_date);
  const subtotal = days > 0 ? days * car.rate : null;
  const processingFee = subtotal != null ? subtotal * PROCESSING_RATE : null;
  const total = subtotal != null ? subtotal + processingFee : null;

  const isZelle = payment?.method === 'zelle';
  const noteLines = [
    `DAILY RENTAL BOOKING${payment?.id ? ' (PAID)' : isZelle ? ' (ZELLE PENDING)' : ''} — ${car.name}`,
    `Return date: ${form.return_date}`,
    `Duration: ${days} day${days === 1 ? '' : 's'}`,
    `Daily rate: $${car.rate}/day`,
    subtotal != null ? `Subtotal: ${usd(subtotal)}` : '',
    processingFee != null ? `Processing (3.5%): ${usd(processingFee)}` : '',
    total != null ? `${payment?.id ? 'Total paid' : 'Estimated total'}: ${usd(total)}` : '',
    payment?.id
      ? `Payment: Stripe ${payment.id} — ${payment.status === 'processing' ? 'ACH PROCESSING' : 'PAID IN FULL'}`
      : isZelle
        ? `Payment: Zelle — customer indicated sent (${usd(subtotal)}, no fee); CONFIRM RECEIPT`
        : '',
    form.special_requests ? `\nCustomer notes: ${form.special_requests}` : '',
  ].filter(Boolean);

  const { data: booking, error } = await insertBooking({
    customer_name: form.customer_name,
    email: form.email,
    phone: form.phone,
    service_type: 'daily_rental',
    vehicle_type: car.type,
    pickup_date: form.pickup_date,
    return_date: form.return_date,   // structured end date for the admin schedule
    pickup_time: '10:00',            // sentinel — daily rentals aren't hourly
    pickup_location: form.pickup_location,
    dropoff_location: null,
    passengers: 1,
    daily_rate: car.rate,
    total_amount: total,
    special_requests: noteLines.join('\n'),
    status: payment?.id ? 'confirmed' : 'pending',
  });

  if (error) throw error;

  // Fire confirmation emails (don't block the UI on it)
  fetch('/api/send-booking-emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking, appUrl: window.location.origin }),
  }).catch(err => console.error('Rental email send failed:', err));

  return booking;
}

const EMPTY_FORM = {
  customer_name: '',
  email: '',
  phone: '',
  pickup_date: '',
  return_date: '',
  pickup_location: '',
  special_requests: '',
};

export default function RentalInquiryModal({ car, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [blockedDates, setBlockedDates] = useState(() => new Set());
  const [clientSecret, setClientSecret] = useState(null);

  // Reset whenever a different car opens the modal.
  useEffect(() => {
    if (car) {
      setForm(EMPTY_FORM);
      setSubmitted(false);
      setIsSubmitting(false);
      setBlockedDates(new Set());
      setClientSecret(null);
    }
  }, [car]);

  // Pull this car's existing bookings so already-taken days render as
  // unavailable in the calendar (occupied pickup → return, inclusive).
  useEffect(() => {
    if (!car) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('pickup_date, return_date, special_requests, status')
        .eq('vehicle_type', car.type)
        .neq('status', 'cancelled');
      if (cancelled || error || !data) return;
      const set = new Set();
      for (const b of data) {
        if (!b.pickup_date) continue;
        const endStr = b.return_date || returnFromNotes(b.special_requests) || b.pickup_date;
        const d = new Date(b.pickup_date + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        for (let i = 0; i < 366 && d <= end; i++) {
          set.add(ymd(d));
          d.setDate(d.getDate() + 1);
        }
      }
      if (!cancelled) setBlockedDates(set);
    })();
    return () => { cancelled = true; };
  }, [car]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (car) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [car, onClose]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // If a new pickup date is on/after the chosen return date, clear return.
      if (field === 'pickup_date' && prev.return_date && prev.return_date <= value) {
        next.return_date = '';
      }
      return next;
    });
  };

  const days = rentalDays(form.pickup_date, form.return_date);
  const subtotal = car && days > 0 ? days * car.rate : null;
  const processingFee = subtotal != null ? subtotal * PROCESSING_RATE : null;
  const total = subtotal != null ? subtotal + processingFee : null;

  // All required contact fields + a valid date range are present.
  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const formReady = !!(
    form.customer_name.trim() && emailValid && form.phone.trim() &&
    form.pickup_date && form.return_date && days >= 1
  );

  // With payments on, create/refresh the PaymentIntent as soon as valid dates
  // are chosen, so the Apple Pay / card buttons can render inline (no extra step).
  useEffect(() => {
    if (!stripeEnabled || !car) return;
    if (!form.pickup_date || !form.return_date || days < 1) { setClientSecret(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_type: car.type, pickup_date: form.pickup_date, return_date: form.return_date }),
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.clientSecret) setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment init error:', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car, form.pickup_date, form.return_date]);

  // Dormant-mode fallback (no Stripe keys): submit a plain inquiry.
  const handleInquiry = async () => {
    if (!form.customer_name.trim() || !emailValid || !form.phone.trim()) {
      toast.error('Please fill in your name, email, and phone.');
      return;
    }
    if (!form.return_date || days < 1) {
      toast.error('Please choose a return date after the pickup date.');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitRentalInquiry({ car, form });
      setSubmitted(true);
    } catch (err) {
      console.error('Rental inquiry error:', err);
      toast.error('Something went wrong. Please try again or call us.');
      setIsSubmitting(false);
    }
  };

  // After a successful card / Apple Pay charge, record the paid booking.
  const handlePaid = async (paymentIntent) => {
    try {
      await submitRentalInquiry({ car, form, payment: { id: paymentIntent.id, status: paymentIntent.status } });
    } catch (err) {
      // The charge already succeeded — log, but still confirm to the customer.
      console.error('Post-payment booking insert failed:', err);
    }
    setSubmitted(true);
  };

  // Customer says they sent the Zelle payment — record a pending booking for
  // manual confirmation (Zelle has no API, so receipt is verified by hand).
  const handleZelle = async () => {
    try {
      await submitRentalInquiry({ car, form, payment: { method: 'zelle' } });
    } catch (err) {
      console.error('Zelle booking insert failed:', err);
    }
    setSubmitted(true);
  };

  return (
    <AnimatePresence>
      {car && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-lg bg-white max-h-[92vh] overflow-y-auto"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              // ── Success state ──
              <div className="px-8 py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-6">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-light text-black tracking-tight mb-3">
                  Inquiry <span className="font-semibold">received</span>
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Thanks{form.customer_name ? `, ${form.customer_name.split(' ')[0]}` : ''}. We've got your
                  request for the <span className="text-black">{car.name}</span> and will reach out shortly to
                  confirm availability and finalize your rental.
                </p>
                <Button
                  onClick={onClose}
                  className="mt-8 bg-black text-white hover:bg-gray-900 rounded-none px-10 py-6 text-xs tracking-widest uppercase"
                >
                  Done
                </Button>
              </div>
            ) : (
              // ── Booking form + inline payment ──
              <div className="p-8">
                <div className="mb-7">
                  <p className="text-gray-400 tracking-[0.3em] uppercase text-[10px] mb-2">Daily Rental Booking</p>
                  <h3 className="text-2xl font-light text-black tracking-tight">{car.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    ${car.rate}<span className="text-gray-400">/day</span>
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Full Name *</Label>
                    <Input required value={form.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="John Smith" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-widest uppercase text-gray-500">Email *</Label>
                      <Input required type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="john@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs tracking-widest uppercase text-gray-500">Phone *</Label>
                      <Input required type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="(612) 555-0100" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Rental Dates *</Label>
                    <DateRangePicker
                      startValue={form.pickup_date}
                      endValue={form.return_date}
                      onChange={(start, end) =>
                        setForm(prev => ({ ...prev, pickup_date: start || '', return_date: end || '' }))
                      }
                      minDate={todayStr()}
                      disabledDates={blockedDates}
                      dropUp
                      placeholder="Select pickup & return"
                    />
                  </div>

                  {/* Estimate breakdown */}
                  {subtotal != null && (
                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-black font-medium">
                        <span>TOTAL {days} day{days === 1 ? '' : 's'} + processing (3.5%)</span>
                        <span>{usd(total)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1" style={{ color: ZELLE_PURPLE }}>
                        <span className="flex items-center gap-1.5 font-semibold">
                          <ZelleIcon size={16} /> With Zelle
                          <span className="text-[11px] font-normal opacity-70">· no fee</span>
                        </span>
                        <span className="font-semibold">{usd(subtotal)}</span>
                      </div>
                    </div>
                  )}

                  {stripeEnabled ? (
                    formReady && clientSecret ? (
                      <StripeCheckout
                        key={clientSecret}
                        clientSecret={clientSecret}
                        amountLabel={usd(total)}
                        zelleAmountLabel={usd(subtotal)}
                        onSuccess={handlePaid}
                        onZelleConfirm={handleZelle}
                      />
                    ) : (
                      <div className="text-center text-[11px] tracking-widest uppercase text-gray-400 py-4 border border-gray-100">
                        {!form.pickup_date || !form.return_date || days < 1
                          ? 'Select your rental dates to continue'
                          : 'Enter your name, email & phone to pay'}
                      </div>
                    )
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={handleInquiry}
                        disabled={isSubmitting}
                        className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Book'}
                      </Button>
                      <p className="text-center text-[11px] text-gray-400">
                        This is an inquiry — we'll confirm availability before any charge.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
