/**
 * pages.config.js - Page routing configuration
 */
import Admin from './pages/Admin';
import BookingConfirmation from './pages/BookingConfirmation';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "BookingConfirmation": BookingConfirmation,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
