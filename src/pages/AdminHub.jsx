// src/pages/AdminHub.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Slique Moves — Admin Command Center (/manage)
//
// Built around the daily-rental business: at a glance you can see every car's
// schedule for the week, and enter a new booking in seconds (most come in by
// text). Rows are vehicles, columns are the 7 days of the week; a filled cell
// means the car is out. Flip between weeks with the arrows (lands on the
// current week). Tap an open day to start a booking pre-filled with that car +
// date; tap a booked day to see / edit / cancel it.
//
// Chauffeur Bookings and Outreach remain reachable from the top strip.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Plus, ChevronLeft, ChevronRight, X, Phone, Trash2, CalendarDays,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { insertBooking } from '@/lib/insertBooking';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminTopBar from '@/components/AdminTopBar';
import { useIsMobile } from '@/components/ui/use-mobile';
import ZelleIcon from '@/components/ZelleIcon';
import DateRangePicker from '@/components/landing/DateRangePicker';
import {
  ALL_VEHICLES, DAILY_RENTALS, CHAUFFEUR_VEHICLES, VEHICLE_BY_TYPE, vehicleLabel,
} from '@/lib/fleet';

// Lighter Zelle purple for legible text on the dark admin panels.
const ZELLE_PURPLE_LIGHT = '#b794f6';

// ─── date helpers (all local-time, no UTC drift) ──────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => (s ? new Date(s + 'T00:00:00') : null);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Sunday (local midnight) of the week containing `d`.
const startOfWeek = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
};

// "Jun 7 – 13, 2026" (collapses month/year when the week stays within one).
function weekRangeLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const left = `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()}`;
  const right = sameMonth ? `${end.getDate()}` : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
  return `${left} – ${right}, ${end.getFullYear()}`;
}

function prettyDate(s) {
  const d = parseYmd(s);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function prettyShort(s) {
  const d = parseYmd(s);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Nights between pickup & return (>=1). Matches the public inquiry math.
function rentalNights(pickup, ret) {
  const a = parseYmd(pickup);
  const b = parseYmd(ret);
  if (!a || !b) return 1;
  return Math.max(Math.round((b - a) / 86400000), 1);
}

// Pull "Return date: YYYY-MM-DD" out of legacy notes (rows created before the
// return_date column existed).
function returnFromNotes(notes) {
  if (!notes) return null;
  const m = String(notes).match(/Return date:\s*(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// The day a car is free again = the booking's end day (inclusive occupancy).
function bookingEnd(b) {
  return b.return_date || returnFromNotes(b.special_requests) || b.pickup_date;
}

const PROCESSING_RATE = 0.035;
const usd = (n) => (n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }));

// ─── status palette (monochrome gothic) ───────────────────────────────────────
const STATUS = {
  pending:   { label: 'Pending',   cell: 'rgba(255,255,255,0.20)', cellBorder: 'rgba(255,255,255,0.35)', text: '#fff',     dot: '#bdbdbd' },
  confirmed: { label: 'Confirmed', cell: 'rgba(255,255,255,0.92)', cellBorder: '#ffffff',                text: '#000',     dot: '#ffffff' },
  completed: { label: 'Completed', cell: 'rgba(255,255,255,0.07)', cellBorder: 'rgba(255,255,255,0.16)', text: '#9a9a9a',  dot: '#6a6a6a' },
};
const STATUS_ORDER = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_LABEL = { ...Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label])), cancelled: 'Cancelled' };

// ══════════════════════════════════════════════════════════════════════════════
// Modal shell — flex-centered so Framer Motion's transform animation and the
// centering don't fight (the old top/left+translate approach got clobbered by
// motion's own transform, dropping the panel into the bottom-right corner).
// ══════════════════════════════════════════════════════════════════════════════
function ModalShell({ open, onClose, width = 560, children }) {
  const isMobile = useIsMobile();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16, pointerEvents: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 40 : 16, scale: isMobile ? 1 : 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: isMobile ? 40 : 16, scale: isMobile ? 1 : 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                width: isMobile ? '100%' : `min(${width}px, 94vw)`, maxHeight: isMobile ? '94vh' : '92vh', overflow: 'auto',
                background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: isMobile ? '28px 28px 0 0' : 14,
                padding: isMobile ? '24px 18px calc(24px + env(safe-area-inset-bottom))' : 30, pointerEvents: 'auto',
                boxShadow: isMobile ? '0 -20px 60px rgba(0,0,0,0.7)' : '0 30px 80px rgba(0,0,0,0.6)',
              }}>
              {isMobile && <div style={{ width: 40, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.2)', margin: '0 auto 18px' }} />}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Quick-add booking modal
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY = {
  customer_name: '', phone: '', email: '',
  vehicle_type: '', pickup_date: '', return_date: '',
  pickup_location: '', special_requests: '', status: 'confirmed',
};

function NewBookingModal({ open, prefill, onClose, onCreated }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...(prefill || {}) });
  }, [open, prefill]);

  const upd = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === 'pickup_date' && f.return_date && f.return_date < v) next.return_date = '';
    return next;
  });

  const car = VEHICLE_BY_TYPE[form.vehicle_type];
  const isRental = car?.category === 'rental';
  const nights = isRental && form.return_date ? rentalNights(form.pickup_date, form.return_date) : (isRental ? 1 : 0);
  const subtotal = isRental && car?.rate ? nights * car.rate : null;
  const total = subtotal != null ? Math.round(subtotal * (1 + PROCESSING_RATE)) : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_type) return toast.error('Pick a vehicle');
    if (!form.customer_name.trim()) return toast.error('Add a customer name');
    if (!form.pickup_date) return toast.error('Pick a start date');
    if (isRental && form.return_date && form.return_date < form.pickup_date) {
      return toast.error('Return date must be after pickup');
    }
    setSaving(true);
    try {
      const { error } = await insertBooking({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        service_type: isRental ? 'daily_rental' : 'hourly_charter',
        vehicle_type: form.vehicle_type,
        pickup_date: form.pickup_date,
        return_date: isRental ? (form.return_date || form.pickup_date) : null,
        pickup_time: '10:00',
        pickup_location: form.pickup_location.trim(),
        dropoff_location: null,
        passengers: 1,
        daily_rate: isRental ? (car?.rate ?? null) : null,
        total_amount: total,
        special_requests: form.special_requests.trim() || null,
        status: form.status,
      });
      if (error) throw error;
      toast.success(`Booked ${form.customer_name.trim().split(' ')[0]} — ${vehicleLabel(form.vehicle_type)}`);
      onCreated();
      onClose();
    } catch (err) {
      console.error('[NewBooking] insert failed', err);
      toast.error(err.message?.includes('return_date')
        ? 'Run the SQL migration first (return_date column missing).'
        : 'Could not save booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} width={560}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 18 }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>New Booking</p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 300, color: '#fff', letterSpacing: '0.03em' }}>
                  Reserve a <span style={{ fontStyle: 'italic' }}>vehicle</span>
                </h2>
              </div>
              <button onClick={onClose} style={iconBtn}><X size={16} /></button>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Vehicle" required>
                <Select value={form.vehicle_type} onValueChange={(v) => upd('vehicle_type', v)}>
                  <SelectTrigger style={selectStyle}><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {DAILY_RENTALS.map((v) => (
                      <SelectItem key={v.type} value={v.type}>{v.name} · ${v.rate}/day</SelectItem>
                    ))}
                    {CHAUFFEUR_VEHICLES.map((v) => (
                      <SelectItem key={v.type} value={v.type}>{v.name.replace(/\s*-\s*Black$/i, '')} · Chauffeur</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                <Field label="Customer Name" required>
                  <input value={form.customer_name} onChange={(e) => upd('customer_name', e.target.value)} style={inputStyle} placeholder="Jane Doe" />
                </Field>
                <Field label="Phone" required>
                  <input type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} style={inputStyle} placeholder="(612) 555-0100" />
                </Field>
              </div>

              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} style={inputStyle} placeholder="optional" />
              </Field>

              <Field label={isRental ? 'Rental Dates' : 'Date'} required>
                <DateRangePicker
                  theme="dark"
                  startValue={form.pickup_date}
                  endValue={form.return_date}
                  onChange={(start, end) => setForm((f) => ({ ...f, pickup_date: start || '', return_date: end || '' }))}
                  placeholder={isRental ? 'Select pickup & return' : 'Select date'}
                />
              </Field>

              <Field label="Pickup / Delivery Location">
                <input value={form.pickup_location} onChange={(e) => upd('pickup_location', e.target.value)} style={inputStyle} placeholder="Address, airport, or 'shop pickup'" />
              </Field>

              <Field label="Notes">
                <textarea value={form.special_requests} onChange={(e) => upd('special_requests', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="From the text thread — anything to remember" />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => upd('status', v)}>
                    <SelectTrigger style={selectStyle}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['pending', 'confirmed', 'completed'].map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {/* est-total block follows; on its own it sits beside Status */}
                {subtotal != null && (
                  <div style={{ textAlign: 'right', paddingBottom: 8 }}>
                    <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                      {nights} night{nights === 1 ? '' : 's'} · est. total
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, color: '#fff' }}>{usd(total)}</p>
                    <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, color: ZELLE_PURPLE_LIGHT, fontSize: 12 }}>
                      <ZelleIcon size={15} /> With Zelle <span style={{ fontWeight: 600 }}>{usd(subtotal)}</span>
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...solidBtn, flex: 2, opacity: saving ? 0.5 : 1 }}>
                  {saving ? 'Saving…' : 'Add Booking'}
                </button>
              </div>
            </form>
    </ModalShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Booking detail modal (view / change status / delete)
// ══════════════════════════════════════════════════════════════════════════════
function BookingDetail({ booking, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);

  const end = booking ? bookingEnd(booking) : null;
  const isRange = booking && end && end !== booking.pickup_date;

  const setStatus = async (status) => {
    setBusy(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    setBusy(false);
    if (error) return toast.error('Could not update status');
    toast.success('Status updated');
    onChanged();
    onClose();
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${booking.customer_name}'s booking? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    setBusy(false);
    if (error) return toast.error('Could not delete booking');
    toast.success('Booking deleted');
    onChanged();
    onClose();
  };

  return (
    <ModalShell open={!!booking} onClose={onClose} width={460}>
      {booking && (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                  {vehicleLabel(booking.vehicle_type)}
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 300, color: '#fff', letterSpacing: '0.02em' }}>
                  {booking.customer_name}
                </h2>
              </div>
              <button onClick={onClose} style={iconBtn}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
              <Detail label="Dates" value={isRange ? `${prettyShort(booking.pickup_date)} → ${prettyShort(end)}` : prettyDate(booking.pickup_date)} />
              <Detail label="Total" value={usd(booking.total_amount)} />
              <Detail label="Phone" value={booking.phone ? <a href={`tel:${booking.phone}`} style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={11} /> {booking.phone}</a> : '—'} />
              <Detail label="Email" value={booking.email || '—'} />
              {booking.pickup_location && <Detail label="Location" value={booking.pickup_location} />}
              <Detail label="Service" value={booking.service_type === 'daily_rental' ? 'Daily Rental' : 'Chauffeur'} />
            </div>

            {booking.special_requests && (
              <div style={{ marginBottom: 22, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Notes</p>
                <p style={{ fontSize: 12, color: '#cfcfcf', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{booking.special_requests}</p>
              </div>
            )}

            <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Set Status</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
              {STATUS_ORDER.map((s) => {
                const active = booking.status === s;
                return (
                  <button key={s} type="button" disabled={busy || active} onClick={() => setStatus(s)}
                    style={{
                      padding: '8px 14px', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase',
                      border: '1px solid', borderColor: active ? '#fff' : 'rgba(255,255,255,0.18)',
                      background: active ? '#fff' : 'transparent', color: active ? '#000' : 'rgba(255,255,255,0.6)',
                      cursor: active ? 'default' : 'pointer', borderRadius: 9999,
                    }}>
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={remove} disabled={busy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,120,120,0.7)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}>
              <Trash2 size={12} /> Delete booking
            </button>
        </>
      )}
    </ModalShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Weekly availability grid — 7 days across, one row per vehicle
// ══════════════════════════════════════════════════════════════════════════════
function ScheduleGrid({ weekDays, bookings, onPickEmpty, onPickBooking }) {
  const todayStr = ymd(new Date());

  // Build `${type}|${dateStr}` → booking for each of the 7 visible days.
  const cellMap = useMemo(() => {
    const map = {};
    const first = weekDays[0];
    const last = weekDays[6];
    for (const b of bookings) {
      const start = parseYmd(b.pickup_date);
      const end = parseYmd(bookingEnd(b)) || start;
      if (!start) continue;
      let d = start < first ? new Date(first) : new Date(start);
      const stop = end > last ? last : end;
      while (d <= stop) {
        map[`${b.vehicle_type}|${ymd(d)}`] = b;
        d = addDays(d, 1);
      }
    }
    return map;
  }, [bookings, weekDays]);

  const LABEL = 156;
  const cols = `${LABEL}px repeat(7, minmax(0, 1fr))`;
  const ROW_H = 56;

  return (
    <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, background: '#0b0b0b' }}>
      <div style={{ minWidth: 760 }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'sticky', left: 0, zIndex: 2, background: '#0b0b0b', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-end', padding: '0 14px 10px' }}>
            <span style={{ fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Fleet</span>
          </div>
          {weekDays.map((dateObj) => {
            const dStr = ymd(dateObj);
            const isToday = dStr === todayStr;
            const dow = dateObj.getDay();
            const weekend = dow === 0 || dow === 6;
            return (
              <div key={dStr} style={{
                textAlign: 'center', padding: '12px 0 10px',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
                background: weekend ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}>
                <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: isToday ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.38)' }}>{WEEKDAY[dow]}</div>
                <div style={{
                  margin: '4px auto 0', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  background: isToday ? '#fff' : 'transparent', color: isToday ? '#000' : 'rgba(255,255,255,0.72)',
                  fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: isToday ? 600 : 400,
                }}>{dateObj.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Vehicle rows */}
        {ALL_VEHICLES.map((v, rowIdx) => (
          <div key={v.type} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: rowIdx === ALL_VEHICLES.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{
              position: 'sticky', left: 0, zIndex: 1, background: '#0b0b0b',
              borderRight: '1px solid rgba(255,255,255,0.1)', padding: '0 14px',
              height: ROW_H, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12.5, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.2 }}>{v.shortName}</span>
              <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: v.category === 'rental' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.28)', marginTop: 3 }}>
                {v.category === 'rental' ? `$${v.rate}/day` : 'Chauffeur'}
              </span>
            </div>
            {weekDays.map((dateObj, dayIdx) => {
              const dateStr = ymd(dateObj);
              const b = cellMap[`${v.type}|${dateStr}`];
              const dow = dateObj.getDay();
              const weekend = dow === 0 || dow === 6;
              const isToday = dateStr === todayStr;
              const cellBg = isToday ? 'rgba(255,255,255,0.05)' : weekend ? 'rgba(255,255,255,0.015)' : 'transparent';
              if (b) {
                const st = STATUS[b.status] || STATUS.pending;
                const isStart = b.pickup_date === dateStr;
                const isEnd = ymd(parseYmd(bookingEnd(b)) || parseYmd(b.pickup_date)) === dateStr;
                // Show the name on the booking's start day, or on the week's
                // first column when the booking spilled in from a prior week.
                const showName = isStart || dayIdx === 0;
                return (
                  <button key={dateStr} type="button"
                    title={`${b.customer_name} · ${prettyShort(b.pickup_date)}→${prettyShort(bookingEnd(b))} · ${STATUS_LABEL[b.status]}`}
                    onClick={() => onPickBooking(b)}
                    style={{
                      minWidth: 0, height: ROW_H, border: 'none', cursor: 'pointer', padding: '6px 0',
                      background: cellBg, borderLeft: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'stretch',
                    }}>
                    <div style={{
                      flex: 1, minWidth: 0, background: st.cell,
                      borderTop: `1px solid ${st.cellBorder}`, borderBottom: `1px solid ${st.cellBorder}`,
                      borderLeft: isStart ? `1px solid ${st.cellBorder}` : 'none',
                      borderRight: isEnd ? `1px solid ${st.cellBorder}` : 'none',
                      borderTopLeftRadius: isStart ? 8 : 0, borderBottomLeftRadius: isStart ? 8 : 0,
                      borderTopRightRadius: isEnd ? 8 : 0, borderBottomRightRadius: isEnd ? 8 : 0,
                      marginLeft: isStart ? 4 : 0, marginRight: isEnd ? 4 : 0,
                      display: 'flex', alignItems: 'center', padding: '0 10px',
                      justifyContent: showName ? 'flex-start' : 'center',
                    }}>
                      {showName && (
                        <span style={{ fontSize: 12, color: st.text, fontWeight: 500, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>
                          {b.customer_name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              }
              return (
                <button key={dateStr} type="button" title={`${v.shortName} · ${prettyShort(dateStr)} — open`}
                  onClick={() => onPickEmpty(v.type, dateStr)}
                  style={{
                    minWidth: 0, height: ROW_H, cursor: 'pointer', padding: 0,
                    border: 'none', borderLeft: '1px solid rgba(255,255,255,0.04)',
                    background: cellBg, transition: 'background 120ms, color 120ms', color: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = cellBg; e.currentTarget.style.color = 'transparent'; }}
                >
                  <Plus size={13} style={{ pointerEvents: 'none' }} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Mobile weekly view — no horizontal scroll. One shared 7-day header, then a
// bubbly card per vehicle whose 7 cells line up under that header. Tap an open
// cell to book; tap a filled one to edit. Built for one-thumb scanning.
// ══════════════════════════════════════════════════════════════════════════════
function MobileScheduleGrid({ weekDays, bookings, onPickEmpty, onPickBooking }) {
  const todayStr = ymd(new Date());

  const cellMap = useMemo(() => {
    const map = {};
    const first = weekDays[0];
    const last = weekDays[6];
    for (const b of bookings) {
      const start = parseYmd(b.pickup_date);
      const end = parseYmd(bookingEnd(b)) || start;
      if (!start) continue;
      let d = start < first ? new Date(first) : new Date(start);
      const stop = end > last ? last : end;
      while (d <= stop) {
        map[`${b.vehicle_type}|${ymd(d)}`] = b;
        d = addDays(d, 1);
      }
    }
    return map;
  }, [bookings, weekDays]);

  const COLS = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 };

  return (
    <div>
      {/* Shared day header */}
      <div style={{ ...COLS, marginBottom: 10, padding: '0 2px' }}>
        {weekDays.map((dateObj) => {
          const dStr = ymd(dateObj);
          const isToday = dStr === todayStr;
          const dow = dateObj.getDay();
          return (
            <div key={dStr} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                {WEEKDAY[dow][0]}
              </div>
              <div style={{
                margin: '3px auto 0', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                background: isToday ? '#fff' : 'transparent', color: isToday ? '#000' : 'rgba(255,255,255,0.7)',
                fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, fontWeight: isToday ? 600 : 400,
              }}>{dateObj.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* One card per vehicle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALL_VEHICLES.map((v) => (
          <div key={v.type} style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '12px 12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
              <span style={{ fontSize: 13, color: '#fff', letterSpacing: '0.01em' }}>{v.shortName}</span>
              <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                {v.category === 'rental' ? `$${v.rate}/day` : 'Chauffeur'}
              </span>
            </div>
            <div style={COLS}>
              {weekDays.map((dateObj) => {
                const dateStr = ymd(dateObj);
                const b = cellMap[`${v.type}|${dateStr}`];
                const isToday = dateStr === todayStr;
                if (b) {
                  const st = STATUS[b.status] || STATUS.pending;
                  const isStart = b.pickup_date === dateStr;
                  return (
                    <button key={dateStr} type="button" onClick={() => onPickBooking(b)}
                      title={`${b.customer_name} · ${STATUS_LABEL[b.status]}`}
                      style={{
                        aspectRatio: '1 / 1', border: `1px solid ${st.cellBorder}`, background: st.cell,
                        borderRadius: 9, cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: st.text, fontSize: 13, fontWeight: 600,
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                      }}>
                      {isStart ? b.customer_name.trim().charAt(0).toUpperCase() : ''}
                    </button>
                  );
                }
                return (
                  <button key={dateStr} type="button" onClick={() => onPickEmpty(v.type, dateStr)}
                    title={`${v.shortName} · open`}
                    style={{
                      aspectRatio: '1 / 1', border: '1px solid rgba(255,255,255,0.08)',
                      background: isToday ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 9, cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.25)',
                    }}>
                    <Plus size={12} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminHub() {
  const isMobile = useIsMobile();
  // Land on the current week (Sunday-anchored).
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ pendingBookings: 0, drafts: 0 });

  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [detail, setDetail] = useState(null);

  // The 7 Date objects for the visible week (memoized so the grid's deps are stable).
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    const weekEnd = addDays(weekStart, 6);
    // Pull a generous look-back so multi-day rentals that began earlier still
    // appear; overlap with the visible week is filtered client-side.
    const windowStart = ymd(addDays(weekStart, -60));
    const windowEnd = ymd(weekEnd);

    try {
      const [bRes, pendRes, draftRes] = await Promise.all([
        supabase.from('bookings').select('*')
          .neq('status', 'cancelled')
          .gte('pickup_date', windowStart)
          .lte('pickup_date', windowEnd)
          .order('pickup_date', { ascending: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('email_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
      ]);

      const overlapping = (bRes.data || []).filter((b) => {
        const s = parseYmd(b.pickup_date);
        const e = parseYmd(bookingEnd(b)) || s;
        return s && e >= weekStart && s <= weekEnd;
      });
      setBookings(overlapping);
      setCounts({ pendingBookings: pendRes.count ?? 0, drafts: draftRes.count ?? 0 });
    } catch (err) {
      console.error('[AdminHub] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchWeek(); }, [fetchWeek]);

  const goPrev = () => setWeekStart((w) => addDays(w, -7));
  const goNext = () => setWeekStart((w) => addDays(w, 7));
  const goThisWeek = () => setWeekStart(startOfWeek(new Date()));
  const isThisWeek = ymd(weekStart) === ymd(startOfWeek(new Date()));

  const openEmpty = (vehicle_type, pickup_date) => { setPrefill({ vehicle_type, pickup_date }); setAddOpen(true); };
  const openNew = () => { setPrefill(null); setAddOpen(true); };

  // Sorted list of this week's bookings for the text schedule below the grid.
  const weekList = useMemo(
    () => [...bookings].sort((a, b) => (a.pickup_date < b.pickup_date ? -1 : 1)),
    [bookings],
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', padding: isMobile ? '12px 14px 90px' : '28px 20px 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <AdminTopBar
          backHref="/manage"
          backLabel="Admin"
          center="Slique Moves"
          leftExtra={<NavLink to="/outreach" label="Outreach" badge={counts.drafts} compact={isMobile} />}
        />

        {/* Title + secondary nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: isMobile ? 'center' : 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 18 : 22 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Fleet Schedule</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 38 : 40, fontWeight: 300, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              Bookings
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <NavLink to="/bookings/list" label="List View" badge={counts.pendingBookings} compact={isMobile} />
          </div>
        </div>

        {/* Week bar + New Booking */}
        {isMobile ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '6px 6px',
            }}>
              <button onClick={goPrev} style={iconBtn} title="Previous week"><ChevronLeft size={16} /></button>
              <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 7.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  {isThisWeek ? 'This Week' : 'Week of'}
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, letterSpacing: '0.04em' }}>
                  {weekRangeLabel(weekStart)}
                </span>
              </div>
              <button onClick={goNext} style={iconBtn} title="Next week"><ChevronRight size={16} /></button>
            </div>
            {!isThisWeek && (
              <button onClick={goThisWeek} style={{ ...ghostBtn, width: '100%', padding: '10px', marginBottom: 12 }}>
                Jump to This Week
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={goPrev} style={iconBtn} title="Previous week"><ChevronLeft size={16} /></button>
              <div style={{ minWidth: 220, textAlign: 'center' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                  {isThisWeek ? 'This Week' : 'Week of'}
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, letterSpacing: '0.05em' }}>
                  {weekRangeLabel(weekStart)}
                </span>
              </div>
              <button onClick={goNext} style={iconBtn} title="Next week"><ChevronRight size={16} /></button>
              <button onClick={goThisWeek} disabled={isThisWeek}
                style={{ ...ghostBtn, flex: 'none', padding: '8px 14px', opacity: isThisWeek ? 0.4 : 1, cursor: isThisWeek ? 'default' : 'pointer' }}>
                This Week
              </button>
            </div>
            <button onClick={openNew} style={{ ...solidBtn, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px' }}>
              <Plus size={13} /> New Booking
            </button>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: isMobile ? 14 : 18, flexWrap: 'wrap', marginBottom: 12, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          <Legend swatch={STATUS.confirmed.cell} border={STATUS.confirmed.cellBorder} label="Confirmed" />
          <Legend swatch={STATUS.pending.cell} border={STATUS.pending.cellBorder} label="Pending" />
          <Legend swatch={STATUS.completed.cell} border={STATUS.completed.cellBorder} label="Completed" />
          {!isMobile && <span style={{ color: 'rgba(255,255,255,0.3)' }}>Tap an open day to book · tap a booking to edit</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', borderRadius: 14 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        ) : isMobile ? (
          <MobileScheduleGrid weekDays={weekDays} bookings={bookings}
            onPickEmpty={openEmpty} onPickBooking={(b) => setDetail(b)} />
        ) : (
          <ScheduleGrid weekDays={weekDays} bookings={bookings}
            onPickEmpty={openEmpty} onPickBooking={(b) => setDetail(b)} />
        )}

        {/* Text schedule list */}
        <section style={{ marginTop: isMobile ? 26 : 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CalendarDays size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              {isThisWeek ? 'This Week' : 'Week'} Bookings <span style={{ color: 'rgba(255,255,255,0.4)' }}>({weekList.length})</span>
            </h2>
          </div>
          {weekList.length === 0 ? (
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', borderRadius: 14, textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              No bookings this week
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weekList.map((b) => {
                const st = STATUS[b.status] || STATUS.pending;
                const end = bookingEnd(b);
                const range = end && end !== b.pickup_date;
                return (
                  <button key={b.id} type="button" onClick={() => setDetail(b)}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', cursor: 'pointer',
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18,
                    }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#fff', fontStyle: 'italic', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.customer_name}
                      </span>
                      <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.03em', marginTop: 2 }}>
                        {vehicleLabel(b.vehicle_type)}
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {range ? `${prettyShort(b.pickup_date)}–${prettyShort(end)}` : prettyShort(b.pickup_date)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', borderRadius: 14, overflow: 'hidden' }}>
              {weekList.map((b, i) => {
                const st = STATUS[b.status] || STATUS.pending;
                const end = bookingEnd(b);
                const range = end && end !== b.pickup_date;
                return (
                  <button key={b.id} type="button" onClick={() => setDetail(b)}
                    style={{
                      width: '100%', textAlign: 'left', display: 'grid',
                      gridTemplateColumns: '130px 1fr auto', gap: 16, alignItems: 'center',
                      padding: '14px 18px', cursor: 'pointer', background: 'transparent', border: 'none',
                      borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace", letterSpacing: '0.03em' }}>
                      {range ? `${prettyShort(b.pickup_date)}–${prettyShort(end)}` : prettyShort(b.pickup_date)}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, color: '#fff', fontStyle: 'italic', marginRight: 10 }}>{b.customer_name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>{vehicleLabel(b.vehicle_type)}</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                      <span style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{STATUS_LABEL[b.status]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Mobile floating "New Booking" button */}
      {isMobile && (
        <button onClick={openNew} aria-label="New Booking"
          style={{
            position: 'fixed', right: 18, bottom: 'calc(20px + env(safe-area-inset-bottom))', zIndex: 50,
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 22px',
            background: '#fff', color: '#000', border: 'none', borderRadius: 9999, fontWeight: 600,
            fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '0 10px 34px rgba(0,0,0,0.6)',
          }}>
          <Plus size={15} /> New
        </button>
      )}

      <NewBookingModal open={addOpen} prefill={prefill} onClose={() => setAddOpen(false)} onCreated={fetchWeek} />
      <BookingDetail booking={detail} onClose={() => setDetail(null)} onChanged={fetchWeek} />
    </div>
  );
}

// ─── small pieces ─────────────────────────────────────────────────────────────
function NavLink({ to, label, badge, compact }) {
  return (
    <Link to={to} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
      padding: compact ? '9px 14px' : '9px 16px', border: '1px solid rgba(255,255,255,0.18)',
      background: compact ? 'rgba(255,255,255,0.04)' : 'transparent',
      fontSize: 9, letterSpacing: compact ? '0.2em' : '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
      borderRadius: 9999, whiteSpace: 'nowrap',
    }}>
      {label}
      {badge > 0 && (
        <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#fff', color: '#000', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', letterSpacing: 0 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function Legend({ swatch, border, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 16, height: 12, background: swatch, border: `1px solid ${border}`, display: 'inline-block', borderRadius: 4 }} />
      {label}
    </span>
  );
}

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

function Detail({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#e8e8e8', fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>{value}</p>
    </div>
  );
}

// ─── shared inline styles ─────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff', padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', outline: 'none', borderRadius: 12,
};
const selectStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12, color: '#e0e0e0', height: 40,
};
const iconBtn = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)',
  cursor: 'pointer', padding: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999,
};
const ghostBtn = {
  flex: 1, padding: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 9999,
};
const solidBtn = {
  padding: '13px', background: '#fff', color: '#000', border: '1px solid #fff',
  fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600, borderRadius: 9999,
};
