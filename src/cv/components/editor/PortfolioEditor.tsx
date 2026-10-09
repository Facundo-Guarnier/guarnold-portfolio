import React from 'react';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { PerfilItem, PortfolioTextos, TipoPerfilItem } from '../../types/cv';
import { Input, Label, TextArea, SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';
import { DondeSeVe } from '../ui/DondeSeVe';

interface PortfolioEditorProps {
  textos: PortfolioTextos;
  items: PerfilItem[];
  onTextos: (cambio: PortfolioTextos) => void;
  onAdd: (item: Pick<PerfilItem, 'tipo'> & Partial<PerfilItem>) => void;
  onUpdate: (id: string, cambio: Partial<PerfilItem>) => void;
  onRemove: (id: string) => void;
  accentColor?: string;
}

type ClaveLista = 'languages' | 'strengths' | 'interests';

const LISTAS: { tipo: TipoPerfilItem; clave: ClaveLista; titulo: string; placeholder: string; conIcono: boolean }[] = [
  { tipo: 'idioma', clave: 'languages', titulo: 'Idiomas', placeholder: 'Inglés (B2)', conIcono: false },
  { tipo: 'fortaleza', clave: 'strengths', titulo: 'Fortalezas', placeholder: 'Curiosidad', conIcono: false },
  { tipo: 'interes', clave: 'interests', titulo: 'Más allá del código', placeholder: 'Domótica', conIcono: true },
];

/**
 * Lo que es del portfolio: sus textos y las listas que el CV también puede mostrar. El stack sale
 * de «Habilidades» (categoría + ícono); proyectos y experiencia son los mismos del CV.
 */
export const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ textos, items, onTextos, onAdd, onUpdate, onRemove, accentColor }) => {
  const bloque = <K extends keyof PortfolioTextos>(clave: K, campo: string, valor: string) =>
    onTextos({ [clave]: { ...(textos[clave] as object), [campo]: valor } } as PortfolioTextos);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-6">
      <SectionTitle icon={<LayoutGrid className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Portfolio</SectionTitle>

      <div className="space-y-3">
        <Label>Presentación (inicio)</Label>
        <Input value={textos.hero?.title || ''} onChange={(e) => bloque('hero', 'title', e.target.value)} placeholder="Hola, soy Facundo Guarnier." />
        <Input value={textos.hero?.subtitle || ''} onChange={(e) => bloque('hero', 'subtitle', e.target.value)} placeholder="También me dicen Guarnold." />
        <TextArea value={textos.hero?.description || ''} onChange={(e) => bloque('hero', 'description', e.target.value)} rows={3} placeholder="Una presentación corta..." />
      </div>

      <div className="space-y-3">
        <Label>Tarjeta «sobre mí»</Label>
        <div className="grid grid-cols-2 gap-3">
          <Input value={textos.about_card?.title || ''} onChange={(e) => bloque('about_card', 'title', e.target.value)} placeholder="Título" />
          <Input value={textos.about_card?.role || ''} onChange={(e) => bloque('about_card', 'role', e.target.value)} placeholder="Rol" />
        </div>
        <TextArea value={textos.about_card?.description || ''} onChange={(e) => bloque('about_card', 'description', e.target.value)} rows={3} />
      </div>

      <div className="space-y-3">
        <Label>Sección «Stack» (los ítems salen de Habilidades)</Label>
        <Input value={textos.stack?.title || ''} onChange={(e) => bloque('stack', 'title', e.target.value)} placeholder="Arsenal" />
        <Input value={textos.stack?.description || ''} onChange={(e) => bloque('stack', 'description', e.target.value)} placeholder="Descripción de la sección" />
      </div>

      {LISTAS.map(({ tipo, clave, titulo, placeholder, conIcono }) => (
        <div key={tipo} className="space-y-3 pt-4 border-t border-neutral-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <Label>{titulo}</Label>
            <Button variant="ghost" size="sm" onClick={() => onAdd({ tipo })} className={`h-6 px-2 gap-1 ${accentColor || ''}`}>
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
          <Input
            value={textos[clave]?.title || ''}
            onChange={(e) => bloque(clave, 'title', e.target.value)}
            placeholder={`Título de la sección (${titulo})`}
          />
          {items.filter((i) => i.tipo === tipo).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-800">
              <Input
                className="flex-1 min-w-[8rem]"
                value={item.texto}
                onChange={(e) => onUpdate(item.id, { texto: e.target.value })}
                placeholder={placeholder}
              />
              {conIcono && (
                <Input
                  className="w-32"
                  value={item.icono || ''}
                  onChange={(e) => onUpdate(item.id, { icono: e.target.value })}
                  placeholder="Ícono"
                />
              )}
              <DondeSeVe compacto enCv={item.enCv} enPortfolio={item.enPortfolio} onChange={(c) => onUpdate(item.id, c)} />
              <button onClick={() => onRemove(item.id)} className="p-1 text-neutral-400 hover:text-red-500" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
