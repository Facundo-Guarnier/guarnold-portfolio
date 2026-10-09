import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './src/App';
import { rutaDesdeHashLegado } from './src/lib/hashLegado';
import './index.css';

// Enlaces viejos del portfolio (`#/projects`): se reescriben a la ruta real antes de montar el router.
const destinoLegado = rutaDesdeHashLegado(window.location.hash);
if (destinoLegado) {
  window.history.replaceState(null, '', destinoLegado);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
