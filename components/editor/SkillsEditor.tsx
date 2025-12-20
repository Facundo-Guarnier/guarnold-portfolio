
import React from 'react';
import { Zap, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Skill } from '../../types/cv';
import { Input, Label, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface SkillsEditorProps {
  skills: Skill[];
  onAdd: (skill: Omit<Skill, 'id'>) => void;
  onUpdate: (id: string, skill: Partial<Skill>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  accentColor?: string;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onAdd, onUpdate, onRemove, onMove, accentColor }) => {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Zap className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Habilidades</SectionTitle>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => onAdd({ nombre: 'Nueva Skill', nivel: 3 })} 
          className={`gap-1 ${accentColor || ''}`}
        >
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {skills.map((skill, index) => (
          <div key={skill.id} className="flex items-center gap-3 p-2 border border-neutral-200 dark:border-gray-700 rounded-lg bg-neutral-50 dark:bg-gray-800">
            <div className="flex-1">
              <Input 
                value={skill.nombre} 
                onChange={(e) => onUpdate(skill.id, { nombre: e.target.value })} 
                className="mb-2"
                placeholder="Nombre de la habilidad"
              />
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={skill.nivel}
                  onChange={(e) => onUpdate(skill.id, { nivel: parseInt(e.target.value) })}
                  className="w-full h-2 bg-neutral-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                />
                <span className="text-xs font-mono w-8 text-right text-neutral-500 dark:text-gray-400">{skill.nivel}/5</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 items-center justify-center border-l border-neutral-200 dark:border-gray-700 pl-2">
              <div className="flex gap-1">
                <button 
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onMove(index, 'down')}
                  disabled={index === skills.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
               <button 
                onClick={() => onRemove(skill.id)}
                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors w-full flex justify-center"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
