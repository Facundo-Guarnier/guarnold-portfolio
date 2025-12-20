
import React from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { Educacion } from '../../types/cv';
import { Input, Label, SectionTitle, TextArea } from '../ui/Form';
import { Button } from '../ui/Button';

interface EducationEditorProps {
  educations: Educacion[];
  onAdd: (edu: Omit<Educacion, 'id'>) => void;
  onUpdate: (id: string, edu: Partial<Educacion>) => void;
  onRemove: (id: string) => void;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({ educations, onAdd, onUpdate, onRemove }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<GraduationCap className="w-5 h-5 text-neutral-500" />}>Educación</SectionTitle>
        <Button variant="outline" size="sm" onClick={() => onAdd({ institucion: 'Institución', titulo: 'Título', periodo: 'Año' })} className="gap-1">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="space-y-4">
        {educations.map((edu) => (
          <div key={edu.id} className="relative p-4 border border-neutral-200 rounded-lg bg-neutral-50 group">
             <button 
                onClick={() => onRemove(edu.id)}
                className="absolute top-2 right-2 p-1.5 bg-white border border-neutral-200 text-neutral-400 hover:text-red-600 hover:border-red-200 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            <div className="grid gap-3">
              <div>
                <Label>Institución</Label>
                <Input value={edu.institucion} onChange={(e) => onUpdate(edu.id, { institucion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Título</Label>
                  <Input value={edu.titulo} onChange={(e) => onUpdate(edu.id, { titulo: e.target.value })} />
                </div>
                <div>
                  <Label>Periodo</Label>
                  <Input value={edu.periodo} onChange={(e) => onUpdate(edu.id, { periodo: e.target.value })} />
                </div>
              </div>
              <div>
                  <Label>Detalle / Descripción (Opcional)</Label>
                  <Input value={edu.descripcion || ''} onChange={(e) => onUpdate(edu.id, { descripcion: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
