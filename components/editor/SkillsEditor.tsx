
import React from 'react';
import { Zap, Plus, X } from 'lucide-react';
import { Skill } from '../../types/cv';
import { Input, Label, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface SkillsEditorProps {
  skills: Skill[];
  onAdd: (skill: Omit<Skill, 'id'>) => void;
  onUpdate: (id: string, skill: Partial<Skill>) => void;
  onRemove: (id: string) => void;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onAdd, onUpdate, onRemove }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Zap className="w-5 h-5 text-neutral-500" />}>Habilidades</SectionTitle>
        <Button variant="outline" size="sm" onClick={() => onAdd({ nombre: 'Nueva Skill', nivel: 3 })} className="gap-1">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {skills.map((skill) => (
          <div key={skill.id} className="flex items-center gap-3 p-2 border border-neutral-200 rounded-lg bg-neutral-50">
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
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
                <span className="text-xs font-mono w-8 text-right text-neutral-500">{skill.nivel}/5</span>
              </div>
            </div>
            <button 
              onClick={() => onRemove(skill.id)}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
