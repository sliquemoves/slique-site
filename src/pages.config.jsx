/**
 * pages.config.js — explicit route table.
 *
 * Each route is { path, component, showNav, gated }.
 *   - path:      react-router path (literal, including any slashes)
 *   - component: React component to render
 *   - showNav:   if true, the public NavBar is rendered above the page
 *   - gated:     if true, App.jsx wraps the page in <AuthGuard>
 *
 * App.jsx imports ROUTES and renders one <Route> per entry.
 */
import { Navigate } from 'react-router-dom';

import Admin from './pages/Admin';
import AdminHub from './pages/AdminHub';
import BookingConfirmation from './pages/BookingConfirmation';
import Home from './pages/Home';
import Login from './pages/Login';
import OutreachDrafts from './pages/OutreachDrafts';
import OutreachHub from './pages/OutreachHub';
import OutreachLeads from './pages/OutreachLeads';
import OutreachStats from './pages/OutreachStats';

// /admin and the legacy PascalCase /Admin both redirect to the canonical
// /manage hub. The /admin path was getting flagged by some browser ad-tech
// extensions and DNS-level blocklists which prevented React from booting,
// so the working hub lives at /manage now.
const ManageRedirect = () => <Navigate to="/manage" replace />;

export const ROUTES = [
  // Public site
  { path: '/',                    component: Home,                showNav: true,  gated: false },
  { path: '/Home',                component: Home,                showNav: true,  gated: false },
  { path: '/BookingConfirmation', component: BookingConfirmation, showNav: false, gated: false },

  // Admin sign-in (public route, no nav so the public chrome doesn't leak in)
  { path: '/login',               component: Login,               showNav: false, gated: false },

  // Legacy redirects — both flavors of /admin land on the canonical /manage
  { path: '/Admin',               component: ManageRedirect,      showNav: false, gated: false },
  { path: '/admin',               component: ManageRedirect,      showNav: false, gated: false },

  // Admin (authenticated, role=admin)
  { path: '/manage',              component: AdminHub,            showNav: false, gated: true  },
  { path: '/bookings',            component: Admin,               showNav: false, gated: true  },
  { path: '/outreach',            component: OutreachHub,         showNav: false, gated: true  },
  { path: '/outreach/drafts',     component: OutreachDrafts,      showNav: false, gated: true  },
  { path: '/outreach/leads',      component: OutreachLeads,       showNav: false, gated: true  },
  { path: '/outreach/stats',      component: OutreachStats,       showNav: false, gated: true  },
];
