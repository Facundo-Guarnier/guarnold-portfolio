import { useEffect, useState } from 'react';
import { estadoEditor } from '@/cv/lib/acceso';

export type EstadoAcceso = 'cargando' | 'si' | 'no' | 'sin2fa' | 'error';

/**
 * Si la cuenta logueada puede editar el CV. La clave es el `userId`: al cambiar de cuenta, la
 * respuesta de la anterior ⊥ sirve. `no` (sin la app), `sin2fa` (sesión sin código TOTP) y
 * `error` son estados distintos: un error de red ⊥ debe mostrarse como «tu cuenta ⊥ tiene acceso».
 */
export function useAccesoApp(userId: string | undefined): EstadoAcceso {
  const [estado, setEstado] = useState<EstadoAcceso>('cargando');

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    setEstado('cargando');
    estadoEditor()
      .then((e) => vivo && setEstado(e === 'si' ? 'si' : e === 'sin_2fa' ? 'sin2fa' : 'no'))
      .catch(() => vivo && setEstado('error'));
    return () => {
      vivo = false;
    };
  }, [userId]);

  return estado;
}
