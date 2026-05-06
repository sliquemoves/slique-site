// src/components/OutreachAdminGate.jsx
// Wraps every outreach admin page. Renders the children only when the
// active Supabase session has app_metadata.role === 'admin'. Otherwise
// shows a loading state, a sign-in prompt, or a "not authorized" message.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminSession } from '@/lib/use-admin-session';

const SHELL = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, sans-serif',
  padding: '40px 24px',
};

const CARD = {
  maxWidth: 420,
  margin: '120px auto',
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 36,
  textAlign: 'center',
};

const EYEBROW = {
  fontSize: 9,
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 18,
};

const TITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontWeight: 300,
  fontSize: 26,
  color: '#fff',
  margin: '0 0 14px 0',
};

const INPUT = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  padding: '12px',
  fontSize: 14,
  outline: 'none',
  margin: '20px 0 14px 0',
  boxSizing: 'border-box',
};

const BTN_PRIMARY = {
  width: '100%',
  padding: '14px',
  background: '#fff',
  color: '#000',
  border: '1px solid #fff',
  fontSize: 10,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  fontWeight: 600,
  cursor: 'pointer',
};

export default function OutreachAdminGate({ children }) {
  const { loading, session, isAdmin, signInWithMagicLink, signOut } = useAdminSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    const { error } = await signInWithMagicLink(email.trim());
    setSubmitting(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  if (loading) {
    return (
      <div style={SHELL}>
        <div style={CARD}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.5)', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={SHELL}>
        <div style={CARD}>
          <div style={EYEBROW}>Slique Outreach</div>
          <h1 style={TITLE}>Sign in</h1>
          {sent ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Magic link sent to <strong style={{ color: '#fff' }}>{email}</strong>. Check your inbox and click the link to continue.
            </p>
          ) : (
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                required
                placeholder="cyril@sliquemoves.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={INPUT}
                autoFocus
              />
              <button type="submit" disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Sending…' : 'Send Magic Link'}
              </button>
              {err && <p style={{ color: '#ff8a8a', fontSize: 12, marginTop: 12 }}>{err}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={SHELL}>
        <div style={CARD}>
          <div style={EYEBROW}>Slique Outreach</div>
          <h1 style={TITLE}>Not authorized</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            You\'re signed in as <strong style={{ color: '#fff' }}>{session.user.email}</strong>, but this account doesn\'t have admin access.
          </p>
          <button onClick={signOut} style={{ ...BTN_PRIMARY, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return children;
}
