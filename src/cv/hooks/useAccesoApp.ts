import { useEffect, useState } from 'react';
import { tengoAcceso } from '@/cv/lib/acceso';

export type EstadoAcceso = 'cargando' | 'si' | 'no' | 'error';

/**
 * Si la cuenta logueada tiene acceso a cv-formatter. La clave es el `userId`: al cambiar de cuenta,
 * la respuesta de la anterior ⊥ sirve. Un `false` ⊥ es un error: son estados distintos (`no` vs
 * `error`), y un error de red ⊥ debe mostrarse como «tu cuenta ⊥ tiene acceso».
 */
export function useAccesoApp(userId: string | undefined): EstadoAcceso {
  const [estado, setEstado] = useState<EstadoAcceso>('cargando');

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    setEstado('cargando');
    tengoAcceso()
      .then((ok) => vivo && setEstado(ok ? 'si' : 'no'))
      .catch(() => vivo && setEstado('error'));
    return () => {
      vivo = false;
    };
  }, [userId]);

  return estado;
}
