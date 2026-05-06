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

// Backwards-compat redirect from the old PascalCase /Admin URL.
// Now points at the new lower-case /admin hub.
const AdminRedirect = () => <Navigate to="/admin" replace />;

export const ROUTES = [
  // Public site
  { path: '/',                    component: Home,                showNav: true,  gated: false },
  { path: '/Home',                component: Home,                showNav: true,  gated: false },
  { path: '/BookingConfirmation', component: BookingConfirmation, showNav: false, gated: false },

  // Admin sign-in (public route, no nav so the public chrome doesn't leak in)
  { path: '/login',               component: Login,               showNav: false, gated: false },

  // Legacy redirect — keep until external bookmarks are replaced
  { path: '/Admin',               component: AdminRedirect,       showNav: false, gated: false },

  // Admin (authenticated, role=admin)
  { path: '/admin',               component: AdminHub,            showNav: false, gated: true  },
  { path: '/bookings',            component: Admin,               showNav: false, gated: true  },
  { path: '/outreach',            component: OutreachHub,         showNav: false, gated: true  },
  { path: '/outreach/drafts',     component: OutreachDrafts,      showNav: false, gated: true  },
  { path: '/outreach/leads',      component: OutreachLeads,       showNav: false, gated: true  },
  { path: '/outreach/stats',      component: OutreachStats,       showNav: false, gated: true  },
];
