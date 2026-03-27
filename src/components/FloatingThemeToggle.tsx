import React, { useState, useRef, useEffect } from "react";
import { Palette, Sun, Moon, X, RotateCcw } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const PRESET_COLORS = [
  { id: "blue", hex: "#3b82f6", name: "Blue" },
  { id: "red", hex: "#ef4444", name: "Red" },
  { id: "emerald", hex: "#10b981", name: "Emerald" },
  { id: "violet", hex: "#8b5cf6", name: "Violet" },
  { id: "amber", hex: "#f59e0b", name: "Amber" },
  { id: "pink", hex: "#ec4899", name: "Pink" },
];

const DEFAULT_SEED = "#3b82f6";

const FloatingThemeToggle: React.FC = () => {
  const { seedColor, setSeedColor, isDark, toggleTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetTheme = () => {
    setSeedColor(DEFAULT_SEED);
    if (isDark) toggleTheme();
    setShowMenu(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 print:hidden"
    >
      {showMenu && (
        <div
          className={`
          p-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 fade-in duration-200 mb-2
          ${
            isDark
              ? "bg-neutral-900 border-neutral-800"
              : "bg-white border-neutral-200"
          }
        `}
        >
          <div className="flex items-center justify-between mb-3 gap-8">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Configuración de Tema
            </span>
            <button
              onClick={() => setShowMenu(false)}
              className={`${
                isDark
                  ? "text-neutral-500 hover:text-white"
                  : "text-neutral-400 hover:text-neutral-900"
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between gap-4">
              <span
                className={`text-sm font-medium ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                Modo
              </span>
              <div
                className={`flex p-1 rounded-lg ${
                  isDark ? "bg-neutral-800" : "bg-neutral-100"
                }`}
              >
                <button
                  onClick={() => isDark && toggleTheme()}
                  className={`p-1.5 rounded-md transition-all ${
                    !isDark
                      ? "bg-white shadow-sm text-yellow-500"
                      : "text-neutral-400 hover:text-neutral-300"
                  }`}
                  aria-label="Modo claro"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => !isDark && toggleTheme()}
                  className={`p-1.5 rounded-md transition-all ${
                    isDark
                      ? "bg-neutral-700 shadow-sm text-white"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                  aria-label="Modo oscuro"
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <span
                className={`text-sm font-medium block mb-2 ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                Color de Acento
              </span>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSeedColor(color.hex)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                      seedColor === color.hex
                        ? "ring-2 ring-offset-2 " +
                          (isDark
                            ? "ring-white ring-offset-neutral-900"
                            : "ring-neutral-900 ring-offset-white")
                        : ""
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={`Establecer color ${color.name}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetTheme}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-colors ${
                isDark
                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer tema original
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-4 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${
          showMenu
            ? "bg-primary text-on-primary"
            : isDark
            ? "bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700"
            : "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50"
        }`}
        aria-label="Abrir configuración de tema"
      >
        <Palette className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FloatingThemeToggle;
