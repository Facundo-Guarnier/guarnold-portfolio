
import React from 'react';
import { Palette, Moon, Sun } from 'lucide-react';
import { CVSettings } from '../../types/cv';
import { SectionTitle, Label } from '../ui/Form';

interface SettingsEditorProps {
  settings: CVSettings;
  onUpdate: (settings: Partial<CVSettings>) => void;
}

const COLORS: { id: CVSettings['themeColor']; label: string; class: string }[] = [
  { id: 'neutral', label: 'Neutral', class: 'bg-neutral-500' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-600' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-600' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-600' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-600' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
];

export const SettingsEditor: React.FC<SettingsEditorProps> = ({ settings, onUpdate }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-6">
      <SectionTitle icon={<Palette className="w-5 h-5 text-neutral-500" />}>Apariencia</SectionTitle>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${settings.darkMode ? 'bg-neutral-800 text-yellow-400' : 'bg-white text-neutral-400 shadow-sm border border-neutral-200'}`}>
            {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900">Modo Oscuro</span>
            <span className="text-xs text-neutral-500">Estilo por defecto del CV</span>
          </div>
        </div>
        <button
          onClick={() => onUpdate({ darkMode: !settings.darkMode })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 ${
            settings.darkMode ? 'bg-neutral-900' : 'bg-neutral-200'
          }`}
        >
          <span
            className={`${
              settings.darkMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {/* Color Picker */}
      <div>
        <Label>Color de Acento</Label>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => onUpdate({ themeColor: color.id })}
              className={`group relative w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                settings.themeColor === color.id 
                  ? 'ring-2 ring-offset-2 ring-neutral-900 scale-100' 
                  : 'hover:scale-105 hover:shadow-md'
              }`}
              title={color.label}
            >
              <div className={`w-full h-full rounded-md ${color.class} opacity-90 group-hover:opacity-100 transition-opacity`} />
              {settings.themeColor === color.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Este color define los títulos, bordes y detalles visuales.
        </p>
      </div>
    </div>
  );
};
