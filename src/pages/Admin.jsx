import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2, Clock, Users, MapPin, Car, Phone, Mail, ChevronDown, ChevronUp, RefreshCw, X, Lock, Unlock } from 'lucide-react';
import AdminTopBar from '@/components/AdminTopBar';

const timeSlots = [
  '00:00','01:00','02:00','03:00','04:00','05:00',
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00'
];

// Black & white gothic palette
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#d4d4d4', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.25)' },
  confirmed: { label: 'Confirmed', color: '#ffffff', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.4)' },
  completed: { label: 'Completed', color: '#888888', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.12)' },
  cancelled: { label: 'Cancelled', color: '#666666', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.08)' },
};

const SERVICE_LABELS = {
  hourly_charter: 'Hourly Charter',
  airport_transfer: 'Airport Transfer',
  corporate: 'Corporate Travel',
  special_event: 'Special Event',
  daily_rental: 'Daily Rental',
};

const VEHICLE_LABELS = {
  escalade_suv: 'Escalade SUV',
  mercedes_limo: 'Mercedes Limousine',
  mercedes_sprinter: 'Sprinter Van',
  mercedes_amg: 'AMG Sedan',
  // legacy fallbacks
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
  // Daily rentals
  tesla_model_y: 'Tesla Model Y Performance',
  amg_c43: 'Mercedes-AMG C43',
  amg_cle53: 'Mercedes-AMG CLE 53',
  porsche_718s: 'Porsche 718 S',
  corvette_c8: 'Corvette C8',
  corvette_c8_z06: 'Corvette C8 Z06',
};

const VEHICLE_OPTIONS = [
  { value: 'escalade_suv',     label: 'Escalade SUV' },
  { value: 'mercedes_limo',    label: 'Mercedes Limousine' },
  { value: 'mercedes_sprinter',label: 'Mercedes Sprinter Van' },
  { value: 'mercedes_amg',     label: 'Mercedes AMG Sedan' },
];

const SERVICE_OPTIONS = [
  { value: 'hourly_charter',  label: 'Hourly Charter' },
  { value: 'airport_transfer',label: 'Airport Transfer' },
  { value: 'corporate',       label: 'Corporate Travel' },
  { value: 'special_event',   label: 'Special Event' },
];

function generateRef(id) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SLQ-';
  const seed = id ? String(id).replace(/-/g, '') : Date.now().toString(16);
  for (let i = 0; i < 6; i++) ref += chars[parseInt(seed[i] || '0', 16) % chars.length];
  return ref;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function format12Hour(time24) {
  if (!time24) return '';
  const [h] = time24.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 28px', borderRadius: 16 }}>
      <p style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 32, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, color: '#ffffff' }}>{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: 'rgba(255,255,255,0.4)' }}>
        {icon}
        <span style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: '#e0e0e0', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>{value}</p>
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onStatusChange, updating }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const ref = generateRef(booking.id);

  return (
    <motion.div layout style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, overflow: 'hidden', borderRadius: 14 }}>
      <div style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 3, height: 36, background: status.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontFamily: "'Cormorant Garamond', Georgia, serif", color: '#ffffff', fontWeight: 400, letterSpacing: '0.02em' }}>
            {booking.customer_name}
          </p>
          <p style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', fontFamily: "'Courier New', monospace", marginTop: 2 }}>
            {ref}
          </p>
        </div>
        <div style={{ textAlign: 'right', marginRight: 16 }}>
          <p style={{ fontSize: 11, color: '#e0e0e0', letterSpacing: '0.04em' }}>{formatDate(booking.pickup_date)}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{format12Hour(booking.pickup_time)}</p>
        </div>
        <span style={{
          fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase',
          padding: '4px 10px', border: `1px solid ${status.border}`,
          color: status.color, background: status.bg, flexShrink: 0, borderRadius: 9999,
        }}>
          {status.label}
        </span>
        <div style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 20px 20px 39px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <DetailItem icon={<Mail size={11} />} label="Email" value={booking.email} />
            <DetailItem icon={<Phone size={11} />} label="Phone" value={booking.phone} />
            <DetailItem icon={<Car size={11} />} label="Vehicle" value={VEHICLE_LABELS[booking.vehicle_type] || booking.vehicle_type} />
            <DetailItem icon={<Users size={11} />} label="Passengers" value={booking.passengers} />
            <DetailItem icon={<MapPin size={11} />} label="Pickup" value={booking.pickup_location} />
            {booking.dropoff_location && <DetailItem icon={<MapPin size={11} />} label="Dropoff" value={booking.dropoff_location} />}
            <DetailItem icon={<Clock size={11} />} label="Service" value={SERVICE_LABELS[booking.service_type] || booking.service_type} />
          </div>

          {booking.special_requests && (
            <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Special Notes</p>
              <p style={{ fontSize: 12, color: '#cccccc', fontFamily: "'Cormorant Garamond', Georgia, serif", lineHeight: 1.7 }}>{booking.special_requests}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Update Status</p>
            <Select value={booking.status} onValueChange={(s) => onStatusChange(booking.id, s)} disabled={updating}>
              <SelectTrigger style={{ width: 160, height: 34, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 11, color: '#e0e0e0' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {updating && <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Manual Booking Modal ─────────────────────────────────────────────────────
function NewBookingModal({ open, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', email: '', phone: '',
    service_type: '', vehicle_type: '',
    pickup_date: '', pickup_time: '',
    pickup_location: '', dropoff_location: '',
    passengers: 1, special_requests: '',
    status: 'confirmed',
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => setForm({
    customer_name: '', email: '', phone: '',
    service_type: '', vehicle_type: '',
    pickup_date: '', pickup_time: '',
    pickup_location: '', dropoff_location: '',
    passengers: 1, special_requests: '',
    status: 'confirmed',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create the booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([{
          ...form,
          passengers: Number(form.passengers),
        }])
        .select()
        .single();
      if (error) throw error;

      // 2. Mark the slot as taken (creates a blocking row in availability)
      await supabase.from('availability').insert([{
        date: form.pickup_date,
        time_slot: form.pickup_time,
        vehicle_type: form.vehicle_type,
        is_available: false,
        booking_id: booking.id,
      }]);

      toast.success(`Booking created for ${form.customer_name}`);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 100 }}
          />
          {/* Modal — flex-centered so motion's transform animation doesn't clobber centering */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              width: 'min(640px, 92vw)', maxHeight: '90vh', overflow: 'auto',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14,
              padding: 36, pointerEvents: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20 }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Slique Moves</p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 300, color: '#ffffff', letterSpacing: '0.04em' }}>
                  New <span style={{ fontStyle: 'italic' }}>Reservation</span>
                </h2>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 8, borderRadius: 9999 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Guest */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Full Name" required>
                  <input required value={form.customer_name} onChange={e => upd('customer_name', e.target.value)} style={inputStyle} placeholder="Jane Doe" />
                </Field>
                <Field label="Phone" required>
                  <input required type="tel" value={form.phone} onChange={e => upd('phone', e.target.value)} style={inputStyle} placeholder="(612) 555-0100" />
                </Field>
              </div>
              <Field label="Email" required>
                <input required type="email" value={form.email} onChange={e => upd('email', e.target.value)} style={inputStyle} placeholder="jane@example.com" />
              </Field>

              {/* Service & vehicle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Service" required>
                  <Select value={form.service_type} onValueChange={v => upd('service_type', v)}>
                    <SelectTrigger style={selectStyle}><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Vehicle" required>
                  <Select value={form.vehicle_type} onValueChange={v => upd('vehicle_type', v)}>
                    <SelectTrigger style={selectStyle}><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Date & time & passengers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Date" required>
                  <input required type="date" value={form.pickup_date} onChange={e => upd('pickup_date', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Time" required>
                  <Select value={form.pickup_time} onValueChange={v => upd('pickup_time', v)}>
                    <SelectTrigger style={selectStyle}><SelectValue placeholder="Time" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t} value={t}>{format12Hour(t)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Passengers">
                  <input type="number" min="1" max="20" value={form.passengers} onChange={e => upd('passengers', e.target.value)} style={inputStyle} />
                </Field>
              </div>

              {/* Locations */}
              <Field label="Pickup Location" required>
                <input required value={form.pickup_location} onChange={e => upd('pickup_location', e.target.value)} style={inputStyle} placeholder="Address or terminal" />
              </Field>
              <Field label="Dropoff Location">
                <input value={form.dropoff_location} onChange={e => upd('dropoff_location', e.target.value)} style={inputStyle} placeholder="Destination" />
              </Field>

              {/* Notes */}
              <Field label="Notes">
                <textarea value={form.special_requests} onChange={e => upd('special_requests', e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Special requests, flight numbers, etc." />
              </Field>

              {/* Status */}
              <Field label="Status">
                <Select value={form.status} onValueChange={v => upd('status', v)}>
                  <SelectTrigger style={selectStyle}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={onClose}
                  style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 9999 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 2, padding: '14px', background: '#ffffff', color: '#000000', border: '1px solid #ffffff', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, opacity: submitting ? 0.5 : 1, borderRadius: 9999 }}>
                  {submitting ? 'Creating…' : 'Create Booking'}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#ffffff',
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  borderRadius: 12,
};

const selectStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#e0e0e0',
  height: 40,
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
        {label} {required && <span style={{ color: 'rgba(255,255,255,0.7)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Availability Block Manager ───────────────────────────────────────────────
function AvailabilityPanel({ refresh }) {
  const [date, setDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!date || !vehicle) { setBlockedSlots([]); setBookedSlots([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('date', date)
      .eq('vehicle_type', vehicle)
      .eq('is_available', false);
    if (error) console.error(error);
    const all = data || [];
    setBlockedSlots(all.filter(a => !a.booking_id).map(a => ({ ...a })));
    setBookedSlots(all.filter(a => a.booking_id).map(a => ({ ...a })));
    setLoading(false);
  }, [date, vehicle]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = async (timeSlot) => {
    const existing = blockedSlots.find(b => b.time_slot === timeSlot);
    if (existing) {
      // Unblock
      await supabase.from('availability').delete().eq('id', existing.id);
      toast.success(`${timeSlot} unblocked`);
    } else {
      // Block
      await supabase.from('availability').insert([{
        date, vehicle_type: vehicle, time_slot: timeSlot, is_available: false
      }]);
      toast.success(`${timeSlot} blocked`);
    }
    load();
    refresh();
  };

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', padding: 28, borderRadius: 16 }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#ffffff', letterSpacing: '0.05em', marginBottom: 6 }}>
        Block Times
      </h2>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 20, letterSpacing: '0.05em' }}>
        All times are open by default. Use this to mark vehicles unavailable on specific dates.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Date</label>
        <Input type="date" min={new Date().toISOString().split('T')[0]} value={date} onChange={e => setDate(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#e0e0e0', height: 40, colorScheme: 'dark' }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Vehicle</label>
        <Select value={vehicle} onValueChange={setVehicle}>
          <SelectTrigger style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#e0e0e0', height: 40 }}>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {date && vehicle && (
        loading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Loader2 size={16} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto' }} />
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
              Tap to toggle availability
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {timeSlots.map(t => {
                const isBooked = bookedSlots.some(b => b.time_slot === t);
                const isBlocked = blockedSlots.some(b => b.time_slot === t);
                const isOpen = !isBooked && !isBlocked;

                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isBooked}
                    onClick={() => !isBooked && toggleBlock(t)}
                    style={{
                      padding: '8px 6px',
                      background: isBooked ? 'rgba(255,255,255,0.02)' : isBlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid',
                      borderColor: isBooked ? 'rgba(255,255,255,0.06)' : isBlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                      color: isBooked ? 'rgba(255,255,255,0.25)' : isBlocked ? 'rgba(255,255,255,0.45)' : '#ffffff',
                      fontSize: 11,
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      textDecoration: isBlocked ? 'line-through' : 'none',
                    }}
                    title={isBooked ? 'Booked' : isBlocked ? 'Click to unblock' : 'Click to block'}
                  >
                    {isBooked ? <Lock size={9} /> : isBlocked ? <Lock size={9} /> : <Unlock size={9} />}
                    {format12Hour(t)}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              <span>○ Open</span>
              <span>● Blocked</span>
              <span style={{ opacity: 0.5 }}>✕ Booked</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function Admin() {
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) console.error('Bookings fetch error:', error);
    setBookings(data || []);
    setBookingsLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => {
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchBookings();
    }
    setUpdatingId(null);
  };

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <AdminTopBar backHref="/bookings" backLabel="Calendar" center="Slique Moves" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24 }}
        >
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Slique Moves</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, color: '#ffffff', letterSpacing: '0.04em' }}>
              Bookings
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setNewBookingOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#ffffff', border: '1px solid #ffffff', color: '#000000', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, borderRadius: 9999 }}
            >
              <Plus size={11} /> New Booking
            </button>
            <button
              onClick={fetchBookings}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 9999 }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats — total removed, 3 remain */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Confirmed" value={stats.confirmed} />
          <StatCard label="Completed" value={stats.completed} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: '#e0e0e0', letterSpacing: '0.05em' }}>
                Reservations
              </h2>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    style={{
                      padding: '5px 12px', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
                      border: '1px solid',
                      borderColor: statusFilter === f ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.06)',
                      background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: statusFilter === f ? '#ffffff' : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {bookingsLoading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.2)', fontSize: 12, letterSpacing: '0.1em' }}>
                No reservations found
              </div>
            ) : (
              filtered.map(b => (
                <BookingCard key={b.id} booking={b} onStatusChange={handleStatusChange} updating={updatingId === b.id} />
              ))
            )}
          </div>

          <AvailabilityPanel refresh={fetchBookings} />
        </div>
      </div>

      <NewBookingModal
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        onCreated={fetchBookings}
      />
    </div>
  );
}
