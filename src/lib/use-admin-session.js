// src/lib/use-admin-session.js
// Tiny hook used by the outreach admin pages to gate access.
// Reads the current Supabase session, exposes whether the user
// has app_metadata.role === 'admin' (matching the is_admin() RLS function),
// and provides a magic-link sign-in helper.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

export function useAdminSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const role = session?.user?.app_metadata?.role ?? null;
  const isAdmin = role === 'admin';

  const signInWithMagicLink = useCallback(async (email) => {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { session, loading, isAdmin, signInWithMagicLink, signOut };
}
