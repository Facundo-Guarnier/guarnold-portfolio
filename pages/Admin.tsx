
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
      <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        
        {/* Logo / Header Area */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-6 transition-transform hover:rotate-0">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Acceso al Editor
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Ingresa tu clave de acceso para modificar el contenido.
          </p>
        </div>

        {/* Card */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-6 shadow-2xl shadow-neutral-100 border border-neutral-100 rounded-3xl sm:px-10 relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-neutral-50 blur-3xl opacity-50 pointer-events-none"></div>

            <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
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
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 text-neutral-900 ring-1 ring-inset ring-neutral-200 placeholder:text-neutral-300 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6 transition-all bg-neutral-50/50 focus:bg-white"
                    placeholder="••••••••"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex">
                    <div className="text-sm text-red-600 font-medium text-center w-full">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Button 
                  type="submit" 
                  className="w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-neutral-200 hover:shadow-xl hover:translate-y-[-1px] transition-all"
                >
                  Desbloquear
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 relative z-10">
              <Link 
                to="/" 
                className="group flex items-center justify-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors w-full p-2 rounded-lg hover:bg-neutral-50"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Volver a la vista del CV
              </Link>
            </div>

          </div>
          
          <p className="text-center text-xs text-neutral-400 mt-8">
            Sistema seguro de gestión de portafolio personal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block">
      {/* Editor Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 shrink-0 z-20 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-neutral-900 leading-none">VitaeFlow Editor</h1>
            <span className="text-xs text-neutral-500 mt-0.5">Auto-saving to local storage</span>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { if(confirm('Reset all data to default?')) resetData(); }}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
           >
             <RefreshCw className="w-4 h-4 mr-2" /> Reset
           </Button>
           
           <Button variant="primary" size="sm" className="gap-2" onClick={handlePrint}>
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
        <div className="w-full lg:w-5/12 overflow-y-auto border-r border-neutral-200 bg-white print:hidden">
          <div className="p-6 lg:p-8 space-y-8 pb-24">
            
            {/* Theme Settings */}
            <SettingsEditor 
              settings={data.settings} 
              onUpdate={(newSettings) => setTheme(newSettings, false)} 
            />

            <ProfileEditor data={data.personal} onChange={updatePersonal} />
            <ExperienceEditor 
              experiences={data.experiencia} 
              onAdd={addExperiencia} 
              onUpdate={updateExperiencia} 
              onRemove={removeExperiencia}
              onMove={(idx, dir) => moveItem('experiencia', idx, dir)}
            />
            <ProjectsEditor
              proyectos={data.proyectos}
              onAdd={addProyecto}
              onUpdate={updateProyecto}
              onRemove={removeProyecto}
              onMove={(idx, dir) => moveItem('proyectos', idx, dir)}
            />
            <EducationEditor 
              educations={data.educacion}
              onAdd={addEducacion}
              onUpdate={updateEducacion}
              onRemove={removeEducacion}
              onMove={(idx, dir) => moveItem('educacion', idx, dir)}
            />
            <SkillsEditor 
              skills={data.skills}
              onAdd={addSkill}
              onUpdate={updateSkill}
              onRemove={removeSkill}
              onMove={(idx, dir) => moveItem('skills', idx, dir)}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Fixed Preview (60%) */}
        {/* Changed background logic to respect dark mode */}
        <div className={`hidden lg:flex lg:w-7/12 items-start justify-center overflow-hidden relative print:block print:w-full print:bg-white print:static print:overflow-visible print:h-auto ${data.settings.darkMode ? 'bg-neutral-900' : 'bg-neutral-100'} transition-colors duration-300`}>
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
