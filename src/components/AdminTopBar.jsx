// src/components/AdminTopBar.jsx
// Tiny chrome strip shared by every admin/outreach page.
// Optional back link on the left, optional centered eyebrow,
// always a Sign-out button on the right.

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const STRIP = {
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
  padding: '7px 14px',
  fontSize: 9,
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.65)',
  textDecoration: 'none',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  borderRadius: 9999,
};

const CENTER = {
  flex: 1,
  textAlign: 'center',
  fontSize: 9,
  letterSpacing: '0.5em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.4)',
};

export default function AdminTopBar({ backHref, backLabel = 'Back', center, leftExtra }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={STRIP}>
      <div style={{ minWidth: 130, display: 'flex', alignItems: 'center', gap: 8 }}>
        {backHref ? (
          <Link to={backHref} style={PILL}>
            <ArrowLeft size={11} /> {backLabel}
          </Link>
        ) : null}
        {leftExtra}
      </div>

      <div style={CENTER}>{center}</div>

      <div style={{ minWidth: 130, textAlign: 'right' }}>
        <button onClick={handleLogout} style={PILL} type="button">
          <LogOut size={11} /> Sign out
        </button>
      </div>
    </div>
  );
}
