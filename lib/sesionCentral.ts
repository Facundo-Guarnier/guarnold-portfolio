import { crearSesionCompartida } from '@/lib/sesion-compartida';

/**
 * La sesión de la cuenta central (Guarnold ID, `id.guarnold.com.ar`), si corresponde.
 *
 * Modo central = el editor servido desde `*.guarnold.com.ar` (producción): ⊥ hace login propio, le
 * pide a Guarnold ID un pase de acceso (10 min) y con eso consulta Supabase. El pase de renovación
 * ⊥ llega nunca a esta app (cookie HttpOnly de Guarnold ID). En localhost, CI o `vite preview`:
 * login propio. La URL va en el código, ⊥ en una variable: ⊥ cambia, y si cambiara sería una
 * migración de todas las apps. `VITE_CUENTA_URL` queda SOLO para probar en local contra un Guarnold
 * ID local (`''` lo apaga).
 * 🔗 guarnold-hub/docs/cuenta-central.md
 *
 * Módulo aparte (⊥ adentro de `auth.ts`) porque lo importa `supabase.ts`, y `auth.ts` importa a
 * `supabase.ts`: juntos serían un ciclo.
 */
const URL_GUARNOLD_ID = 'https://id.guarnold.com.ar';
const enProduccion =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.guarnold.com.ar');
const urlCuenta =
  (import.meta.env.VITE_CUENTA_URL as string | undefined) ??
  (enProduccion ? URL_GUARNOLD_ID : undefined);

export const sesionCentral = urlCuenta ? crearSesionCompartida({ urlCuenta }) : null;
