
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Download, Palette, X, Moon, Sun, RotateCcw } from 'lucide-react';
import { useCVData } from '@/hooks/useCVData';
import { CVPreview } from '@/components/cv/CVPreview';
import { CVSettings } from '@/types/cv';
import { useScreenScale } from '@/hooks/useScreenScale';

const Home: React.FC = () => {
  const { data, setTheme, resetVisitorTheme } = useCVData();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const scale = useScreenScale(30); // 30px de margen de seguridad

  // Dimensiones A4 en píxeles
  const CV_WIDTH = 794;
  const CV_HEIGHT = 1123;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${data.personal.nombre.replace(/\s+/g, '_')}_CV`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeMenu]);

  const COLORS: { id: CVSettings['themeColor']; class: string }[] = [
    { id: 'neutral', class: 'bg-neutral-500' },
    { id: 'blue', class: 'bg-blue-600' },
    { id: 'emerald', class: 'bg-emerald-600' },
    { id: 'purple', class: 'bg-purple-600' },
    { id: 'rose', class: 'bg-rose-600' },
    { id: 'amber', class: 'bg-amber-500' },
  ];

  return (
    <div className={`min-h-screen md:py-10 print:bg-white print:py-0 transition-colors duration-300 ${data.settings.darkMode ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
      
      {/* Navigation Controls - Hidden when printing */}
      <div className="fixed top-5 right-5 z-50 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 rounded-full shadow-lg hover:bg-neutral-50 transition-all font-medium border border-neutral-200"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download PDF</span>
        </button>
        <Link 
          to="/admin" 
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all font-medium"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Edit CV</span>
        </Link>
      </div>

      {/* Floating Theme Toggle (Bottom Right) - Public View Only */}
      <div 
        ref={menuRef}
        className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 print:hidden"
      >
        {showThemeMenu && (
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-neutral-200 animate-in slide-in-from-bottom-5 fade-in duration-200 mb-2">
            <div className="flex items-center justify-between mb-3 gap-8">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Theme Settings</span>
              <button 
                onClick={() => setShowThemeMenu(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-neutral-700">Mode</span>
                <div className="flex bg-neutral-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setTheme({ darkMode: false }, false)}
                    className={`p-1.5 rounded-md transition-all ${!data.settings.darkMode ? 'bg-white shadow-sm text-yellow-500' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setTheme({ darkMode: true }, false)}
                    className={`p-1.5 rounded-md transition-all ${data.settings.darkMode ? 'bg-neutral-800 shadow-sm text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div>
                <span className="text-sm font-medium text-neutral-700 block mb-2">Accent Color</span>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setTheme({ themeColor: c.id }, false)}
                      className={`w-6 h-6 rounded-full ${c.class} transition-transform hover:scale-110 ${data.settings.themeColor === c.id ? 'ring-2 ring-offset-2 ring-neutral-900' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  resetVisitorTheme();
                  setShowThemeMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer tema original
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className={`p-4 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${showThemeMenu ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900 border border-neutral-200'}`}
        >
          <Palette className="w-6 h-6" />
        </button>
      </div>

      {/* Main CV View */}
      {/* Contenedor "Marco" - El espacio alrededor del CV */}
      <div className="w-full min-h-screen flex justify-center overflow-hidden pt-8 pb-8 print:p-0 print:overflow-visible">
        {/* Contenedor "Transformador" - Aplica el escalado */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: `${CV_WIDTH}px`,
            minHeight: `${CV_HEIGHT}px`,
            // Al escalar, el div sigue ocupando espacio original.
            // Ajustamos el margen negativo inferior para quitar el hueco vacío.
            marginBottom: `-${(1 - scale) * CV_HEIGHT}px`,
          }}
          className="print:!transform-none print:!w-[210mm] print:!min-h-0 print:!mb-0"
        >
          <CVPreview data={data} disableInternalScaling={true} />
        </div>
      </div>
    </div>
  );
};

export default Home;
