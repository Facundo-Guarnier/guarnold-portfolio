import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de SOLO LECTURA PÚBLICA: el portfolio lee `"cv-formatter".portfolio_publico()` con la
 * clave anon. ⊥ hay sesión ni login acá (el que edita es cv-formatter, con Guarnold ID).
 * Sin variables de entorno devuelve `null` y el portfolio usa su `content.yml`.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        db: { schema: "cv-formatter" },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
