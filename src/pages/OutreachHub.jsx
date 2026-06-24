// src/pages/OutreachHub.jsx
// Landing page for /outreach. Three big tiles linking to drafts / leads / stats,
// each showing a quick stat. Black-and-white gothic to match the rest of admin.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';
import { useIsMobile } from '@/components/ui/use-mobile';

// ─── tile ─────────────────────────────────────────────────────────────────────
function HubTile({ to, eyebrow, label, stat, statLabel, loading, isMobile }) {
  const [hover, setHover] = useState(false);

  if (isMobile) {
    return (
      <Link
        to={to}
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '18px 20px',
          borderRadius: 26,
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>
            {eyebrow}
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 28, fontWeight: 300, letterSpacing: '0.08em',
            color: '#fff', textTransform: 'uppercase', lineHeight: 1,
          }}>
            {label}
          </div>
          <div style={{ fontSize: 7.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            {statLabel}
          </div>
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 44, fontWeight: 300, color: '#fff', lineHeight: 1, flexShrink: 0,
        }}>
          {loading ? '—' : (stat ?? 0)}
        </div>
        <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
      </Link>
    );
  }

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
        borderRadius: 22,
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
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);

  const SHELL = {
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '14px 14px 40px' : '24px',
  };
  const WRAP = { width: '100%', maxWidth: 1080, margin: '0 auto' };
  const HEADER = { textAlign: 'center', marginBottom: isMobile ? 28 : 36 };
  const TITLE = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: isMobile ? 40 : 48,
    fontWeight: 300,
    letterSpacing: isMobile ? '0.1em' : '0.14em',
    color: '#fff',
    margin: 0,
    textTransform: 'uppercase',
  };
  const RULE = { width: 50, height: 1, background: 'rgba(255,255,255,0.25)', margin: isMobile ? '16px auto 0' : '20px auto 0' };
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

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, marginTop: 8 }}>
          <HubTile
            to="/outreach/drafts"
            eyebrow="Review"
            label="Drafts"
            stat={stats.drafts}
            statLabel="pending review"
            loading={loading}
            isMobile={isMobile}
          />
          <HubTile
            to="/outreach/leads"
            eyebrow="Pipeline"
            label="Leads"
            stat={stats.discovered}
            statLabel="events discovered"
            loading={loading}
            isMobile={isMobile}
          />
          <HubTile
            to="/outreach/stats"
            eyebrow="Performance"
            label="Stats"
            stat={stats.sentThisWeek}
            statLabel="emails sent this week"
            loading={loading}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
