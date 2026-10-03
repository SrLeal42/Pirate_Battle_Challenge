import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from './App';

import { isRetryableError } from './features/matches/api';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 1 && isRetryableError(error),
      refetchOnWindowFocus: false,
    },
  },
});

async function enableMocking() {

  const [{ worker }, { applyUrlOverrides, exposeMockControls }] = await Promise.all([
    import('./mocks/browser'),
    import('./mocks/control'),
  ]);

  applyUrlOverrides();
  exposeMockControls();

  return worker.start({
    onUnhandledFrame: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });

}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
