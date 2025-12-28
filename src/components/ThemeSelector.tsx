import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

const ThemeSelector: React.FC = () => {
  const { seedColor, setSeedColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-primary-container text-on-primary-container' 
            : 'hover:bg-surface-variant/50 text-on-surface-variant'
        }`}
        aria-label="Change Theme Color"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-3 bg-surface-variant rounded-2xl shadow-xl border border-outline/10 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-medium text-on-surface-variant mb-3 px-1">
            Select Accent Color
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setSeedColor(color);
                  setIsOpen(false);
                }}
                className="group relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                aria-label={`Set color to ${color}`}
              >
                {seedColor === color && (
                  <Check size={14} className="text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;