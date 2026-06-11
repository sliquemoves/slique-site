// src/pages/OutreachStats.jsx
// Top-level outreach metrics: pipeline counts by status, send funnel,
// reply rate, bounce rate. Read-only; refresh on demand.

import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';

const SHELL = { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '40px 24px' };
const EYEBROW = { fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };
const HEADER_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, letterSpacing: '0.04em', color: '#fff' };
const STAT_CARD = { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 28px', borderRadius: 16 };
const STAT_LABEL = { fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 };
const STAT_VALUE = { fontSize: 36, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, color: '#fff' };
const STAT_SUB = { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 };

const STATUSES = ['discovered', 'enriched', 'drafted', 'sent', 'replied', 'rejected'];

function Stat({ label, value, sub }) {
  return (
    <div style={STAT_CARD}>
      <div style={STAT_LABEL}>{label}</div>
      <div style={STAT_VALUE}>{value}</div>
      {sub && <div style={STAT_SUB}>{sub}</div>}
    </div>
  );
}

function StatsView() {
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

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 32 }}>
          <div>
            <div style={EYEBROW}>Slique Outreach</div>
            <h1 style={HEADER_TITLE}>Stats</h1>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', opacity: isFetching ? 0.5 : 1, borderRadius: 9999 }}>
            <RefreshCw size={11} /> Refresh
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
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', margin: '0 0 14px 0' }}>Pipeline</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 32 }}>
              {STATUSES.map(s => (
                <Stat key={s} label={s} value={data.eventCountsByStatus[s] ?? 0} />
              ))}
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', margin: '0 0 14px 0' }}>Drafts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
              <Stat label="Pending review" value={data.draftCountsByStatus.pending_review} />
              <Stat label="Approved" value={data.draftCountsByStatus.approved} />
              <Stat label="Sent" value={data.draftCountsByStatus.sent} />
              <Stat label="Rejected" value={data.draftCountsByStatus.rejected} />
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', margin: '0 0 14px 0' }}>Send funnel</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 32 }}>
              <Stat label="Sent" value={data.sends} />
              <Stat label="Delivered" value={data.delivered} sub={data.rates.deliveryRate} />
              <Stat label="Opened" value={data.opened} sub={data.rates.openRate} />
              <Stat label="Clicked" value={data.clicked} sub={data.rates.clickRate} />
              <Stat label="Bounced" value={data.bounced} sub={data.rates.bounceRate} />
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', margin: '0 0 14px 0' }}>Quality</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Stat label="Bounce rate" value={data.rates.bounceRate} sub={`${data.bounced} bounces / ${data.sends} sends`} />
              <Stat label="Complaint rate" value={data.rates.complaintRate} sub={`${data.complained} complaints / ${data.sends} sends`} />
              <Stat label="Reply rate" value="—" sub="Reply tracking pending Zoho ingest" />
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
