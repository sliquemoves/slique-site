// src/components/ZelleIcon.jsx
// Small Zelle-purple dollar-sign badge used to mark the "pay with Zelle"
// (no processing fee) total in the booking forms. Carries its own purple
// background + white glyph so it stays legible on white OR dark panels.
import React from 'react';
import { DollarSign } from 'lucide-react';

// Zelle brand purple.
export const ZELLE_PURPLE = '#6D1ED4';

export default function ZelleIcon({ size = 16, style }) {
  return (
    <span
      aria-label="Zelle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: ZELLE_PURPLE,
        color: '#fff',
        flexShrink: 0,
        ...style,
      }}
    >
      <DollarSign size={Math.round(size * 0.66)} strokeWidth={3} />
    </span>
  );
}
