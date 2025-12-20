
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Lock, RefreshCw, Download, KeyRound } from 'lucide-react';
import { useCVData } from '../hooks/useCVData';
import { CVPreview } from '../components/cv/CVPreview';
import { ProfileEditor } from '../components/editor/ProfileEditor';
import { ExperienceEditor } from '../components/editor/ExperienceEditor';
import { EducationEditor } from '../components/editor/EducationEditor';
import { SkillsEditor } from '../components/editor/SkillsEditor';
import { ProjectsEditor } from '../components/editor/ProjectsEditor';
import { SettingsEditor } from '../components/editor/SettingsEditor';
import { Button } from '../components/ui/Button';

// Security: Read from Environment Variable (Vite prefix required)
const SECRET_KEY = (import.meta as any).env?.VITE_ADMIN_PASSWORD || "guarnold"; 

const ACCENT_BUTTON_COLORS: Record<string, string> = {
  neutral: 'bg-neutral-900 hover:bg-neutral-800 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  rose: 'bg-rose-600 hover:bg-rose-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
};

const Admin: React.FC = () => {
  const { 
    data,
    setTheme, 
    updatePersonal, 
    moveItem,
    addExperiencia, 
    updateExperiencia, 
    removeExperiencia,
    addEducacion,
    updateEducacion,
    removeEducacion,
    addSkill,
    updateSkill,
    removeSkill,
    addProyecto,
    updateProyecto,
    removeProyecto,
    resetData
  } = useCVData();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [error, setError] = useState<string>("");
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${data.personal.nombre.replace(/\s+/g, '_')}_CV`;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECRET_KEY) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Clave incorrecta. Intenta nuevamente.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
        
        {/* Logo / Header Area */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-6 transition-transform hover:rotate-0">
            <Lock className="h-8 w-8 text-white dark:text-neutral-900" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Acceso al Editor
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-gray-400">
            Ingresa tu clave de acceso para modificar el contenido.
          </p>
        </div>

        {/* Card */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow-2xl shadow-neutral-100 dark:shadow-none border border-neutral-100 dark:border-gray-700 rounded-3xl sm:px-10 relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-neutral-50 dark:bg-gray-700 blur-3xl opacity-50 pointer-events-none"></div>

            <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-gray-300 mb-2">
                  Access Key
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <KeyRound className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 text-neutral-900 dark:text-white ring-1 ring-inset ring-neutral-200 dark:ring-gray-600 placeholder:text-neutral-300 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-neutral-900 dark:focus:ring-white sm:text-sm sm:leading-6 transition-all bg-neutral-50/50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex">
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium text-center w-full">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Button 
                  type="submit" 
                  className="w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-neutral-200 dark:shadow-none hover:shadow-xl hover:translate-y-[-1px] transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-gray-200"
                >
                  Desbloquear
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-gray-700 relative z-10">
              <Link 
                to="/" 
                className="group flex items-center justify-center gap-2 text-sm font-medium text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Volver a la vista del CV
              </Link>
            </div>

          </div>
          
          <p className="text-center text-xs text-neutral-400 dark:text-gray-500 mt-8">
            Sistema seguro de gestión de portafolio personal.
          </p>
        </div>
      </div>
    );
  }

  const accentClass = ACCENT_BUTTON_COLORS[data.settings.themeColor] || ACCENT_BUTTON_COLORS.neutral;

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-gray-950 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block transition-colors duration-300">
      {/* Editor Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-gray-800 px-6 py-3 shrink-0 z-20 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-full transition-colors text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-none">VitaeFlow Editor</h1>
            <span className="text-xs text-neutral-500 dark:text-gray-400 mt-0.5">Auto-saving to local storage</span>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { if(confirm('Reset all data to default?')) resetData(); }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
           >
             <RefreshCw className="w-4 h-4 mr-2" /> Reset
           </Button>
           
           <Button variant="primary" size="sm" className={`gap-2 ${accentClass} border-none shadow-md`} onClick={handlePrint}>
             <Download className="w-4 h-4" /> Download PDF
           </Button>

           <Link to="/">
             <Button variant="secondary" size="sm" className="gap-2">
               <Eye className="w-4 h-4" /> Public View
             </Button>
           </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden print:overflow-visible print:h-auto print:block">
        
        {/* LEFT PANEL: Scrollable Forms (40%) */}
        <div className="w-full lg:w-5/12 overflow-y-auto border-r border-neutral-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 print:hidden">
          <div className="p-6 lg:p-8 space-y-8 pb-24">
            
            {/* Theme Settings */}
            <SettingsEditor 
              settings={data.settings} 
              onUpdate={(newSettings) => setTheme(newSettings, false)}
              accentColor={accentClass}
            />

            <ProfileEditor 
              data={data.personal} 
              onChange={updatePersonal} 
              accentColor={accentClass} 
            />
            <ExperienceEditor 
              experiences={data.experiencia} 
              onAdd={addExperiencia} 
              onUpdate={updateExperiencia} 
              onRemove={removeExperiencia}
              onMove={(idx, dir) => moveItem('experiencia', idx, dir)}
              accentColor={accentClass}
            />
            <ProjectsEditor
              proyectos={data.proyectos}
              onAdd={addProyecto}
              onUpdate={updateProyecto}
              onRemove={removeProyecto}
              onMove={(idx, dir) => moveItem('proyectos', idx, dir)}
              accentColor={accentClass}
            />
            <EducationEditor 
              educations={data.educacion}
              onAdd={addEducacion}
              onUpdate={updateEducacion}
              onRemove={removeEducacion}
              onMove={(idx, dir) => moveItem('educacion', idx, dir)}
              accentColor={accentClass}
            />
            <SkillsEditor 
              skills={data.skills}
              onAdd={addSkill}
              onUpdate={updateSkill}
              onRemove={removeSkill}
              onMove={(idx, dir) => moveItem('skills', idx, dir)}
              accentColor={accentClass}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Fixed Preview (60%) */}
        <div className={`hidden lg:flex lg:w-7/12 items-start justify-center overflow-hidden relative print:block print:w-full print:bg-white print:static print:overflow-visible print:h-auto ${data.settings.darkMode ? 'bg-neutral-900' : 'bg-gray-100'} transition-colors duration-300`}>
          {/* Inner wrapper that centers the CV and handles scrolling in edit mode */}
          <div className="absolute inset-0 flex items-center justify-center p-8 overflow-y-auto print:static print:block print:p-0 print:overflow-visible print:w-full print:h-auto">
             {/* Scale wrapper for preview mode, reset for print */}
             <div className="origin-center transform scale-[0.6] xl:scale-[0.7] 2xl:scale-[0.8] transition-transform duration-300 shadow-2xl ring-1 ring-black/5 print:transform-none print:shadow-none print:ring-0 print:scale-100 print:w-full print:h-auto print:m-0">
                <div>
                  <CVPreview data={data} />
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin;
