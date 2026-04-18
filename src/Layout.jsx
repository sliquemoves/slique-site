import React from 'react';
import NavBar from '@/components/landing/NavBar';

/**
 * Layout wraps every page. Currently provides the sticky navigation bar.
 * The Admin page is excluded from the public nav by checking currentPageName.
 */
export default function Layout({ children, currentPageName }) {
  const showNav = currentPageName !== 'Admin';

  return (
    <>
      {showNav && <NavBar />}
      {children}
    </>
  );
}
