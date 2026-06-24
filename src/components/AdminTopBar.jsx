// src/components/AdminTopBar.jsx
// Tiny chrome strip shared by every admin/outreach page.
// Optional back link on the left, optional centered eyebrow,
// always a Sign-out button on the right.
//
// Mobile: becomes a sticky, blurred, bubbly bar that hugs the top of the
// viewport with compact icon-forward pills and bigger tap targets.

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useIsMobile } from '@/components/ui/use-mobile';

export default function AdminTopBar({ backHref, backLabel = 'Back', center, leftExtra }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const STRIP = isMobile
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 18,
        padding: '10px 12px',
        position: 'sticky',
        top: 8,
        zIndex: 40,
        background: 'rgba(10,10,10,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9999,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 14,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      };

  const PILL = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: isMobile ? '9px 14px' : '7px 14px',
    fontSize: 9,
    letterSpacing: isMobile ? '0.22em' : '0.35em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.18)',
    background: isMobile ? 'rgba(255,255,255,0.04)' : 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderRadius: 9999,
    whiteSpace: 'nowrap',
  };

  const CENTER = {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: isMobile ? '0.3em' : '0.5em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div style={STRIP}>
      <div style={{ minWidth: isMobile ? 0 : 130, display: 'flex', alignItems: 'center', gap: 8 }}>
        {backHref ? (
          <Link to={backHref} style={PILL} aria-label={backLabel}>
            <ArrowLeft size={12} /> {isMobile ? null : backLabel}
          </Link>
        ) : null}
        {leftExtra}
      </div>

      <div style={CENTER}>{center}</div>

      <div style={{ minWidth: isMobile ? 0 : 130, textAlign: 'right' }}>
        <button onClick={handleLogout} style={PILL} type="button" aria-label="Sign out">
          <LogOut size={12} /> {isMobile ? null : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
