import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx'
import "./index.css"
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './lib/i18n.jsx'
import 'leaflet/dist/leaflet.css';
import { initializeCleanup } from './utils/clearCache';
import { initSentry } from './lib/sentry';

// Start error/performance monitoring as early as possible (prod-only, no-ops without a DSN).
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh - avoids redundant re-fetches
      gcTime: 1000 * 60 * 5, // 5 minutes cache (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: import.meta.env.DEV ? 0 : 1, // skip retries in dev for faster feedback
    }
  }
});


const RootWrapper = ({ children }) => {
  if (import.meta.env && import.meta.env.DEV) {
    return children;
  }
  return <React.StrictMode>{children}</React.StrictMode>;
};

// Initialize cleanup
initializeCleanup();

// Ensure any initial HTML loader is removed before React mounts
try {
  const loader = document.querySelector('.app-loading');
  if (loader && loader.parentElement) {
    loader.parentElement.removeChild(loader);
  }
} catch (_) { }

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootWrapper>
    {import.meta.env && import.meta.env.PROD ? (console.debug = () => { }, console.info = () => { }, null) : null}
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketContextProvider>
              <App />
            </SocketContextProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  </RootWrapper>,
)

// Hide loader once React has mounted
try { window.removeAppLoader && window.removeAppLoader(); } catch (_) { }
