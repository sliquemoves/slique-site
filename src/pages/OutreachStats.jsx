// src/pages/OutreachStats.jsx
// Top-level outreach metrics: pipeline counts by status, send funnel,
// reply rate, bounce rate. Read-only; refresh on demand.

import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';
import { useIsMobile } from '@/components/ui/use-mobile';

const EYEBROW = { fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };

const STATUSES = ['discovered', 'enriched', 'drafted', 'sent', 'replied', 'rejected'];

function Stat({ label, value, sub, isMobile }) {
  return (
    <div style={{
      background: isMobile ? 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' : '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: isMobile ? '16px 16px' : '24px 28px',
      borderRadius: isMobile ? 20 : 16,
    }}>
      <div style={{ fontSize: isMobile ? 8 : 9, letterSpacing: isMobile ? '0.28em' : '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: isMobile ? 8 : 10 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 30 : 36, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: isMobile ? 10 : 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function StatsView() {
  const isMobile = useIsMobile();
  const SHELL = { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: isMobile ? '12px 14px 48px' : '40px 24px' };
  const HEADER_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 38 : 32, fontWeight: 300, letterSpacing: '0.04em', color: '#fff' };
  const SECTION_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: isMobile ? 17 : 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', margin: '0 0 14px 0' };
  // Mobile collapses every funnel/pipeline grid to a clean 2-up; desktop keeps wide rows.
  const grid = (desktopCols) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${desktopCols}, 1fr)`, gap: isMobile ? 10 : 10, marginBottom: isMobile ? 26 : 32 });
  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['outreach-stats'],
    queryFn: async () => {
      // Pull what we need with a few small reads. None of these tables
      // are huge in our usage, so loading a few hundred rows is fine.
      const [eventsRes, sendsRes, eventsLogRes, draftsRes] = await Promise.all([
        supabase.from('events').select('status').limit(5000),
        supabase.from('email_sends').select('id').limit(5000),
        supabase.from('email_events').select('event_type').limit(5000),
        supabase.from('email_drafts').select('status').limit(5000),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (sendsRes.error) throw sendsRes.error;
      if (eventsLogRes.error) throw eventsLogRes.error;
      if (draftsRes.error) throw draftsRes.error;

      const eventCountsByStatus = Object.fromEntries(STATUSES.map(s => [s, 0]));
      for (const r of eventsRes.data ?? []) {
        if (eventCountsByStatus[r.status] !== undefined) eventCountsByStatus[r.status]++;
      }

      const draftCountsByStatus = { pending_review: 0, approved: 0, sent: 0, rejected: 0 };
      for (const r of draftsRes.data ?? []) {
        if (draftCountsByStatus[r.status] !== undefined) draftCountsByStatus[r.status]++;
      }

      const sends = sendsRes.data?.length ?? 0;

      const eventTypeCounts = {};
      for (const r of eventsLogRes.data ?? []) {
        eventTypeCounts[r.event_type] = (eventTypeCounts[r.event_type] ?? 0) + 1;
      }

      const delivered = eventTypeCounts.delivered ?? 0;
      const opened = eventTypeCounts.opened ?? 0;
      const clicked = eventTypeCounts.clicked ?? 0;
      const bounced = eventTypeCounts.bounced ?? 0;
      const complained = eventTypeCounts.complained ?? 0;

      const pct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—');

      return {
        eventCountsByStatus,
        draftCountsByStatus,
        sends,
        delivered,
        opened,
        clicked,
        bounced,
        complained,
        rates: {
          deliveryRate: pct(delivered, sends),
          openRate: pct(opened, delivered || sends),
          clickRate: pct(clicked, delivered || sends),
          bounceRate: pct(bounced, sends),
          complaintRate: pct(complained, sends),
        },
      };
    },
  });

  return (
    <div style={SHELL}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AdminTopBar backHref="/outreach" backLabel="Outreach" center="Performance Stats" />

        <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: isMobile ? 18 : 24, marginBottom: isMobile ? 24 : 32 }}>
          <div>
            <div style={EYEBROW}>Slique Outreach</div>
            <h1 style={HEADER_TITLE}>Stats</h1>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: isMobile ? '10px 14px' : '8px 14px', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', opacity: isFetching ? 0.5 : 1, borderRadius: 9999, whiteSpace: 'nowrap' }}>
            <RefreshCw size={11} /> {isMobile ? null : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div style={{ padding: 30, color: '#ff8a8a', fontSize: 12 }}>Error: {error.message}</div>
        ) : data && (
          <>
            <h2 style={SECTION_TITLE}>Pipeline</h2>
            <div style={grid(6)}>
              {STATUSES.map(s => (
                <Stat key={s} label={s} value={data.eventCountsByStatus[s] ?? 0} isMobile={isMobile} />
              ))}
            </div>

            <h2 style={SECTION_TITLE}>Drafts</h2>
            <div style={grid(4)}>
              <Stat label="Pending review" value={data.draftCountsByStatus.pending_review} isMobile={isMobile} />
              <Stat label="Approved" value={data.draftCountsByStatus.approved} isMobile={isMobile} />
              <Stat label="Sent" value={data.draftCountsByStatus.sent} isMobile={isMobile} />
              <Stat label="Rejected" value={data.draftCountsByStatus.rejected} isMobile={isMobile} />
            </div>

            <h2 style={SECTION_TITLE}>Send funnel</h2>
            <div style={grid(5)}>
              <Stat label="Sent" value={data.sends} isMobile={isMobile} />
              <Stat label="Delivered" value={data.delivered} sub={data.rates.deliveryRate} isMobile={isMobile} />
              <Stat label="Opened" value={data.opened} sub={data.rates.openRate} isMobile={isMobile} />
              <Stat label="Clicked" value={data.clicked} sub={data.rates.clickRate} isMobile={isMobile} />
              <Stat label="Bounced" value={data.bounced} sub={data.rates.bounceRate} isMobile={isMobile} />
            </div>

            <h2 style={SECTION_TITLE}>Quality</h2>
            <div style={{ ...grid(3), marginBottom: 0 }}>
              <Stat label="Bounce rate" value={data.rates.bounceRate} sub={`${data.bounced} bounces / ${data.sends} sends`} isMobile={isMobile} />
              <Stat label="Complaint rate" value={data.rates.complaintRate} sub={`${data.complained} complaints / ${data.sends} sends`} isMobile={isMobile} />
              <Stat label="Reply rate" value="—" sub="Reply tracking pending Zoho ingest" isMobile={isMobile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OutreachStats() {
  return <StatsView />;
}
