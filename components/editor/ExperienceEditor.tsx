
import React from 'react';
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Experiencia } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ExperienceEditorProps {
  experiences: Experiencia[];
  onAdd: (exp: Omit<Experiencia, 'id'>) => void;
  onUpdate: (id: string, exp: Partial<Experiencia>) => void;
  onRemove: (id: string) => void;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ experiences, onAdd, onUpdate, onRemove }) => {
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
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Briefcase className="w-5 h-5 text-neutral-500" />}>Experiencia</SectionTitle>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp) => (
          <div key={exp.id} className="border border-neutral-200 rounded-lg overflow-hidden">
            <div 
              className="bg-neutral-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
            >
              <div className="font-medium text-sm text-neutral-800 truncate pr-4">
                {exp.puesto} <span className="text-neutral-400 font-normal">en {exp.empresa}</span>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(exp.id); }}
                  className="p-1 hover:bg-red-100 text-neutral-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedId === exp.id ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </div>
            </div>

            {expandedId === exp.id && (
              <div className="p-4 space-y-4 bg-white border-t border-neutral-200">
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
