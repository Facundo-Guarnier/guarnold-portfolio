
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Sin esto Vite ve el puerto ocupado y levanta OTRO server en silencio: cada `npm run dev`
    // cree que es el primero y se acumulan. En Windows quedan vivos aunque cierres el editor
    // (no existe "matar el arbol": los hijos quedan reparentados). Ver guarnold-hub/ENTORNO.md.
    strictPort: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
