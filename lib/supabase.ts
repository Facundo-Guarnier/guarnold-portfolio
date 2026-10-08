import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { sesionCentral } from "@/lib/sesionCentral";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseSchema = import.meta.env.VITE_SUPABASE_SCHEMA || "public";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: supabaseSchema,
  },
  // Modo cuenta central: el pase de acceso lo da Guarnold ID (10 min, solo en memoria) y supabase-js
  // ⊥ maneja sesión propia — por eso `supabase.auth` ⊥ se usa afuera de `lib/auth.ts`.
  ...(sesionCentral ? { accessToken: () => sesionCentral.obtenerToken() } : {}),
});
