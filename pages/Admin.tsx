import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, LogOut, Save, RotateCcw } from 'lucide-react';
import { useCVData } from '@/hooks/useCVData';
import { useAuth } from '@/hooks/useAuth';
import { useAccesoApp } from '@/hooks/useAccesoApp';
import { SinAcceso } from '@/components/ui/SinAcceso';
import { useScreenScale } from '@/hooks/useScreenScale';
import { CVPreview } from '@/components/cv/CVPreview';
import { ProfileEditor } from '@/components/editor/ProfileEditor';
import { ExperienceEditor } from '@/components/editor/ExperienceEditor';
import { EducationEditor } from '@/components/editor/EducationEditor';
import { SkillsEditor } from '@/components/editor/SkillsEditor';
import { ProjectsEditor } from '@/components/editor/ProjectsEditor';
import { SettingsEditor } from '@/components/editor/SettingsEditor';
import { PortfolioEditor } from '@/components/editor/PortfolioEditor';
import { ImportarPortfolio } from '@/components/editor/ImportarPortfolio';
import { Button } from '@/components/ui/Button';

// Dimensiones A4 en píxeles
const CV_WIDTH = 794;
const CV_HEIGHT = 1123;

const Admin: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const acceso = useAccesoApp(user?.id);
  const scale = useScreenScale(30);
  
  const { 
    data,
    loading: dataLoading,
    saving,
    isDirty,
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
    updateMostrar,
    updatePortfolio,
    importarDesdePortfolio,
    addPerfilItem,
    updatePerfilItem,
    removePerfilItem,
    saveAllChanges,
    discardChanges
  } = useCVData();

  // Alerta al intentar salir/recargar con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Mensaje estándar del navegador (el texto personalizado ya no se muestra en navegadores modernos)
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    const result = await saveAllChanges();
    if (result.success) {
      // Opcional: mostrar toast de éxito
      console.log('Cambios guardados exitosamente');
    } else {
      // Opcional: mostrar toast de error
      console.error('Error al guardar:', result.error);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('¿Estás seguro de que quieres descartar todos los cambios?')) {
      discardChanges();
    }
  };
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${data.personal.nombre.replace(/\s+/g, '_')}_CV`;
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
  };

  const handleSignOut = async () => {
    if (isDirty) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sesión?')) {
        return;
      }
    }
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

  // Cuenta válida pero sin cv-formatter en `plataforma.app_access`: las policies ya le niegan toda
  // escritura; esto solo evita mostrarle un editor que no puede guardar.
  if (acceso === 'cargando') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }
  if (acceso === 'error') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center p-6 text-center">
        <p className="text-neutral-500 dark:text-gray-400">
          No pudimos verificar tu acceso. Recargá la página para reintentar.
        </p>
      </div>
    );
  }
  if (acceso === 'no') {
    return <SinAcceso email={user.email} onSalir={signOut} />;
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

  // Mapeo de color de tema a clases Tailwind para botones con acento
  const accentColorMap: Record<string, string> = {
    neutral: 'bg-neutral-900 hover:bg-neutral-800 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  };
  const accentClass = accentColorMap[data.settings.themeColor] || accentColorMap.neutral;

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-gray-950 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block transition-colors duration-300">
      {/* Editor Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-gray-800 px-6 py-3 shrink-0 z-20 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-full transition-colors text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-none">VitaeFlow Editor</h1>
              {isDirty && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                  Sin guardar
                </span>
              )}
            </div>
            <span className="text-xs text-neutral-500 dark:text-gray-400 mt-0.5">{user.email}</span>
          </div>
        </div>
        <div className="flex gap-2">
           {/* Botón de Descartar cambios */}
           {isDirty && (
             <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDiscard}
              className="gap-2 text-neutral-500 hover:text-neutral-700"
             >
               <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Descartar</span>
             </Button>
           )}

           {/* Botón de Guardar */}
           <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`gap-2 ${isDirty ? accentClass : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'}`}
           >
             {saving ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
               </>
             ) : (
               <>
                 <Save className="w-4 h-4" /> <span className="hidden sm:inline">Guardar</span>
               </>
             )}
           </Button>
           
           <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="gap-2"
           >
             <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Cerrar Sesión</span>
           </Button>
           
           <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="gap-2"
           >
             <Download className="w-4 h-4" /> <span className="hidden sm:inline">Descargar PDF</span>
           </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden print:overflow-visible print:h-auto print:block">
        
        {/* LEFT PANEL: Scrollable Forms (40%) */}
        <div className="w-full lg:w-5/12 overflow-y-auto border-r border-neutral-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 print:hidden">
          <div className="p-6 lg:p-8 space-y-8 pb-24">
            
            <ImportarPortfolio onImportar={importarDesdePortfolio} />

            {/* Theme Settings */}
            <SettingsEditor 
              settings={data.settings} 
              onUpdate={(newSettings) => setTheme(newSettings, true)}
              accentColor={accentClass}
            />

            <ProfileEditor 
              data={data.personal}
              mostrar={data.mostrar}
              onChange={updatePersonal}
              onMostrar={updateMostrar}
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
            <PortfolioEditor
              textos={data.portfolio}
              items={data.perfilItems}
              onTextos={updatePortfolio}
              onAdd={addPerfilItem}
              onUpdate={updatePerfilItem}
              onRemove={removePerfilItem}
              accentColor={accentClass}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Fixed Preview (60%) */}
        <div className={`hidden lg:flex lg:w-7/12 items-start justify-center overflow-hidden relative print:block print:w-full print:bg-white print:static print:overflow-visible print:h-auto ${data.settings.darkMode ? 'bg-neutral-900' : 'bg-gray-100'} transition-colors duration-300`}>
          {/* Inner wrapper con scroll que contiene el CV escalado */}
          <div className="absolute inset-0 overflow-y-auto flex justify-center pt-8 pb-8 print:static print:block print:p-0 print:overflow-visible print:w-full print:h-auto">
             {/* Wrapper de Escalado - idéntico al de Home para consistencia */}
             <div
               style={{
                 transform: `scale(${scale})`,
                 transformOrigin: 'top center',
                 width: `${CV_WIDTH}px`,
                 minHeight: `${CV_HEIGHT}px`,
                 marginBottom: `-${(1 - scale) * CV_HEIGHT}px`,
                 flexShrink: 0,
               }}
               className="print:!transform-none print:!w-[210mm] print:!min-h-0 print:!mb-0"
             >
                <div data-testid="vista-cv">
                  <CVPreview data={data} disableInternalScaling={true} />
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin;
