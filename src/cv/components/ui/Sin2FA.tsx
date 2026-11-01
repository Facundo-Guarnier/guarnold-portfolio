import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  email?: string | null;
  onSalir: () => Promise<void>;
}

/**
 * La cuenta tiene cv-formatter, pero la sesión ⊥ pasó el código TOTP (aal1). Escribir el CV exige
 * aal2 (policies "Admin Manage X", migración cv_formatter_escritura_con_2fa): sin esto, guardar fallaría en silencio.
 *
 * Dos casos: la cuenta ⊥ tiene 2FA (activarla en Guarnold ID), o entró por un camino que ⊥ pidió el
 * código. Los dos se resuelven saliendo y volviendo a entrar con el código.
 */
export const Sin2FA: React.FC<Props> = ({ email, onSalir }) => {
  const [saliendo, setSaliendo] = useState(false);

  const salir = async () => {
    setSaliendo(true);
    try {
      await onSalir();
      window.location.assign('/login');
    } finally {
      setSaliendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 text-center border border-neutral-100 dark:border-gray-700">
        <div className="inline-flex rounded-full p-4 mb-4 bg-neutral-100 dark:bg-gray-700">
          <ShieldAlert className="w-8 h-8 text-neutral-500 dark:text-gray-300" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">
          Editar el CV exige la verificación en dos pasos
        </h1>
        {email && (
          <p className="text-sm mb-1 text-neutral-500 dark:text-gray-300">
            Entraste como <strong>{email}</strong>, sin el código de tu app autenticadora.
          </p>
        )}
        <p className="text-sm mb-6 text-neutral-500 dark:text-gray-300">
          Si tu cuenta todavía no la tiene, activala en Guarnold ID (id.guarnold.com.ar). Después salí y
          volvé a entrar: te va a pedir el código.
        </p>
        <button
          type="button"
          onClick={salir}
          disabled={saliendo}
          className="w-full rounded-xl py-3 font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-60"
        >
          {saliendo ? 'Saliendo...' : 'Salir y volver a entrar'}
        </button>
      </div>
    </div>
  );
};
