import React from 'react';
import NavBar from '@/components/landing/NavBar';

/**
 * Layout wraps every page. Currently provides the sticky navigation bar.
 * Admin and BookingConfirmation pages are excluded from the public nav.
 */
export default function Layout({ children, currentPageName }) {
  const hideNavOn = ['Admin', 'BookingConfirmation'];
  const showNav = !hideNavOn.includes(currentPageName);

  return (
    <>
      {showNav && <NavBar />}
      {children}
    </>
  );
}
