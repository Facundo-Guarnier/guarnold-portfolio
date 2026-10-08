
import React from 'react';
import { GraduationCap, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Educacion, Nuevo } from '../../types/cv';
import { DondeSeVe } from '../ui/DondeSeVe';
import { FechasFields } from '../ui/FechasFields';
import { ListaInput } from '../ui/ListaInput';
import { Input, Label, SectionTitle, TextArea } from '../ui/Form';
import { Button } from '../ui/Button';

interface EducationEditorProps {
  educations: Educacion[];
  onAdd: (edu: Nuevo<Educacion>) => void;
  onUpdate: (id: string, edu: Partial<Educacion>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  accentColor?: string;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({ educations, onAdd, onUpdate, onRemove, onMove, accentColor }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<GraduationCap className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Educación</SectionTitle>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => onAdd({ institucion: 'Institución', titulo: 'Título', periodo: '', fechaInicio: new Date().toISOString().slice(0, 7) })} 
          className={`gap-1 ${accentColor || ''}`}
        >
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="space-y-4">
        {educations.map((edu, index) => (
          <div key={edu.id} className="relative p-4 border border-neutral-200 dark:border-gray-700 rounded-lg bg-neutral-50 dark:bg-gray-800 group">
             
             <div className="absolute top-2 right-2 flex items-center gap-1">
                <DondeSeVe compacto enCv={edu.enCv} enPortfolio={edu.enPortfolio} onChange={(c) => onUpdate(edu.id, c)} />
                <div className="w-px h-3 bg-neutral-300 dark:bg-gray-600 mx-1"></div>
                <button 
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 bg-white dark:bg-gray-700 border border-neutral-200 dark:border-gray-600 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md disabled:opacity-30"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => onMove(index, 'down')}
                  disabled={index === educations.length - 1}
                  className="p-1.5 bg-white dark:bg-gray-700 border border-neutral-200 dark:border-gray-600 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md disabled:opacity-30"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <div className="w-px h-3 bg-neutral-300 dark:bg-gray-600 mx-1"></div>
                <button 
                  onClick={() => onRemove(edu.id)}
                  className="p-1.5 bg-white dark:bg-gray-700 border border-neutral-200 dark:border-gray-600 text-neutral-400 hover:text-red-600 hover:border-red-200 rounded-md"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
             </div>

            <div className="grid gap-3">
              <div className="pr-36"> {/* Add padding to prevent text overlap with absolute buttons */}
                <Label>Institución</Label>
                <Input value={edu.institucion} onChange={(e) => onUpdate(edu.id, { institucion: e.target.value })} />
              </div>
              <div>
                <Label>Título</Label>
                <Input value={edu.titulo} onChange={(e) => onUpdate(edu.id, { titulo: e.target.value })} />
              </div>
              <FechasFields value={edu} onChange={(c) => onUpdate(edu.id, c)} />
              <div>
                  <Label>Detalle / Descripción (Opcional)</Label>
                  <Input value={edu.descripcion || ''} onChange={(e) => onUpdate(edu.id, { descripcion: e.target.value })} />
              </div>
              <div className="pt-3 border-t border-neutral-100 dark:border-gray-700 grid gap-3">
                <p className="text-xs text-neutral-400">Para el portfolio (opcional)</p>
                <div>
                  <Label>Descripción corta</Label>
                  <Input value={edu.descripcionCorta || ''} onChange={(e) => onUpdate(edu.id, { descripcionCorta: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estado</Label>
                    <Input value={edu.estado || ''} onChange={(e) => onUpdate(edu.id, { estado: e.target.value })} placeholder="Graduado" />
                  </div>
                  <div>
                    <Label>Temas (coma)</Label>
                    <ListaInput value={edu.tecnologias || []} onChange={(tecnologias) => onUpdate(edu.id, { tecnologias })} placeholder="IA, Arquitectura" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
