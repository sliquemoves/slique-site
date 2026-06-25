import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ROUTES } from './pages.config';
import Layout from './Layout.jsx';
import AuthGuard from './lib/AuthGuard';
import ErrorBoundary from './lib/ErrorBoundary';
import PageNotFound from './lib/PageNotFound';

function App() {
  return (
    <ErrorBoundary>
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
        {/* sonner toaster — AdminHub / OutreachDrafts call toast() from 'sonner';
            without this mount their booking feedback + validation never showed. */}
        <SonnerToaster theme="dark" position="top-center" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
