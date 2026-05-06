// src/pages/Login.jsx
// Email + password sign-in for the admin team. Uses Supabase Auth.
// Bounces an already-signed-in admin straight to ?redirect= (or /bookings).

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SHELL = {
  minHeight: '100vh',
  background: '#000',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const CARD = {
  width: '100%',
  maxWidth: 420,
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '44px 36px',
  textAlign: 'center',
};

const EYEBROW = {
  fontSize: 9,
  letterSpacing: '0.55em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 14,
};

const TITLE = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 36,
  fontWeight: 300,
  letterSpacing: '0.12em',
  color: '#fff',
  margin: 0,
  textTransform: 'uppercase',
};

const RULE = { width: 36, height: 1, background: 'rgba(255,255,255,0.25)', margin: '20px auto 28px auto' };

const FIELD_LABEL = {
  display: 'block',
  fontSize: 8,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 6,
  textAlign: 'left',
};

const INPUT_OVERRIDE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  borderRadius: 0,
  height: 42,
  fontSize: 14,
};

const BUTTON_OVERRIDE = {
  width: '100%',
  background: '#fff',
  color: '#000',
  border: '1px solid #fff',
  borderRadius: 0,
  height: 46,
  fontSize: 10,
  letterSpacing: '0.4em',
  textTransform: 'uppercase',
  fontWeight: 600,
  marginTop: 8,
};

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const [checking, setChecking] = useState(true);

  // If already signed in, bounce immediately.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        navigate(redirect, { replace: true });
      } else {
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, [navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (error) {
      setErr(error.message);
      return;
    }

    navigate(redirect, { replace: true });
  };

  if (checking) {
    return (
      <div style={SHELL}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
      </div>
    );
  }

  return (
    <div style={SHELL}>
      <div style={CARD}>
        <div style={EYEBROW}>Slique Moves</div>
        <h1 style={TITLE}>Sign In</h1>
        <div style={RULE} />

        <form onSubmit={handleSubmit}>
          <label style={FIELD_LABEL} htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="cyril@sliquemoves.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={INPUT_OVERRIDE}
            autoFocus
          />

          <div style={{ height: 16 }} />

          <label style={FIELD_LABEL} htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={INPUT_OVERRIDE}
          />

          <Button type="submit" disabled={submitting} style={BUTTON_OVERRIDE}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>

          {err && (
            <p style={{
              color: '#ff8a8a',
              fontSize: 12,
              marginTop: 16,
              textAlign: 'left',
              lineHeight: 1.5,
            }}>
              {err}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
