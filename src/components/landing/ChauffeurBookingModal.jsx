import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertCircle, X, Check } from 'lucide-react';
import DatePicker from './DatePicker';

const todayStr = () => new Date().toISOString().split('T')[0];

const serviceTypes = [
  { value: "hourly_charter",   label: "Hourly Charter" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "corporate",        label: "Corporate Travel" },
  { value: "special_event",    label: "Special Event" },
];

// Full 24-hour range, stored as HH:00 (24-hour) for stable sorting.
const ALL_TIME_SLOTS = [
  '00:00','01:00','02:00','03:00','04:00','05:00',
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00',
];

// Convert "14:00" → "2:00 PM" for display.
function format12Hour(time24) {
  if (!time24) return '';
  const [h] = time24.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

const EMPTY_FORM = {
  customer_name: '',
  email: '',
  phone: '',
  service_type: '',
  pickup_date: '',
  pickup_time: '',
  pickup_location: '',
  dropoff_location: '',
  special_requests: '',
};

export default function ChauffeurBookingModal({ vehicle, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Reset whenever a different vehicle opens the modal.
  useEffect(() => {
    if (vehicle) {
      setForm(EMPTY_FORM);
      setSubmitted(false);
      setIsSubmitting(false);
      setAvailableSlots([]);
    }
  }, [vehicle]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (vehicle) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [vehicle, onClose]);

  // All times open by default. Subtract anything in availability marked unavailable.
  useEffect(() => {
    const checkAvailability = async () => {
      if (vehicle && form.pickup_date) {
        setCheckingAvailability(true);
        const { data, error } = await supabase
          .from('availability')
          .select('time_slot')
          .eq('date', form.pickup_date)
          .eq('vehicle_type', vehicle.type)
          .eq('is_available', false);

        if (error) {
          console.error('Availability fetch error:', error);
          setAvailableSlots(ALL_TIME_SLOTS);
        } else {
          const blocked = new Set((data || []).map(r => r.time_slot));
          setAvailableSlots(ALL_TIME_SLOTS.filter(t => !blocked.has(t)));
        }
        setCheckingAvailability(false);
      } else {
        setAvailableSlots([]);
      }
    };
    checkAvailability();
  }, [vehicle, form.pickup_date]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'pickup_date') next.pickup_time = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pickup_time) {
      toast.error('Please choose an available pickup time.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          service_type: form.service_type,
          vehicle_type: vehicle.type,
          pickup_date: form.pickup_date,
          pickup_time: form.pickup_time,
          pickup_location: form.pickup_location,
          dropoff_location: form.dropoff_location || null,
          passengers: 1,
          special_requests: form.special_requests,
          status: 'pending',
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Block the slot so it can't be double-booked.
      await supabase.from('availability').insert([{
        date: form.pickup_date,
        time_slot: form.pickup_time,
        vehicle_type: vehicle.type,
        is_available: false,
        booking_id: booking.id,
      }]);

      // Fire confirmation emails (don't block the UI on it).
      fetch('/api/send-booking-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking, appUrl: window.location.origin }),
      }).catch(err => console.error('Email send failed:', err));

      setSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {vehicle && (
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
                  Reservation <span className="font-semibold">received</span>
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Thanks{form.customer_name ? `, ${form.customer_name.split(' ')[0]}` : ''}. We've got your
                  request for the <span className="text-black">{vehicle.name}</span> and will reach out shortly to
                  confirm the details of your ride.
                </p>
                <Button
                  onClick={onClose}
                  className="mt-8 bg-black text-white hover:bg-gray-900 rounded-none px-10 py-6 text-xs tracking-widest uppercase"
                >
                  Done
                </Button>
              </div>
            ) : (
              // ── Booking form ──
              <div className="p-8">
                <div className="mb-7">
                  <p className="text-gray-400 tracking-[0.3em] uppercase text-[10px] mb-2">Reserve Your Ride</p>
                  <h3 className="text-2xl font-light text-black tracking-tight">{vehicle.name}</h3>
                  {vehicle.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{vehicle.subtitle}</p>
                  )}
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
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Service Type *</Label>
                    <Select required value={form.service_type} onValueChange={(v) => handleChange('service_type', v)}>
                      <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12"><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>{serviceTypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Date *</Label>
                      <DatePicker
                        value={form.pickup_date}
                        onChange={(v) => handleChange('pickup_date', v)}
                        minDate={todayStr()}
                        placeholder="Pickup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Time *</Label>
                      {form.pickup_date ? (
                        checkingAvailability ? (
                          <div className="border border-gray-200 rounded-none h-12 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                        ) : availableSlots.length > 0 ? (
                          <Select required value={form.pickup_time} onValueChange={(v) => handleChange('pickup_time', v)}>
                            <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12"><SelectValue placeholder="Select time" /></SelectTrigger>
                            <SelectContent>{availableSlots.map(slot => <SelectItem key={slot} value={slot}>{format12Hour(slot)}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <div className="border border-red-200 bg-red-50 rounded-none h-12 flex items-center px-3 gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-600">No availability</span>
                          </div>
                        )
                      ) : (
                        <div className="border border-gray-200 rounded-none h-12 flex items-center px-3">
                          <span className="text-xs text-gray-400">Select a date first</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
                    <Input required value={form.pickup_location} onChange={(e) => handleChange('pickup_location', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Address or airport terminal" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-widest uppercase text-gray-500">Dropoff Location</Label>
                    <Input value={form.dropoff_location} onChange={(e) => handleChange('dropoff_location', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Destination address" />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || (!!form.pickup_date && !checkingAvailability && availableSlots.length === 0)}
                    className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reserving...</> : 'Reserve'}
                  </Button>
                  <p className="text-center text-[11px] text-gray-400">
                    We'll confirm your reservation details before pickup.
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
