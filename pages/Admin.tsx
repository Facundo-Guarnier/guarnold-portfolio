import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Eye, RefreshCw, Download, Loader2, LogOut } from 'lucide-react';
import { useCVData } from '@/hooks/useCVData';
import { useAuth } from '@/hooks/useAuth';
import { CVPreview } from '@/components/cv/CVPreview';
import { ProfileEditor } from '@/components/editor/ProfileEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { SkillsEditor } from '@/components/editor/SkillsEditor';
import { ProjectsEditor } from '@/components/editor/ProjectsEditor';
import { SettingsEditor } from '@/components/editor/SettingsEditor';
import { Button } from '@/components/ui/Button';

const ACCENT_BUTTON_COLORS: Record<string, string> = {
  neutral: 'bg-neutral-900 hover:bg-neutral-800 text-white',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  rose: 'bg-rose-600 hover:bg-rose-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
};

const Admin: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  
  const { 
    data,
    loading: dataLoading,
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
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${data.personal.nombre.replace(/\s+/g, '_')}_CV`;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          <p className="text-neutral-500 dark:text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mostrar loading mientras se cargan los datos
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          <p className="text-neutral-500 dark:text-gray-400">Cargando datos...</p>
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
            <span className="text-xs text-neutral-500 dark:text-gray-400 mt-0.5">Guardando en Supabase • {user.email}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-gray-800"
           >
             <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
           </Button>
           
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { if(confirm('¿Recargar datos desde la base de datos?')) resetData(); }}
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
           >
             <RefreshCw className="w-4 h-4 mr-2" /> Recargar
           </Button>
           
           <Button variant="primary" size="sm" className={`gap-2 ${accentClass} border-none shadow-md`} onClick={handlePrint}>
             <Download className="w-4 h-4" /> Descargar PDF
           </Button>

           <Link to="/">
             <Button variant="secondary" size="sm" className="gap-2">
               <Eye className="w-4 h-4" /> Vista Pública
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
              onUpdate={(newSettings) => setTheme(newSettings, true)}
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
