// src/pages/OutreachLeads.jsx
// Read-only table view of the lead_pipeline_view.
// Sorts by score desc; lets the admin filter by status.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';
import { useIsMobile } from '@/components/ui/use-mobile';

const EYEBROW = { fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };

const TABLE = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const TH = { textAlign: 'left', fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 400, padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)' };
const TD = { padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e0e0e0' };

const STATUS_COLORS = {
  discovered: 'rgba(255,255,255,0.4)',
  enriched:   'rgba(255,255,255,0.6)',
  drafted:    'rgba(255,255,255,0.85)',
  sent:       '#fff',
  replied:    '#fff',
  rejected:   'rgba(255,255,255,0.25)',
};

const FILTERS = ['all', 'discovered', 'enriched', 'drafted', 'sent'];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (String(d).length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusPill({ value }) {
  const color = STATUS_COLORS[value] ?? 'rgba(255,255,255,0.4)';
  return (
    <span style={{
      fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
      padding: '3px 10px', border: `1px solid ${color}`, color,
      background: 'rgba(255,255,255,0.04)', display: 'inline-block', borderRadius: 9999,
    }}>
      {value ?? '—'}
    </span>
  );
}

// Mobile card — replaces a table row with a bubbly stacked tile.
function LeadCard({ r }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, color: '#fff', lineHeight: 1.2 }}>
            {r.venue_name ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
            {r.event_name ?? '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 7.5, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Score</div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, color: '#fff', lineHeight: 1.1 }}>{r.score ?? '—'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <StatusPill value={r.event_status} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{fmtDate(r.event_date)}</span>
        {r.event_type && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>· {r.event_type}</span>}
      </div>
      {(r.contact_email || r.contact_name) && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 10, wordBreak: 'break-all' }}>
          {r.contact_email ?? r.contact_name}
        </div>
      )}
    </div>
  );
}

function LeadsTable() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState('all');
  const SHELL = { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: isMobile ? '12px 14px 48px' : '40px 24px' };
  const HEADER_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: isMobile ? 38 : 32, fontWeight: 300, letterSpacing: '0.04em', color: '#fff' };

  const { data: rows, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['outreach-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_pipeline_view')
        .select('*')
        .order('score', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (filter === 'all') return rows;
    return rows.filter(r => r.event_status === filter);
  }, [rows, filter]);

  return (
    <div style={SHELL}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AdminTopBar backHref="/outreach" backLabel="Outreach" center="Leads Pipeline" />

        <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: isMobile ? 18 : 24, marginBottom: isMobile ? 16 : 24 }}>
          <div>
            <div style={EYEBROW}>Slique Outreach</div>
            <h1 style={HEADER_TITLE}>Leads</h1>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: isMobile ? '10px 14px' : '8px 14px', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', opacity: isFetching ? 0.5 : 1, borderRadius: 9999, whiteSpace: 'nowrap' }}>
            <RefreshCw size={11} /> {isMobile ? null : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0, WebkitOverflowScrolling: 'touch' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: isMobile ? '8px 14px' : '5px 12px', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
              border: '1px solid', borderColor: filter === f ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.06)',
              background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === f ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', borderRadius: 9999, whiteSpace: 'nowrap', flexShrink: 0,
            }}>{f}</button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div style={{ padding: 30, color: '#ff8a8a', fontSize: 12 }}>Error: {error.message}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            No leads {filter !== 'all' ? `with status "${filter}"` : ''}.
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((r, i) => <LeadCard key={r.event_id ?? r.id ?? i} r={r} />)}
          </div>
        ) : (
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', overflow: 'auto', borderRadius: 14 }}>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TH}>Score</th>
                  <th style={TH}>Venue</th>
                  <th style={TH}>Event</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.event_id ?? r.id ?? i}>
                    <td style={{ ...TD, fontFamily: "'Courier New', monospace", color: '#fff' }}>{r.score ?? '—'}</td>
                    <td style={TD}>{r.venue_name ?? '—'}</td>
                    <td style={TD}>{r.event_name ?? '—'}</td>
                    <td style={TD}>{fmtDate(r.event_date)}</td>
                    <td style={{ ...TD, color: 'rgba(255,255,255,0.6)' }}>{r.event_type ?? '—'}</td>
                    <td style={TD}><StatusPill value={r.event_status} /></td>
                    <td style={{ ...TD, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      {r.contact_email ?? r.contact_name ?? <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutreachLeads() {
  return <LeadsTable />;
}
