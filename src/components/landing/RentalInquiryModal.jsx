import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { insertBooking } from '@/lib/insertBooking';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Check } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

const todayStr = () => new Date().toISOString().split('T')[0];

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
async function submitRentalInquiry({ car, form }) {
  const days = rentalDays(form.pickup_date, form.return_date);
  const subtotal = days > 0 ? days * car.rate : null;
  const processingFee = subtotal != null ? subtotal * PROCESSING_RATE : null;
  const total = subtotal != null ? subtotal + processingFee : null;

  const noteLines = [
    `DAILY RENTAL INQUIRY — ${car.name}`,
    `Return date: ${form.return_date}`,
    `Duration: ${days} day${days === 1 ? '' : 's'}`,
    `Daily rate: $${car.rate}/day`,
    subtotal != null ? `Subtotal: ${usd(subtotal)}` : '',
    processingFee != null ? `Processing (3.5%): ${usd(processingFee)}` : '',
    total != null ? `Estimated total: ${usd(total)}` : '',
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
    status: 'pending',
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

  // Reset whenever a different car opens the modal.
  useEffect(() => {
    if (car) {
      setForm(EMPTY_FORM);
      setSubmitted(false);
      setIsSubmitting(false);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
              // ── Inquiry form ──
              <div className="p-8">
                <div className="mb-7">
                  <p className="text-gray-400 tracking-[0.3em] uppercase text-[10px] mb-2">Daily Rental Inquiry</p>
                  <h3 className="text-2xl font-light text-black tracking-tight">{car.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    ${car.rate}<span className="text-gray-400">/day</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                      placeholder="Select pickup & return"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
                    <Input required value={form.pickup_location} onChange={(e) => handleChange('pickup_location', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Address or airport terminal" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Notes</Label>
                    <Textarea value={form.special_requests} onChange={(e) => handleChange('special_requests', e.target.value)} className="border-gray-200 focus:border-black rounded-none min-h-[80px] resize-none" placeholder="Delivery requests, additional drivers, questions, etc." />
                  </div>

                  {/* Estimate breakdown */}
                  {subtotal != null && (
                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-500">
                        <span>{days} day{days === 1 ? '' : 's'} × ${car.rate}</span>
                        <span>{usd(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Processing (3.5%)</span>
                        <span>{usd(processingFee)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-black font-medium">
                        <span>Total</span>
                        <span>{usd(total)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Book'}
                  </Button>
                  <p className="text-center text-[11px] text-gray-400">
                    This is an inquiry — we'll confirm availability before any charge.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
