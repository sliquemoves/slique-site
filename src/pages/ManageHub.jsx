// src/pages/ManageHub.jsx
// Top-level admin hub at /manage. Two tiles — Bookings and Outreach — each with
// a live count. Black-and-white gothic to match the rest of admin.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CalendarDays, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';

// ─── tokens ───────────────────────────────────────────────────────────────────
const SHELL = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px',
};
const WRAP = { width: '100%', maxWidth: 1080, margin: '0 auto' };
const HEADER = { textAlign: 'center', marginBottom: 44, marginTop: 12 };
const EYEBROW = {
  fontSize: 9, letterSpacing: '0.6em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)', marginBottom: 16,
};
const TITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 56, fontWeight: 300, letterSpacing: '0.16em',
  color: '#fff', margin: 0, textTransform: 'uppercase',
};
const SUBTITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15, fontWeight: 300, letterSpacing: '0.45em',
  color: 'rgba(255,255,255,0.4)', marginTop: 14,
  textTransform: 'uppercase', fontStyle: 'italic',
};
const RULE = { width: 50, height: 1, background: 'rgba(255,255,255,0.25)', margin: '22px auto 0 auto' };

// ─── tile ─────────────────────────────────────────────────────────────────────
function HubTile({ to, icon: Icon, eyebrow, label, stat, statLabel, loading }) {
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
        padding: '46px 32px',
        textAlign: 'center',
        transition: 'all 220ms ease',
        position: 'relative',
      }}
    >
      <div style={{
        width: 46, height: 46, margin: '0 auto 22px auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
        color: hover ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'color 220ms ease',
      }}>
        <Icon size={18} strokeWidth={1.4} />
      </div>
      <div style={{ ...EYEBROW, marginBottom: 14 }}>{eyebrow}</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 36, fontWeight: 300, letterSpacing: '0.14em',
        color: '#fff', marginBottom: 24, textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.22)', margin: '0 auto 22px auto' }} />
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 52, fontWeight: 300, color: '#fff', lineHeight: 1, marginBottom: 8,
      }}>
        {loading ? '—' : (stat ?? 0)}
      </div>
      <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
        {statLabel}
      </div>
    </Link>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function ManageHub() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingBookings: 0, drafts: 0 });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [pendRes, draftRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('email_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    ]);
    setStats({ pendingBookings: pendRes.count ?? 0, drafts: draftRes.count ?? 0 });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div style={SHELL}>
      <div style={WRAP}>
        <AdminTopBar center="Slique Moves" />

        <header style={HEADER}>
          <div style={EYEBROW}>Slique Moves</div>
          <h1 style={TITLE}>Command</h1>
          <div style={SUBTITLE}>Bookings · Outreach</div>
          <div style={RULE} />
        </header>

        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          <HubTile
            to="/bookings"
            icon={CalendarDays}
            eyebrow="Fleet & Reservations"
            label="Bookings"
            stat={stats.pendingBookings}
            statLabel="pending bookings"
            loading={loading}
          />
          <HubTile
            to="/outreach"
            icon={Mail}
            eyebrow="Leads & Email"
            label="Outreach"
            stat={stats.drafts}
            statLabel="drafts to review"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
