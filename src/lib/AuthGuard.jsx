// src/lib/AuthGuard.jsx
// Wrap any admin route. Renders the children only when the active Supabase
// session has app_metadata.role === 'admin'. Otherwise:
//   - no session       -> redirect to /login?redirect=<current path>
//   - session, no admin -> redirect to /
// Subscribes to onAuthStateChange so a sign-out from any tab kicks the
// rendered admin page back to /login automatically.

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <Loader2 size={26} className="animate-spin" style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div style={{
          fontSize: 9,
          letterSpacing: '0.45em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}>
          Checking session
        </div>
      </div>
    );
  }

  if (!session) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (session.user?.app_metadata?.role !== 'admin') {
    // Signed in but not an admin — bounce to public site.
    return <Navigate to="/" replace />;
  }

  return children;
}
