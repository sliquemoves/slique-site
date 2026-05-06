/**
 * pages.config.js - Page routing configuration
 */
import Admin from './pages/Admin';
import BookingConfirmation from './pages/BookingConfirmation';
import Home from './pages/Home';
import OutreachDrafts from './pages/OutreachDrafts';
import OutreachLeads from './pages/OutreachLeads';
import OutreachStats from './pages/OutreachStats';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "BookingConfirmation": BookingConfirmation,
    "Home": Home,
    "OutreachDrafts": OutreachDrafts,
    "OutreachLeads": OutreachLeads,
    "OutreachStats": OutreachStats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
