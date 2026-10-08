import React from 'react';
import { FileText, LayoutGrid } from 'lucide-react';

interface DondeSeVeProps {
  enCv: boolean;
  enPortfolio: boolean;
  onChange: (cambio: { enCv?: boolean; enPortfolio?: boolean }) => void;
  /** Etiquetas cortas para filas apretadas (solo íconos + título). */
  compacto?: boolean;
}

/**
 * Los dos interruptores de TODO ítem: ¿aparece en el CV? ¿aparece en el portfolio?
 * Mismo ítem, mismas palabras: se escribe una vez y se elige dónde se ve.
 */
export const DondeSeVe: React.FC<DondeSeVeProps> = ({ enCv, enPortfolio, onChange, compacto }) => {
  const chip = (activo: boolean) =>
    `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
      activo
        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
        : 'bg-white text-neutral-400 border-neutral-200 hover:text-neutral-600 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
    }`;

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Dónde se muestra">
      <button
        type="button"
        aria-pressed={enCv}
        title={enCv ? 'Se ve en el CV (clic para ocultar)' : 'Oculto en el CV (clic para mostrar)'}
        onClick={(e) => { e.stopPropagation(); onChange({ enCv: !enCv }); }}
        className={chip(enCv)}
      >
        <FileText className="w-3 h-3" />
        {!compacto && 'CV'}
      </button>
      <button
        type="button"
        aria-pressed={enPortfolio}
        title={enPortfolio ? 'Se ve en el portfolio (clic para ocultar)' : 'Oculto en el portfolio (clic para mostrar)'}
        onClick={(e) => { e.stopPropagation(); onChange({ enPortfolio: !enPortfolio }); }}
        className={chip(enPortfolio)}
      >
        <LayoutGrid className="w-3 h-3" />
        {!compacto && 'Portfolio'}
      </button>
    </div>
  );
};
