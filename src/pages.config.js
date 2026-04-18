import Admin  from './pages/Admin';
import Home   from './pages/Home';
import Layout from './Layout';

export const PAGES = {
  "Admin": Admin,
  "Home":  Home,
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout,
};
