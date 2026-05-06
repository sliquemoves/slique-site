// src/pages/Admin.jsx
// Admin hub. Two tiles (Bookings / Outreach) with their pending counts,
// plus a clean calendar list of confirmed upcoming bookings underneath.
// Black-and-white gothic aesthetic to match the existing admin pages.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// ─── tokens ───────────────────────────────────────────────────────────────────
const SHELL = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  // Center the whole content group vertically. When the content fits
  // the viewport, justify-content centers it; when it exceeds the
  // viewport, the SHELL grows past 100vh so the body scrolls naturally
  // (no clipped top).
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '24px',
};

const WRAP = { maxWidth: 960, margin: '0 auto' };

const EYEBROW = {
  fontSize: 10,
  letterSpacing: '0.6em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 14,
};

const TITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 56,
  fontWeight: 300,
  letterSpacing: '0.16em',
  color: '#fff',
  margin: 0,
  textTransform: 'uppercase',
};

const SUBTITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 14,
  fontWeight: 300,
  letterSpacing: '0.55em',
  color: 'rgba(255,255,255,0.45)',
  marginTop: 14,
  textTransform: 'uppercase',
  fontStyle: 'italic',
};

const RULE = { width: 60, height: 1, background: 'rgba(255,255,255,0.25)', margin: '22px auto 0 auto' };

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function format12Hour(time24) {
  if (!time24) return '';
  const [h] = String(time24).split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:00 ${period}`;
}

const VEHICLE_LABELS = {
  escalade_suv: 'Escalade SUV',
  mercedes_limo: 'Mercedes Limousine',
  mercedes_sprinter: 'Sprinter Van',
  mercedes_amg: 'AMG Sedan',
  luxury_sedan: 'Luxury Sedan',
  luxury_suv: 'Luxury SUV',
};

// ─── tile button ──────────────────────────────────────────────────────────────
function HubTile({ to, eyebrow, label, count, countLabel }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        textDecoration: 'none',
        display: 'block',
        background: hover ? 'rgba(255,255,255,0.06)' : '#0a0a0a',
        border: hover ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.18)',
        padding: '40px 36px',
        textAlign: 'center',
        transition: 'all 200ms ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>
        {eyebrow}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 38,
        fontWeight: 300,
        letterSpacing: '0.16em',
        color: '#fff',
        marginBottom: 26,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.25)', margin: '0 auto 24px auto' }} />
      <div style={{
        fontSize: 8,
        letterSpacing: '0.45em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 8,
      }}>
        {countLabel}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 64,
        fontWeight: 300,
        color: '#fff',
        lineHeight: 1,
      }}>
        {count}
      </div>
    </Link>
  );
}

// ─── confirmed bookings calendar list ─────────────────────────────────────────
function CalendarRow({ booking }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 110px 1fr 220px',
      alignItems: 'center',
      gap: 24,
      padding: '14px 28px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontSize: 12, color: '#fff', letterSpacing: '0.04em' }}>
        {formatDate(booking.pickup_date)}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>
        {format12Hour(booking.pickup_time)}
      </div>
      <div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 18,
          color: '#fff',
          letterSpacing: '0.04em',
          fontStyle: 'italic',
          marginBottom: 4,
        }}>
          {booking.customer_name}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
          {booking.pickup_location}
          {booking.dropoff_location ? ` → ${booking.dropoff_location}` : ''}
        </div>
      </div>
      <div style={{
        fontSize: 9,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'right',
      }}>
        {VEHICLE_LABELS[booking.vehicle_type] ?? booking.vehicle_type}
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [pendingBookings, setPendingBookings] = useState(0);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [confirmed, setConfirmed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [pendingBookingsRes, pendingDraftsRes, confirmedRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('email_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      supabase
        .from('bookings')
        .select('id, customer_name, pickup_date, pickup_time, pickup_location, dropoff_location, vehicle_type, status')
        .eq('status', 'confirmed')
        .gte('pickup_date', today)
        .order('pickup_date', { ascending: true })
        .order('pickup_time', { ascending: true })
        .limit(50),
    ]);

    setPendingBookings(pendingBookingsRes.count ?? 0);
    setPendingDrafts(pendingDraftsRes.count ?? 0);
    setConfirmed(confirmedRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={SHELL}>
      <div style={WRAP}>

        {/* Header — centered */}
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={TITLE}>Slique Moves</h1>
          <div style={SUBTITLE}>Admin</div>
          <div style={RULE} />
        </header>

        {/* Two big hub tiles */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 24 }}>
          <HubTile
            to="/AdminBookings"
            eyebrow="Reservations"
            label="Bookings"
            count={loading ? '—' : pendingBookings}
            countLabel="Pending"
          />
          <HubTile
            to="/OutreachDrafts"
            eyebrow="Cold Outreach"
            label="Outreach"
            count={loading ? '—' : pendingDrafts}
            countLabel="Drafts to Review"
          />
        </div>

        {/* Confirmed upcoming bookings calendar */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: '0.1em',
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              Upcoming <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.65)' }}>Confirmed</span>
            </h2>
            <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px auto 0 auto' }} />
          </div>

          <div style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
            ) : confirmed.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 30px',
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}>
                No confirmed bookings on the horizon
              </div>
            ) : (
              confirmed.map(b => <CalendarRow key={b.id} booking={b} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
