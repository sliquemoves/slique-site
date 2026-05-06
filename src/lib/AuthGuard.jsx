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

  console.log('[AuthGuard] render', { path: location.pathname, loading, hasSession: !!session, role: session?.user?.app_metadata?.role });

  useEffect(() => {
    let active = true;
    console.log('[AuthGuard] useEffect mount, calling getSession');

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[AuthGuard] getSession resolved', { hasSession: !!data?.session, role: data?.session?.user?.app_metadata?.role, error });
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('[AuthGuard] getSession rejected', err);
      if (!active) return;
      setSession(null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('[AuthGuard] onAuthStateChange', { event, hasSession: !!s, role: s?.user?.app_metadata?.role });
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
    console.log('[AuthGuard] no session -> redirecting to /login', { redirect });
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (session.user?.app_metadata?.role !== 'admin') {
    console.log('[AuthGuard] not admin -> redirecting to /', { role: session.user?.app_metadata?.role });
    return <Navigate to="/" replace />;
  }

  console.log('[AuthGuard] admin -> rendering children');
  return children;
}
