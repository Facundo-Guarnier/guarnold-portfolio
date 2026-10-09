import { createClient } from "@supabase/supabase-js";
import { sesionCentral } from "@/lib/sesionCentral";

/**
 * ÚNICO cliente de Supabase de la app (portfolio + CV). Dos usos, un solo GoTrue:
 *
 * - `/` y `/cv`: lectura pública con la clave anon (RPC `portfolio_publico`, tablas del CV).
 * - `/admin`, `/login`, `/editor`: el editor. Modo propio → `supabase.auth` (login en `/login`).
 *   Modo central (dominio `*.guarnold.com.ar`) → el token viene de Guarnold ID (`accessToken`).
 *
 * Por qué uno solo: dos `createClient` con la misma `storageKey` se pisan la sesión y supabase-js
 * avisa «Multiple GoTrueClient instances». Por eso ⊥ hay un segundo cliente en ninguna parte.
 *
 * El esquema es `cv-formatter` (la base es compartida: el nombre ⊥ se cambia; ver AGENTS.md).
 */
export const ESQUEMA = (import.meta.env.VITE_SUPABASE_SCHEMA as string | undefined) || "cv-formatter";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Sin configuración el portfolio cae a su `content.yml` (⊥ hace red) y el CV muestra su error de
 * carga. Por eso NO se tira al importar: tirar acá rompería el portfolio entero.
 */
export const supabaseConfigurado = Boolean(url && anonKey);

if (!supabaseConfigurado && import.meta.env.DEV) {
  console.warn("Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: el CV ⊥ puede cargar datos.");
}

/** Rutas donde se usa el token de la cuenta central. En el resto (portfolio, CV público) ⊥ se pide. */
const RUTAS_DEL_EDITOR = ["/admin", "/editor", "/login"];

export const enRutaDelEditor = (ruta: string = window.location.pathname): boolean =>
  RUTAS_DEL_EDITOR.some((base) => ruta === base || ruta.startsWith(`${base}/`));

export const supabase = createClient(
  supabaseConfigurado ? url! : "https://sin-configurar.invalid",
  supabaseConfigurado ? anonKey! : "sin-configurar",
  {
    db: { schema: ESQUEMA },
    // Modo cuenta central: el pase de acceso lo da Guarnold ID (10 min, solo en memoria). Con
    // `accessToken`, supabase-js ⊥ maneja sesión propia: por eso `supabase.auth` ⊥ se usa afuera de
    // `cv/lib/auth.ts`. Fuera del editor ⊥ se pide nada a Guarnold ID: el visitante anónimo ⊥ tiene
    // cuenta y cada pedido a `id.guarnold.com.ar` sería un error de CORS para el portfolio.
    ...(sesionCentral
      ? {
          accessToken: () =>
            enRutaDelEditor() ? sesionCentral.obtenerToken() : Promise.resolve(null),
        }
      : {}),
  },
);
