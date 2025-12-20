
import React from 'react';
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Experiencia } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ExperienceEditorProps {
  experiences: Experiencia[];
  onAdd: (exp: Omit<Experiencia, 'id'>) => void;
  onUpdate: (id: string, exp: Partial<Experiencia>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  accentColor?: string;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ experiences, onAdd, onUpdate, onRemove, onMove, accentColor }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(experiences[0]?.id || null);

  const handleAdd = () => {
    onAdd({
      puesto: 'Nuevo Puesto',
      empresa: 'Empresa',
      periodo: '2024 - Presente',
      descripcion: 'Descripción de tareas...'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Briefcase className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Experiencia</SectionTitle>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleAdd} 
          className={`gap-1 ${accentColor || ''}`}
        >
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp, index) => (
          <div key={exp.id} className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div 
              className="bg-neutral-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-gray-700/80 transition-colors"
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
            >
              <div className="font-medium text-sm text-neutral-800 dark:text-gray-200 truncate pr-4 flex-1">
                {exp.puesto} <span className="text-neutral-400 dark:text-gray-500 font-normal">en {exp.empresa}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }}
                  disabled={index === 0}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded disabled:opacity-30 disabled:hover:text-neutral-400"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }}
                  disabled={index === experiences.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded disabled:opacity-30 disabled:hover:text-neutral-400"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-neutral-300 dark:bg-gray-600 mx-1"></div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(exp.id); }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedId === exp.id ? <ChevronUp className="w-4 h-4 text-neutral-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-neutral-500 ml-1" />}
              </div>
            </div>

            {expandedId === exp.id && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-800/50 border-t border-neutral-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Puesto / Rol</Label>
                    <Input value={exp.puesto} onChange={(e) => onUpdate(exp.id, { puesto: e.target.value })} />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input value={exp.empresa} onChange={(e) => onUpdate(exp.id, { empresa: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Periodo</Label>
                  <Input value={exp.periodo} onChange={(e) => onUpdate(exp.id, { periodo: e.target.value })} />
                </div>
                <div>
                  <Label>Descripción (Usa Enter para saltos de línea)</Label>
                  <TextArea value={exp.descripcion} onChange={(e) => onUpdate(exp.id, { descripcion: e.target.value })} rows={6} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
