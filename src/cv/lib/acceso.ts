import { supabase } from '@/lib/supabase';

/**
 * ¿La cuenta con sesión puede editar el CV? (`plataforma.app_access`, vía
 * `"cv-formatter".tengo_acceso()`).
 *
 * La cuenta es UNA para todas las apps del proyecto: loguearse ⊥ implica tener cv-formatter.
 * Es UX: lo que protege las escrituras son las policies. 🔗 guarnold-hub/docs/acceso-por-app.md
 */
export async function tengoAcceso(): Promise<boolean> {
  const { data, error } = await supabase.rpc('tengo_acceso');
  if (error) throw error;
  return data === true;
}
