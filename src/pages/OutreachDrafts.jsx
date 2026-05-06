// src/pages/OutreachDrafts.jsx
// Review queue for pending_review drafts. Approve / edit / reject.
// No UI gate — admin scope is enforced at the data layer via Supabase RLS.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X, Pencil, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import AdminTopBar from '@/components/AdminTopBar';

const SHELL = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif',
  padding: '40px 24px',
};

const EYEBROW = { fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };
const HEADER_TITLE = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 300, letterSpacing: '0.04em', color: '#fff' };
const PANEL = { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14, padding: '20px 22px' };

const META_LABEL = { fontSize: 8, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' };
const META_VALUE = { fontSize: 12, color: '#e0e0e0', fontFamily: "'Cormorant Garamond', Georgia, serif" };

const INPUT = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const BTN = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  fontSize: 9,
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  border: '1px solid',
};

const BTN_APPROVE = { ...BTN, background: '#fff', color: '#000', borderColor: '#fff', fontWeight: 600 };
const BTN_REJECT = { ...BTN, background: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)' };
const BTN_EDIT   = { ...BTN, background: 'transparent', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.25)' };

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DraftCard({ draft, onApprove, onReject, onSave, busy }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);

  const venue = draft.events?.venues;
  const event = draft.events;
  const contact = draft.contacts;

  const handleSave = async () => {
    await onSave(draft.id, { subject, body });
    setEditing(false);
  };

  return (
    <div style={PANEL}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 18 }}>
        <div>
          <div style={META_LABEL}>Venue</div>
          <div style={META_VALUE}>{venue?.name ?? '—'}</div>
        </div>
        <div>
          <div style={META_LABEL}>Event</div>
          <div style={META_VALUE}>{event?.name ?? '—'}</div>
        </div>
        <div>
          <div style={META_LABEL}>Date</div>
          <div style={META_VALUE}>{fmtDate(event?.event_date)}</div>
        </div>
        <div>
          <div style={META_LABEL}>To</div>
          <div style={META_VALUE}>{contact?.name ?? contact?.email ?? '—'}</div>
          {contact?.email && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{contact.email}</div>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...INPUT, marginBottom: 10 }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} style={{ ...INPUT, fontFamily: 'Georgia, serif', lineHeight: 1.55, resize: 'vertical' }} />
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginBottom: 10 }}>{draft.subject}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>
            {draft.body}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
        {editing ? (
          <button onClick={handleSave} disabled={busy} style={BTN_EDIT}>
            <Save size={11} /> Save
          </button>
        ) : (
          <button onClick={() => setEditing(true)} disabled={busy} style={BTN_EDIT}>
            <Pencil size={11} /> Edit
          </button>
        )}
        <button onClick={() => onReject(draft.id)} disabled={busy} style={BTN_REJECT}>
          <X size={11} /> Reject
        </button>
        <button onClick={() => onApprove(draft.id)} disabled={busy || editing} style={BTN_APPROVE}>
          <Check size={11} /> Approve
        </button>
      </div>
    </div>
  );
}

function DraftsList() {
  const queryClient = useQueryClient();

  const { data: drafts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['outreach-drafts', 'pending_review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_drafts')
        .select(`
          id, subject, body, status, created_at, model_used,
          events ( id, name, event_date, event_type, venues ( id, name, city ) ),
          contacts ( id, name, role, email )
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, rejection_note }) => {
      const patch = { status };
      if (rejection_note) patch.rejection_note = rejection_note;
      const { error } = await supabase.from('email_drafts').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outreach-drafts'] }),
  });

  const saveEdit = useMutation({
    mutationFn: async ({ id, subject, body }) => {
      const { error } = await supabase.from('email_drafts').update({ subject, body }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Draft updated');
      queryClient.invalidateQueries({ queryKey: ['outreach-drafts'] });
    },
  });

  const handleApprove = (id) => {
    updateStatus.mutate({ id, status: 'approved' }, {
      onSuccess: () => toast.success('Approved — will send on next cron'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleReject = (id) => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    updateStatus.mutate({ id, status: 'rejected', rejection_note: reason || null }, {
      onSuccess: () => toast.success('Rejected'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleSave = async (id, patch) => {
    await saveEdit.mutateAsync({ id, ...patch });
  };

  return (
    <div style={SHELL}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <AdminTopBar backHref="/outreach" backLabel="Outreach" center="Drafts Queue" />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 32 }}>
          <div>
            <div style={EYEBROW}>Slique Outreach</div>
            <h1 style={HEADER_TITLE}>Drafts</h1>
          </div>
          <button onClick={() => refetch()} style={{ ...BTN_EDIT, opacity: isFetching ? 0.5 : 1 }} disabled={isFetching}>
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto' }} />
          </div>
        ) : !drafts?.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: '0.1em' }}>
            No drafts pending review.
          </div>
        ) : (
          drafts.map(d => (
            <DraftCard
              key={d.id}
              draft={d}
              onApprove={handleApprove}
              onReject={handleReject}
              onSave={handleSave}
              busy={updateStatus.isPending || saveEdit.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function OutreachDrafts() {
  return <DraftsList />;
}
