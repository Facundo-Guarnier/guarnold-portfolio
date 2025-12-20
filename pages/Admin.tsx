
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Lock, RefreshCw, Download } from 'lucide-react';
import { useCVData } from '../hooks/useCVData';
import { CVPreview } from '../components/cv/CVPreview';
import { ProfileEditor } from '../components/editor/ProfileEditor';
import { ExperienceEditor } from '../components/editor/ExperienceEditor';
import { EducationEditor } from '../components/editor/EducationEditor';
import { SkillsEditor } from '../components/editor/SkillsEditor';
import { ProjectsEditor } from '../components/editor/ProjectsEditor';
import { Button } from '../components/ui/Button';

// Simple client-side security (Not secure for production backend, fine for local tool)
const SECRET_KEY = "guarnold"; 

const Admin: React.FC = () => {
  const { 
    data, 
    updatePersonal, 
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
    const cleanName = data.personal.nombre.replace(/\s+/g, '_');
    document.title = `${cleanName}_CV`;
    setTimeout(() => {
        window.print();
        // Reset title after print dialog closes (or reasonably after)
        // document.title = originalTitle; 
    }, 100);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECRET_KEY) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect access key");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Restricted Access</h2>
          <p className="text-sm text-neutral-500 mb-6">Enter the access key to edit this CV.</p>
          <div className="space-y-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              placeholder="Access Key"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <Button type="submit" className="w-full">Unlock Editor</Button>
            <p className="text-xs text-neutral-400 mt-4">Hint: guarnold</p>
          </div>
        </form>
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
            <ProfileEditor data={data.personal} onChange={updatePersonal} />
            <ExperienceEditor 
              experiences={data.experiencia} 
              onAdd={addExperiencia} 
              onUpdate={updateExperiencia} 
              onRemove={removeExperiencia}
            />
            <ProjectsEditor
              proyectos={data.proyectos}
              onAdd={addProyecto}
              onUpdate={updateProyecto}
              onRemove={removeProyecto}
            />
            <EducationEditor 
              educations={data.educacion}
              onAdd={addEducacion}
              onUpdate={updateEducacion}
              onRemove={removeEducacion}
            />
            <SkillsEditor 
              skills={data.skills}
              onAdd={addSkill}
              onUpdate={updateSkill}
              onRemove={removeSkill}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Fixed Preview (60%) */}
        <div className="hidden lg:flex lg:w-7/12 bg-neutral-100 items-start justify-center overflow-hidden relative print:block print:w-full print:bg-white print:static print:overflow-visible print:h-auto">
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
