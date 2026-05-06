import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ROUTES } from './pages.config';
import Layout from './Layout.jsx';
import AuthGuard from './lib/AuthGuard';
import PageNotFound from './lib/PageNotFound';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          {ROUTES.map(({ path, component: Component, showNav, gated }) => (
            <Route
              key={path}
              path={path}
              element={
                <Layout showNav={!!showNav}>
                  {gated ? <AuthGuard><Component /></AuthGuard> : <Component />}
                </Layout>
              }
            />
          ))}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
