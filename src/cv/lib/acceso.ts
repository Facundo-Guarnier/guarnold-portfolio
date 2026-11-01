import { supabase } from '@/lib/supabase';

export type EstadoEditor = 'si' | 'sin_acceso' | 'sin_2fa';

/**
 * ¿La cuenta con sesión puede editar el CV? (`"cv-formatter".estado_editor()`):
 * - `sin_acceso`: ⊥ tiene cv-formatter en `plataforma.app_access`.
 * - `sin_2fa`: tiene la app, pero la sesión ⊥ pasó el código TOTP (aal1). Escribir exige aal2.
 * - `si`: puede escribir.
 *
 * La cuenta es UNA para todas las apps del proyecto: loguearse ⊥ implica tener cv-formatter.
 * Es UX: lo que protege las escrituras son las policies. 🔗 guarnold-hub/docs/acceso-por-app.md
 */
export async function estadoEditor(): Promise<EstadoEditor> {
  const { data, error } = await supabase.rpc('estado_editor');
  if (error) throw error;
  // Falla cerrado: una respuesta desconocida ⊥ abre el editor.
  return data === 'si' || data === 'sin_2fa' ? data : 'sin_acceso';
}
