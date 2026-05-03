import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const serviceTypes = [
  { value: "hourly_charter", label: "Hourly Charter" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "corporate", label: "Corporate Travel" },
  { value: "special_event", label: "Special Event" }
];

const vehicleTypes = [
  { value: "escalade_suv",     label: "Escalade SUV" },
  { value: "mercedes_limo",    label: "Mercedes Limousine" },
  { value: "mercedes_sprinter",label: "Mercedes Sprinter Van" },
  { value: "mercedes_amg",     label: "Mercedes AMG Sedan" },
];

// ─── Custom Date Picker ────────────────────────────────────────────────────────
function DatePicker({ value, onChange, minDate }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? new Date(minDate + 'T00:00:00') : today;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const formatDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatValue = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSelect = (day) => {
    const selected = new Date(year, month, day);
    if (selected < min) return;
    onChange(formatValue(selected));
    setOpen(false);
  };

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-200 hover:border-black focus:border-black focus:outline-none rounded-none h-12 px-3 flex items-center justify-between text-left transition-colors bg-white"
      >
        <span className={value ? 'text-black text-sm' : 'text-gray-400 text-sm'}>
          {value ? formatDisplay(value) : 'Select date'}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      {/* Calendar popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 shadow-2xl"
            style={{ width: 340, padding: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-medium tracking-wide">
                {monthNames[month]} {year}
              </div>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(w => (
                <div key={w} className="text-center text-[10px] tracking-widest uppercase text-gray-400 py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dayDate = new Date(year, month, day);
                const isPast = dayDate < min;
                const isSelected = selectedDate &&
                  dayDate.getDate() === selectedDate.getDate() &&
                  dayDate.getMonth() === selectedDate.getMonth() &&
                  dayDate.getFullYear() === selectedDate.getFullYear();
                const isToday =
                  dayDate.getDate() === today.getDate() &&
                  dayDate.getMonth() === today.getMonth() &&
                  dayDate.getFullYear() === today.getFullYear();

                return (
                  <button
                    type="button"
                    key={day}
                    disabled={isPast}
                    onClick={() => handleSelect(day)}
                    className={`
                      aspect-square text-sm transition-all
                      ${isPast ? 'text-gray-200 cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-black text-white font-medium' : ''}
                      ${!isSelected && !isPast ? 'hover:bg-gray-100 text-gray-800' : ''}
                      ${isToday && !isSelected ? 'border border-gray-300 font-medium' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Booking Section ──────────────────────────────────────────────────────
export default function BookingSection() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    service_type: '',
    vehicle_type: '',
    pickup_date: '',
    pickup_time: '',
    pickup_location: '',
    dropoff_location: '',
    passengers: 1,
    special_requests: ''
  });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('vehicle=')) {
      const vehicleType = hash.split('vehicle=')[1];
      setFormData(prev => ({ ...prev, vehicle_type: vehicleType }));
      window.location.hash = '';
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'pickup_date' || field === 'vehicle_type') {
        next.pickup_time = '';
      }
      return next;
    });
  };

  // Check availability when date and vehicle are selected
  // NEW LOGIC: All times are open by default. Only times with a blocking row
  // (is_available=false, either an admin block or an existing booking) are unavailable.
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.pickup_date && formData.vehicle_type) {
        setCheckingAvailability(true);
        const allTimeSlots = [
          '06:00','07:00','08:00','09:00','10:00','11:00',
          '12:00','13:00','14:00','15:00','16:00','17:00',
          '18:00','19:00','20:00','21:00','22:00','23:00'
        ];
        const { data, error } = await supabase
          .from('availability')
          .select('time_slot')
          .eq('date', formData.pickup_date)
          .eq('vehicle_type', formData.vehicle_type)
          .eq('is_available', false);

        if (error) {
          console.error('Availability fetch error:', error);
          setAvailableSlots(allTimeSlots);
        } else {
          const blocked = new Set((data || []).map(r => r.time_slot));
          setAvailableSlots(allTimeSlots.filter(t => !blocked.has(t)));
        }
        setCheckingAvailability(false);
      } else {
        setAvailableSlots([]);
      }
    };
    checkAvailability();
  }, [formData.pickup_date, formData.vehicle_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          ...formData,
          passengers: Number(formData.passengers),
          status: 'pending'
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 2. Insert a blocking row in availability so this slot can't be double-booked
      await supabase.from('availability').insert([{
        date: formData.pickup_date,
        time_slot: formData.pickup_time,
        vehicle_type: formData.vehicle_type,
        is_available: false,
        booking_id: booking.id,
      }]);

      // Fire off confirmation emails (don't block on this)
      fetch('/api/send-booking-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking, appUrl: window.location.origin }),
      }).catch(err => console.error('Email send failed:', err));

      navigate(`/BookingConfirmation?id=${booking.id}`);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <section id="booking" className="bg-white py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mb-4">Book Now</p>
          <h2 className="text-4xl md:text-5xl font-light text-black tracking-tight">
            RESERVE YOUR <span className="font-semibold">RIDE</span>
          </h2>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Contact Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Full Name *</Label>
              <Input required value={formData.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Email *</Label>
              <Input required type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="john@email.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Phone *</Label>
              <Input required type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="(612) 555-0100" />
            </div>
          </div>

          {/* Service & Vehicle */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Service Type *</Label>
              <Select required value={formData.service_type} onValueChange={(v) => handleChange('service_type', v)}>
                <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>{serviceTypes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Vehicle *</Label>
              <Select required value={formData.vehicle_type} onValueChange={(v) => handleChange('vehicle_type', v)}>
                <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicleTypes.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Date, Time, Passengers */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Date *</Label>
              <DatePicker
                value={formData.pickup_date}
                onChange={(v) => handleChange('pickup_date', v)}
                minDate={todayStr}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Time *</Label>
              {formData.pickup_date && formData.vehicle_type ? (
                checkingAvailability ? (
                  <div className="border border-gray-200 rounded-none h-12 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                ) : availableSlots.length > 0 ? (
                  <Select required value={formData.pickup_time} onValueChange={(v) => handleChange('pickup_time', v)}>
                    <SelectTrigger className="border-gray-200 focus:border-black rounded-none h-12"><SelectValue placeholder="Select available time" /></SelectTrigger>
                    <SelectContent>{availableSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <div className="border border-red-200 bg-red-50 rounded-none h-12 flex items-center px-3 gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">No availability</span>
                  </div>
                )
              ) : (
                <div className="border border-gray-200 rounded-none h-12 flex items-center px-3">
                  <span className="text-xs text-gray-400">Select date & vehicle first</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Passengers</Label>
              <Input type="number" min="1" max="6" value={formData.passengers} onChange={(e) => handleChange('passengers', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" />
            </div>
          </div>

          {/* Availability Message */}
          {formData.pickup_date && formData.vehicle_type && !checkingAvailability && (
            <div className={`p-4 rounded-lg border ${availableSlots.length > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {availableSlots.length > 0 ? (
                  <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-sm text-green-800">{availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available on this date</span></>
                ) : (
                  <><AlertCircle className="w-5 h-5 text-red-600" /><span className="text-sm text-red-800">Fully booked for this date. Please select a different date or vehicle.</span></>
                )}
              </div>
            </div>
          )}

          {/* Locations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Pickup Location *</Label>
              <Input required value={formData.pickup_location} onChange={(e) => handleChange('pickup_location', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Address or airport terminal" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">Dropoff Location</Label>
              <Input value={formData.dropoff_location} onChange={(e) => handleChange('dropoff_location', e.target.value)} className="border-gray-200 focus:border-black rounded-none h-12" placeholder="Destination address" />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">Special Requests</Label>
            <Textarea value={formData.special_requests} onChange={(e) => handleChange('special_requests', e.target.value)} className="border-gray-200 focus:border-black rounded-none min-h-[100px] resize-none" placeholder="Child seat, specific route preferences, flight number, etc." />
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || availableSlots.length === 0}
              className="w-full bg-black text-white hover:bg-gray-900 py-6 text-sm tracking-widest uppercase font-medium rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : 'Submit Reservation Request'}
            </Button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
