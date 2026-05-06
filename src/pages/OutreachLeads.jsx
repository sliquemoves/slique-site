// src/pages/OutreachLeads.jsx
// Read-only table view of the lead_pipeline_view.
// Sorts by score desc; lets the admin filter by status.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import OutreachAdminGate from '@/components/OutreachAdminGate';

const SHELL = { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '40px 24px' };
const EYEBROW = { fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };
const HEADER_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, letterSpacing: '0.04em', color: '#fff' };

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
      background: 'rgba(255,255,255,0.04)', display: 'inline-block',
    }}>
      {value ?? '—'}
    </span>
  );
}

function LeadsTable() {
  const [filter, setFilter] = useState('all');

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
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  return (
    <div style={SHELL}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 24 }}>
          <div>
            <div style={EYEBROW}>Slique Outreach</div>
            <h1 style={HEADER_TITLE}>Leads</h1>
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.25)', opacity: isFetching ? 0.5 : 1 }}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
              border: '1px solid', borderColor: filter === f ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.06)',
              background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === f ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer',
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
        ) : (
          <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', overflow: 'auto' }}>
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
                    <td style={TD}><StatusPill value={r.status} /></td>
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
  return (
    <OutreachAdminGate>
      <LeadsTable />
    </OutreachAdminGate>
  );
}
