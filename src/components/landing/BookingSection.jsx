import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';

const serviceTypes = [
  { value: "hourly_charter",  label: "Hourly Charter"   },
  { value: "airport_transfer",label: "Airport Transfer" },
  { value: "corporate",       label: "Corporate Travel" },
  { value: "special_event",   label: "Special Event"    }
];

const vehicleTypes = [
  { value: "luxury_sedan",    label: "Black Luxury Sedan"    },
  { value: "luxury_suv",      label: "Black Luxury SUV"      },
  { value: "luxury_sprinter", label: "Black Luxury Sprinter" },
  { value: "luxury_limo",     label: "Black Stretch Limo"    }
];

const EMPTY_FORM = {
  customer_name: '', email: '', phone: '',
  service_type: '', vehicle_type: '',
  pickup_date: '', pickup_time: '',
  pickup_location: '', dropoff_location: '',
  passengers: 1, special_requests: ''
};

export default function BookingSection() {
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [isSuccess, setIsSuccess]                   = useState(false);
  const [availableSlots, setAvailableSlots]         = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [touched, setTouched]                       = useState({});
  const [formData, setFormData]                     = useState(EMPTY_FORM);

  // Auto-populate vehicle from URL hash e.g. #vehicle=luxury_suv
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('vehicle=')) {
      const vehicleType = hash.split('vehicle=')[1];
      setFormData(prev => ({ ...prev, vehicle_type: vehicleType }));
      window.location.hash = '';
    }
  }, []);

  // Validation
  const errors = {
    customer_name:  !formData.customer_name.trim()  ? 'Full name is required' : '',
    email: !formData.email.trim() ? 'Email is required'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Enter a valid email address' : '',
    phone:           !formData.phone.trim()          ? 'Phone number is required' : '',
    service_type:    !formData.service_type          ? 'Please select a service type' : '',
    vehicle_type:    !formData.vehicle_type          ? 'Please select a vehicle' : '',
    pickup_date:     !formData.pickup_date           ? 'Pickup date is required' : '',
    pickup_time:     !formData.pickup_time           ? 'Please select an available time slot' : '',
    pickup_location: !formData.pickup_location.trim()? 'Pickup location is required' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'pickup_date' || field === 'vehicle_type') next.pickup_time = '';
      return next;
    });
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Fetch available slots from Supabase
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!formData.pickup_date || !formData.vehicle_type) { setAvailableSlots([]); return; }
      setCheckingAvailability(true);
      try {
        const { data, error } = await supabase
          .from('availability')
          .select('time_slot')
          .eq('date', formData.pickup_date)
          .eq('vehicle_type', formData.vehicle_type)
          .eq('is_available', true)
          .order('time_slot');
        if (!cancelled) setAvailableSlots(error ? [] : data.map(r => r.time_slot));
      } catch { if (!cancelled) setAvailableSlots([]); }
      finally   { if (!cancelled) setCheckingAvailability(false); }
    };
    check();
    return () => { cancelled = true; };
  }, [formData.pickup_date, formData.vehicle_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      customer_name: true, email: true, phone: true,
      service_type: true,  vehicle_type: true, pickup_date: true,
      pickup_time: true,   pickup_location: true,
    });
    if (hasErrors) return;
    setIsSubmitting(true);
    try {
      // Insert booking
      const { error: bookingError } = await supabase.from('bookings').insert([{
        ...formData,
        passengers: Number(formData.passengers),
        status: 'pending'
      }]);
      if (bookingError) throw bookingError;

      // Mark slot as taken
      await supabase
        .from('availability')
        .update({ is_available: false })
        .eq('date',         formData.pickup_date)
        .eq('time_slot',    formData.pickup_time)
        .eq('vehicle_type', formData.vehicle_type)
        .eq('is_available', true);

      setIsSuccess(true);
      toast.success("Reservation request submitted successfully!");
      setTimeout(() => {
        setIsSuccess(false);
        setFormData(EMPTY_FORM);
        setAvailableSlots([]);
        setTouched({});
      }, 4000);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please call us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (field) =>
    `rounded-none h-12 ${touched[field] && errors[field]
      ? 'border-red-400 focus:border-red-500'
      : 'border-gray-200 focus:border-black'}`;

  const FieldError = ({ field }) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1" role="alert">
        <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />{errors[field]}
      </p>
    ) : null;

  const noAvailability = formData.pickup_date && formData.vehicle_type
    && !checkingAvailability && availableSlots.length === 0;

  // ── Success ──────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <section id="booking" className="bg-white py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <CheckCircle className="w-20 h-20 text-black mx-auto mb-8" aria-hidden="true" />
            <h2 className="font-gothic text-5xl md:text-6xl text-black mb-4">
              Reservation Received
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Our team will contact you within 2 hours to confirm your booking.<br />We look forward to serving you.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <section id="booking" className="bg-white py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mb-4">Book Now</p>
          <h2 className="font-gothic text-5xl md:text-7xl text-black">
            Reserve Your Ride
          </h2>
        </motion.div>

        {/* No availability fallback */}
        {noAvailability && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 border border-black/10 bg-gray-50" role="alert">
            <p className="text-sm font-medium text-gray-900 mb-1">No online availability for this date</p>
            <p className="text-sm text-gray-600 mb-4">
              Try a different date, or contact us — we may accommodate last-minute requests.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+16122751722"
                className="inline-flex items-center gap-2 bg-black text-white text-xs tracking-widest uppercase px-6 py-3 hover:bg-gray-900 transition-colors font-medium">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />Call (612) 275-1722
              </a>
              <a href="mailto:info@sliquemoves.com"
                className="inline-flex items-center gap-2 border border-black text-black text-xs tracking-widest uppercase px-6 py-3 hover:bg-black hover:text-white transition-colors font-medium">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />Email Us
              </a>
            </div>
          </motion.div>
        )}

        <motion.form onSubmit={handleSubmit} className="space-y-8" noValidate
          aria-label="Reservation request form"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>

          {/* Contact */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="customer_name" className="text-xs tracking-widest uppercase text-gray-500">Full Name *</Label>
              <Input id="customer_name" value={formData.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, customer_name: true }))}
                className={fieldClass('customer_name')} placeholder="John Smith"
                aria-required="true" aria-invalid={!!(touched.customer_name && errors.customer_name)} />
              <FieldError field="customer_name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs tracking-widest uppercase text-gray-500">Email *</Label>
              <Input id="email" type="email" value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                className={fieldClass('email')} placeholder="john@email.com"
                aria-required="true" aria-invalid={!!(touched.email && errors.email)} />
              <FieldError field="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs tracking-widest uppercase text-gray-500">Phone *</Label>
              <Input id="phone" type="tel" value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, phone: true }))}
                className={fieldClass('phone')} placeholder="(612) 555-0100"
                aria-required="true" aria-invalid={!!(touched.phone && errors.phone)} />
              <FieldError field="phone" />
            </div>
          </div>

          {/* Service & Vehicle */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="service_type" className="text-xs tracking-widest uppercase text-gray-500">Service Type *</Label>
              <Select value={formData.service_type} onValueChange={v => handleChange('service_type', v)}>
                <SelectTrigger id="service_type" className={fieldClass('service_type')} aria-required="true">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError field="service_type" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle_type" className="text-xs tracking-widest uppercase text-gray-500">Vehicle *</Label>
              <Select value={formData.vehicle_type} onValueChange={v => handleChange('vehicle_type', v)}>
                <SelectTrigger id="vehicle_type" className={fieldClass('vehicle_type')} aria-required="true">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError field="vehicle_type" />
            </div>
          </div>

          {/* Date / Time / Passengers */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="pickup_date" className="text-xs tracking-widest uppercase text-gray-500">Pickup Date *</Label>
              <Input id="pickup_date" type="date" min={new Date().toISOString().split('T')[0]}
                value={formData.pickup_date}
                onChange={e => handleChange('pickup_date', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, pickup_date: true }))}
                className={fieldClass('pickup_date')} aria-required="true" />
              <FieldError field="pickup_date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Time *</Label>
              {formData.pickup_date && formData.vehicle_type ? (
                checkingAvailability ? (
                  <div className="border border-gray-200 rounded-none h-12 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-label="Checking availability" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <>
                    <Select value={formData.pickup_time} onValueChange={v => handleChange('pickup_time', v)}>
                      <SelectTrigger className={fieldClass('pickup_time')} aria-required="true">
                        <SelectValue placeholder="Select available time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FieldError field="pickup_time" />
                  </>
                ) : (
                  <div className="border border-red-200 bg-red-50 rounded-none h-12 flex items-center px-3 gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs text-red-600">No slots — try another date</span>
                  </div>
                )
              ) : (
                <div className="border border-gray-200 rounded-none h-12 flex items-center px-3">
                  <span className="text-xs text-gray-400">Select date &amp; vehicle first</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passengers" className="text-xs tracking-widest uppercase text-gray-500">Passengers</Label>
              <Input id="passengers" type="number" min="1" max="6" value={formData.passengers}
                onChange={e => handleChange('passengers', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" />
            </div>
          </div>

          {/* Availability banner */}
          {formData.pickup_date && formData.vehicle_type && !checkingAvailability && (
            <div className={`p-4 flex items-start gap-3 ${availableSlots.length > 0
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'}`}
              role="status" aria-live="polite">
              {availableSlots.length > 0 ? (
                <><CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-green-800">
                    {availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available on this date
                  </span></>
              ) : (
                <><AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm text-amber-800">
                    Fully booked online. Try a different date or call{' '}
                    <a href="tel:+16122751722" className="font-medium underline underline-offset-2">(612) 275-1722</a>.
                  </span></>
              )}
            </div>
          )}

          {/* Locations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="pickup_location" className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
              <Input id="pickup_location" value={formData.pickup_location}
                onChange={e => handleChange('pickup_location', e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, pickup_location: true }))}
                className={fieldClass('pickup_location')} placeholder="Address or airport terminal"
                aria-required="true" />
              <FieldError field="pickup_location" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dropoff_location" className="text-xs tracking-widest uppercase text-gray-500">Dropoff Location</Label>
              <Input id="dropoff_location" value={formData.dropoff_location}
                onChange={e => handleChange('dropoff_location', e.target.value)}
                className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Destination address" />
            </div>
          </div>

          {/* Special requests */}
          <div className="space-y-1.5">
            <Label htmlFor="special_requests" className="text-xs tracking-widest uppercase text-gray-500">Special Requests</Label>
            <Textarea id="special_requests" value={formData.special_requests}
              onChange={e => handleChange('special_requests', e.target.value)}
              className="border-gray-200 focus:border-black rounded-none min-h-[100px] resize-none"
              placeholder="Child seat, flight number, route preferences, etc." />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button type="submit"
              disabled={isSubmitting || (formData.pickup_date && formData.vehicle_type && !checkingAvailability && availableSlots.length === 0)}
              className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Processing…
                </span>
              ) : 'Submit Reservation Request'}
            </Button>
            {hasErrors && Object.values(touched).some(Boolean) && (
              <p className="text-xs text-red-500 text-center mt-3" role="alert">
                Please fix the highlighted fields above before submitting.
              </p>
            )}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
