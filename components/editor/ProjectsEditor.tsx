
import React from 'react';
import { Rocket, Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Proyecto, Nuevo } from '../../types/cv';
import { DondeSeVe } from '../ui/DondeSeVe';
import { ListaInput } from '../ui/ListaInput';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ProjectsEditorProps {
  proyectos: Proyecto[];
  onAdd: (proj: Nuevo<Proyecto>) => void;
  onUpdate: (id: string, proj: Partial<Proyecto>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  accentColor?: string;
}

export const ProjectsEditor: React.FC<ProjectsEditorProps> = ({ proyectos, onAdd, onUpdate, onRemove, onMove, accentColor }) => {
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
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Rocket className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Proyectos</SectionTitle>
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
        {safeProyectos.map((proj, index) => (
          <div key={proj.id} className="border border-neutral-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div 
              className="bg-neutral-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-gray-700/80 transition-colors"
              onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id)}
            >
              <div className="font-medium text-sm text-neutral-800 dark:text-gray-200 truncate pr-4 flex-1">
                {proj.nombre}
              </div>
              <div className="flex items-center gap-1">
                <DondeSeVe compacto enCv={proj.enCv} enPortfolio={proj.enPortfolio} onChange={(c) => onUpdate(proj.id, c)} />
                <div className="w-px h-4 bg-neutral-300 dark:bg-gray-600 mx-1"></div>
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
                  disabled={index === safeProyectos.length - 1}
                  className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded disabled:opacity-30 disabled:hover:text-neutral-400"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-neutral-300 dark:bg-gray-600 mx-1"></div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(proj.id); }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedId === proj.id ? <ChevronUp className="w-4 h-4 text-neutral-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-neutral-500 ml-1" />}
              </div>
            </div>

            {expandedId === proj.id && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-800/50 border-t border-neutral-200 dark:border-gray-700">
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
                <div className="pt-3 border-t border-neutral-100 dark:border-gray-700 space-y-4">
                  <p className="text-xs text-neutral-400">Para el portfolio (opcional)</p>
                  <div>
                    <Label>Descripción corta</Label>
                    <TextArea value={proj.descripcionCorta || ''} onChange={(e) => onUpdate(proj.id, { descripcionCorta: e.target.value })} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Identificador</Label>
                      <Input value={proj.slug || ''} onChange={(e) => onUpdate(proj.id, { slug: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })} placeholder="buckshot-tracker" />
                    </div>
                    <div>
                      <Label>GitHub</Label>
                      <Input value={proj.githubUrl || ''} onChange={(e) => onUpdate(proj.id, { githubUrl: e.target.value })} placeholder="https://github.com/..." />
                    </div>
                  </div>
                  <div>
                    <Label>Etiquetas (coma)</Label>
                    <ListaInput value={proj.tags || []} onChange={(tags) => onUpdate(proj.id, { tags })} placeholder="Game Tool, TypeScript" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Tamaño</Label>
                      <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                        value={proj.tamano || ''}
                        onChange={(e) => onUpdate(proj.id, { tamano: e.target.value })}
                      >
                        <option value="">Automático</option>
                        <option value="small">Chico</option>
                        <option value="medium">Mediano</option>
                        <option value="large">Grande</option>
                        <option value="tall">Alto</option>
                      </select>
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                        value={proj.estado || ''}
                        onChange={(e) => onUpdate(proj.id, { estado: e.target.value })}
                      >
                        <option value="">—</option>
                        <option value="live">En vivo</option>
                        <option value="demo">Demo</option>
                        <option value="wip">En desarrollo</option>
                      </select>
                    </div>
                    <div>
                      <Label>Ícono</Label>
                      <Input value={proj.icono || ''} onChange={(e) => onUpdate(proj.id, { icono: e.target.value })} placeholder="Crosshair" />
                    </div>
                  </div>
                  <div>
                    <Label>Imagen (URL)</Label>
                    <Input value={proj.imagenUrl || ''} onChange={(e) => onUpdate(proj.id, { imagenUrl: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
