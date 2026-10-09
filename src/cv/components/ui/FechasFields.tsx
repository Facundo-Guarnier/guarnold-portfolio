import React from 'react';
import { Fechas } from '../../types/cv';
import { calcularPeriodo } from '../../lib/visibilidad';
import { Input, Label } from './Form';

interface FechasFieldsProps {
  value: Fechas;
  onChange: (cambio: Partial<Fechas>) => void;
}

/** Desde / hasta (mes y año) + «sigue en curso». El texto del periodo se calcula, ⊥ se escribe. */
export const FechasFields: React.FC<FechasFieldsProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Desde</Label>
        <Input type="month" value={value.fechaInicio || ''} onChange={(e) => onChange({ fechaInicio: e.target.value })} />
      </div>
      <div>
        <Label>Hasta</Label>
        <Input
          type="month"
          value={value.enCurso ? '' : value.fechaFin || ''}
          disabled={!!value.enCurso}
          onChange={(e) => onChange({ fechaFin: e.target.value })}
        />
      </div>
    </div>
    <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-gray-300">
      <input
        type="checkbox"
        checked={!!value.enCurso}
        onChange={(e) => onChange({ enCurso: e.target.checked })}
      />
      Sigue en curso
    </label>
    <p className="text-xs text-neutral-400">
      Se muestra como: <span className="font-medium">{calcularPeriodo(value) || '—'}</span>
      {!value.fechaInicio && value.periodo ? ' (texto viejo: elegí «Desde» para pasarlo a fechas)' : ''}
    </p>
  </div>
);
