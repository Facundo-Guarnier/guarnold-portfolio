import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";
import { componentTagger } from "lovable-tagger";
import { servirHeadersEnPreview } from "./tools/headers/preview-headers";

/**
 * Puertos del dev server de ESTE repo. Registro completo: `guarnold-hub/PUERTOS.md`.
 *
 * - `npm run dev` → **3001** (el portfolio, como siempre).
 * - `npm run dev:docker` (`--mode docker`, stack Supabase local) → **5177** (el que tenía cv-formatter).
 *
 * ! el default vive aca y no solo en el `.env`: el `.env` esta gitignoreado, asi que un clon
 * nuevo o la segunda maquina se quedarian sin asignacion. El `.env` sirve para PISARLO (`VITE_DEV_PORT=...`).
 */
const PUERTO_DEV = 3001;
const PUERTO_DOCKER = 5177;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const puerto = Number(env.VITE_DEV_PORT) || (mode === "docker" ? PUERTO_DOCKER : PUERTO_DEV);
  return {
    server: {
      // Sin esto Vite ve el puerto ocupado y levanta OTRO server en silencio: cada `npm run dev`
      // cree que es el primero y se acumulan. Ver guarnold-hub/ENTORNO.md.
      strictPort: true,
      port: puerto,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      yaml(),
      // Sirve `public/_headers` en `vite preview` (solo preview: el dev server necesita scripts inline).
      servirHeadersEnPreview(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // `@/` = `src/`. Los módulos del CV viven en `src/cv/`; lo compartido (cliente Supabase,
        // sesión central) en `src/lib/`.
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
