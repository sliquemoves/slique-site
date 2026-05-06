// src/pages/OutreachHub.jsx
// Landing page for /outreach. Three big tiles linking to drafts / leads / stats,
// each showing a quick stat. Black-and-white gothic to match the rest of admin.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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

const HEADER = { textAlign: 'center', marginBottom: 36 };

const TITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 48,
  fontWeight: 300,
  letterSpacing: '0.14em',
  color: '#fff',
  margin: 0,
  textTransform: 'uppercase',
};

const SUBTITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 14,
  fontWeight: 300,
  letterSpacing: '0.5em',
  color: 'rgba(255,255,255,0.45)',
  marginTop: 12,
  textTransform: 'uppercase',
  fontStyle: 'italic',
};

const RULE = { width: 50, height: 1, background: 'rgba(255,255,255,0.25)', margin: '20px auto 0 auto' };

// ─── tile ─────────────────────────────────────────────────────────────────────
function HubTile({ to, eyebrow, label, stat, statLabel, loading }) {
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
        padding: '40px 28px',
        textAlign: 'center',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
        {eyebrow}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 32,
        fontWeight: 300,
        letterSpacing: '0.14em',
        color: '#fff',
        marginBottom: 22,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.22)', margin: '0 auto 22px auto' }} />
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 52,
        fontWeight: 300,
        color: '#fff',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {loading ? '—' : (stat ?? 0)}
      </div>
      <div style={{
        fontSize: 9,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
      }}>
        {statLabel}
      </div>
    </Link>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function OutreachHub() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ drafts: 0, discovered: 0, sentThisWeek: 0 });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [draftsRes, discoveredRes, sentRes] = await Promise.all([
      supabase
        .from('email_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'discovered'),
      supabase
        .from('email_sends')
        .select('id', { count: 'exact', head: true })
        .gte('sent_at', weekAgo),
    ]);

    setStats({
      drafts: draftsRes.count ?? 0,
      discovered: discoveredRes.count ?? 0,
      sentThisWeek: sentRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div style={SHELL}>
      <div style={WRAP}>
        <AdminTopBar backHref="/manage" backLabel="Admin" center="Slique Moves" />

        <header style={HEADER}>
          <h1 style={TITLE}>Outreach</h1>
          <div style={RULE} />
        </header>

        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <HubTile
            to="/outreach/drafts"
            eyebrow="Review"
            label="Drafts"
            stat={stats.drafts}
            statLabel="pending review"
            loading={loading}
          />
          <HubTile
            to="/outreach/leads"
            eyebrow="Pipeline"
            label="Leads"
            stat={stats.discovered}
            statLabel="events discovered"
            loading={loading}
          />
          <HubTile
            to="/outreach/stats"
            eyebrow="Performance"
            label="Stats"
            stat={stats.sentThisWeek}
            statLabel="emails sent this week"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
