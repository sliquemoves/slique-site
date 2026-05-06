import React from 'react';
import NavBar from '@/components/landing/NavBar';

/**
 * Layout wraps every route. Renders the public NavBar only when the
 * route opted in via `showNav` in pages.config.js.
 */
export default function Layout({ children, showNav = false }) {
  return (
    <>
      {showNav && <NavBar />}
      {children}
    </>
  );
}
