import { useState, useEffect, useCallback } from 'react';
import { entrarConClave, escucharSesion, salir, usuarioActual, type Usuario } from '@/lib/auth';

interface AuthState {
  user: Usuario | null;
  loading: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * El usuario de la sesión, para la UI. Funciona igual en los dos modos (cuenta central o login
 * propio): la diferencia vive en `lib/auth.ts`.
 *
 * Si la pregunta falla (red caída al renovar), se trata como «sin sesión» → ir a entrar: mostrar el
 * editor con un usuario que ⊥ se pudo confirmar sería peor.
 */
export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let vivo = true;
    const consultar = () => {
      usuarioActual()
        .then((user) => vivo && setState({ user, loading: false }))
        .catch(() => vivo && setState({ user: null, loading: false }));
    };
    consultar();
    const dejar = escucharSesion(consultar);
    return () => {
      vivo = false;
      dejar();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const error = await entrarConClave(email, password);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await salir();
    // Modo central ⊥ emite evento de sesión: se refleja a mano.
    setState({ user: null, loading: false });
  }, []);

  return { ...state, signIn, signOut };
};
