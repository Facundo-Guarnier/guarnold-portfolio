
import React from 'react';
import { Rocket, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Proyecto } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ProjectsEditorProps {
  proyectos: Proyecto[];
  onAdd: (proj: Omit<Proyecto, 'id'>) => void;
  onUpdate: (id: string, proj: Partial<Proyecto>) => void;
  onRemove: (id: string) => void;
}

export const ProjectsEditor: React.FC<ProjectsEditorProps> = ({ proyectos, onAdd, onUpdate, onRemove }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(proyectos?.[0]?.id || null);

  const handleAdd = () => {
    onAdd({
      nombre: 'Nuevo Proyecto',
      descripcion: 'Descripción...',
      tecnologias: 'React, Node.js',
    });
  };

  const safeProyectos = proyectos || [];

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Rocket className="w-5 h-5 text-neutral-500" />}>Proyectos</SectionTitle>
        <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1">
          <Plus className="w-3 h-3" /> Agregar
        </Button>
      </div>

      <div className="space-y-3">
        {safeProyectos.map((proj) => (
          <div key={proj.id} className="border border-neutral-200 rounded-lg overflow-hidden">
            <div 
              className="bg-neutral-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id)}
            >
              <div className="font-medium text-sm text-neutral-800 truncate pr-4">
                {proj.nombre}
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(proj.id); }}
                  className="p-1 hover:bg-red-100 text-neutral-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedId === proj.id ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </div>
            </div>

            {expandedId === proj.id && (
              <div className="p-4 space-y-4 bg-white border-t border-neutral-200">
                <div>
                  <Label>Nombre del Proyecto</Label>
                  <Input value={proj.nombre} onChange={(e) => onUpdate(proj.id, { nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <TextArea value={proj.descripcion} onChange={(e) => onUpdate(proj.id, { descripcion: e.target.value })} rows={4} />
                </div>
                <div>
                  <Label>Tecnologías Utilizadas</Label>
                  <Input value={proj.tecnologias} onChange={(e) => onUpdate(proj.id, { tecnologias: e.target.value })} />
                </div>
                <div>
                  <Label>URL (Opcional)</Label>
                  <Input value={proj.url || ''} onChange={(e) => onUpdate(proj.id, { url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
