import { supabase } from '@/lib/supabase';
import { sesionCentral } from '@/lib/sesionCentral';

/**
 * La sesión del editor, con UNA interfaz y dos modos:
 *
 * | Modo | Cuándo | Login | Pase de renovación |
 * |---|---|---|---|
 * | **central** | servido desde `*.guarnold.com.ar` (o `VITE_CUENTA_URL` en local) | en `id.guarnold.com.ar` | cookie HttpOnly de Guarnold ID |
 * | propio | cualquier otro host | `pages/Login.tsx` | `localStorage` de esta app |
 *
 * El resto de la app ⊥ sabe en qué modo está: usa esto y nunca `supabase.auth` directo (en modo
 * central, con la opción `accessToken`, `supabase.auth` ⊥ funciona).
 */

export interface Usuario {
  id: string;
  email: string | null;
}

export const modoCentral = sesionCentral !== null;

/** El usuario de la sesión actual, o `null` si ⊥ hay sesión. */
export async function usuarioActual(): Promise<Usuario | null> {
  if (sesionCentral) {
    const s = await sesionCentral.obtenerSesion();
    return s ? { id: s.usuario.id, email: s.usuario.email } : null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ? { id: session.user.id, email: session.user.email ?? null } : null;
}

/**
 * Avisa cuando la sesión pudo cambiar. Modo propio: los eventos de supabase-js. Modo central: al
 * volver a la pestaña (la sesión se pudo cerrar desde otra app o desde Guarnold ID).
 */
export function escucharSesion(cb: () => void): () => void {
  if (sesionCentral) {
    const alVolver = () => {
      if (document.visibilityState === 'visible') cb();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => cb());
  return () => subscription.unsubscribe();
}

/** Cierra la sesión. 🔴 Si falla, TIRA: un «salir» que falla ⊥ puede parecer que funcionó. */
export async function salir(): Promise<void> {
  if (sesionCentral) return sesionCentral.salir();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Modo central: manda a entrar a Guarnold ID y vuelve a `volver`. Modo propio: ⊥ hace nada. */
export function irAEntrar(volver: string): void {
  sesionCentral?.irAEntrar(volver);
}

/** Solo modo propio: en modo central el login es de Guarnold ID. */
export async function entrarConClave(
  email: string,
  clave: string
): Promise<{ message: string } | null> {
  if (sesionCentral) return { message: 'En modo central el login es de id.guarnold.com.ar' };
  const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
  return error;
}
