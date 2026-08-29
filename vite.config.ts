import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      // Sin esto Vite ve el puerto ocupado y levanta OTRO server en silencio: cada `npm run dev`
      // cree que es el primero y se acumulan. En Windows quedan vivos aunque cierres el editor
      // (no existe "matar el arbol": los hijos quedan reparentados). Ver guarnold-hub/ENTORNO.md.
      strictPort: true,
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      yaml(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
