import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface Props {
  email?: string | null;
  onSalir: () => Promise<void>;
}

/**
 * La cuenta existe y la contraseña es correcta, pero ⊥ tiene cv-formatter en `plataforma.app_access`.
 *
 * ⊥ es un error ni algo que se arregle reintentando: es una decisión de quien administra las apps.
 * Por eso dice CON QUÉ cuenta entró (el caso típico es haber entrado con otra) y ofrece salir.
 */
export const SinAcceso: React.FC<Props> = ({ email, onSalir }) => {
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
          <Lock className="w-8 h-8 text-neutral-500 dark:text-gray-300" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">
          Tu cuenta no tiene acceso al editor de CV
        </h1>
        {email && (
          <p className="text-sm mb-1 text-neutral-500 dark:text-gray-300">
            Entraste como <strong>{email}</strong>.
          </p>
        )}
        <p className="text-sm mb-6 text-neutral-500 dark:text-gray-300">
          Es la misma cuenta que usás en las otras apps, pero el editor todavía no está habilitado
          para ella. Si entraste con otra cuenta, salí y probá de nuevo.
        </p>
        <button
          type="button"
          onClick={salir}
          disabled={saliendo}
          className="w-full rounded-xl py-3 font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-60"
        >
          {saliendo ? 'Saliendo...' : 'Salir y entrar con otra cuenta'}
        </button>
      </div>
    </div>
  );
};
