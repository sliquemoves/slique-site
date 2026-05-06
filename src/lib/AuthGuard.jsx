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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 size={20} className="animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
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
