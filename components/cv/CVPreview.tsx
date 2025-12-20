
import React from 'react';
import { CVData } from '../../types/cv';
import { MapPin, Mail, Phone, Github, Linkedin, ExternalLink, Globe } from 'lucide-react';

interface CVPreviewProps {
  data: CVData;
  className?: string;
}

const LinkIcon: React.FC<{ label: string }> = ({ label }) => {
  const l = label.toLowerCase();
  if (l.includes('github') || l.includes('git')) return <Github className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  if (l.includes('linkedin')) return <Linkedin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  return <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
};

const CircuitWatermark = () => (
  <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none z-0 overflow-hidden opacity-[0.06] print:opacity-[0.08] text-neutral-900">
    <svg viewBox="0 0 500 500" className="w-full h-full fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Abstract Circuit Paths */}
      <path d="M500 500 L 450 500 L 450 450" />
      <circle cx="450" cy="450" r="3" fill="currentColor" />
      
      <path d="M500 400 L 420 400 L 400 380 L 300 380 L 300 450" />
      <circle cx="300" cy="450" r="4" fill="currentColor" />
      <circle cx="500" cy="400" r="2" />

      <path d="M500 200 L 450 200 L 400 250 L 350 250" />
      <circle cx="350" cy="250" r="3" fill="currentColor" />

      <path d="M300 500 L 300 480 L 250 430 L 150 430 L 150 400" />
      <rect x="140" y="380" width="20" height="20" strokeWidth="1.5" />
      
      <path d="M400 500 L 400 480 L 350 430" />
      <circle cx="350" cy="430" r="2" />

      <path d="M500 100 L 480 100 L 450 130 L 450 180" />
      <circle cx="450" cy="180" r="3" />
      
      <path d="M200 500 L 200 480 L 100 380 L 50 380" />
      <circle cx="50" cy="380" r="4" fill="currentColor" />

      {/* Decorative dots/grid */}
      <circle cx="480" cy="480" r="1.5" fill="currentColor" className="opacity-50"/>
      <circle cx="460" cy="480" r="1.5" fill="currentColor" className="opacity-50"/>
      <circle cx="480" cy="460" r="1.5" fill="currentColor" className="opacity-50"/>
    </svg>
  </div>
);

export const CVPreview: React.FC<CVPreviewProps> = ({ data, className = '' }) => {
  const { personal, experiencia, educacion, skills, proyectos } = data;

  return (
    <div 
      className={`relative bg-white text-neutral-900 w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 md:p-14 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 box-border overflow-hidden ${className}`}
      id="cv-preview"
    >
      {/* Watermark - Absolute Bottom Right */}
      <CircuitWatermark />

      {/* Content Wrapper - Z-Index to stay above watermark */}
      <div className="relative z-10">
        
        {/* Header Section */}
        <header className="border-b border-neutral-200 pb-8 mb-10">
          <div className="flex flex-col md:flex-row gap-8 md:items-end justify-between">
            
            {/* Text Content */}
            <div className="flex-1 order-2 md:order-1 text-center md:text-left">
              <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-3 text-neutral-900 leading-none">
                {personal.nombre}
              </h1>
              <p className="text-sm md:text-base font-medium text-neutral-500 tracking-[0.2em] uppercase">
                {personal.titulo}
              </p>
              
              {/* Contact Bar - Tech Style */}
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-y-3 gap-x-6 text-sm text-neutral-600 font-medium">
                {personal.email && (
                  <div className="flex items-center gap-2 group">
                    <div className="p-1.5 bg-neutral-100 rounded-md group-hover:bg-neutral-200 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                    <span>{personal.email}</span>
                  </div>
                )}
                {personal.telefono && (
                  <div className="flex items-center gap-2 group">
                     <div className="p-1.5 bg-neutral-100 rounded-md group-hover:bg-neutral-200 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                    <span>{personal.telefono}</span>
                  </div>
                )}
                {personal.ubicacion && (
                  <div className="flex items-center gap-2 group">
                     <div className="p-1.5 bg-neutral-100 rounded-md group-hover:bg-neutral-200 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                    <span>{personal.ubicacion}</span>
                  </div>
                )}
                {/* Dynamic Links */}
                {personal.links && personal.links.map(link => (
                   <div key={link.id} className="flex items-center gap-2 group">
                      <div className="p-1.5 bg-neutral-100 rounded-md group-hover:bg-neutral-200 transition-colors">
                         <LinkIcon label={link.label} />
                      </div>
                     <a 
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="hover:text-neutral-900 transition-colors border-b border-transparent hover:border-neutral-900 pb-0.5 print:no-underline print:text-neutral-600 print:border-none"
                     >
                       {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                     </a>
                   </div>
                ))}
              </div>
            </div>

            {/* Profile Picture */}
            {personal.foto && (
              <div className="order-1 md:order-2 flex justify-center md:justify-end mb-4 md:mb-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-neutral-900 rounded-full translate-x-1 translate-y-1"></div>
                  <img 
                    src={personal.foto} 
                    alt={personal.nombre}
                    className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white z-10 print:w-32 print:h-32" 
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Main Column (Left) */}
          <div className="md:col-span-8 space-y-10">
            
            {/* Profile Summary */}
            {personal.resumen && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-px bg-neutral-900"></div>
                  Perfil Profesional
                </h3>
                <p className="text-sm leading-7 text-neutral-700 whitespace-pre-line text-justify font-normal">
                  {personal.resumen}
                </p>
              </section>
            )}

            {/* Experience */}
            {experiencia.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-6 flex items-center gap-2">
                   <div className="w-8 h-px bg-neutral-900"></div>
                  Experiencia Laboral
                </h3>
                <div className="space-y-8">
                  {experiencia.map((exp) => (
                    <div key={exp.id} className="group relative pl-4 border-l-2 border-neutral-100 hover:border-neutral-300 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1.5">
                        <h4 className="text-lg font-bold text-neutral-900 tracking-tight">
                          {exp.puesto}
                        </h4>
                        <span className="text-xs text-neutral-500 font-semibold bg-neutral-50 px-2 py-1 rounded border border-neutral-100 whitespace-nowrap">
                          {exp.periodo}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-neutral-600 mb-3">
                        {exp.empresa}
                      </div>
                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line text-justify">
                        {exp.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects Section */}
            {proyectos && proyectos.length > 0 && (
               <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-6 flex items-center gap-2">
                   <div className="w-8 h-px bg-neutral-900"></div>
                  Proyectos Destacados
                </h3>
                <div className="space-y-6">
                  {proyectos.map((proj) => (
                    <div key={proj.id} className="group bg-neutral-50 p-5 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-bold text-neutral-900">
                          {proj.nombre}
                          </h4>
                          {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"><ExternalLink className="w-3 h-3"/> <span className="print:hidden">Ver Proyecto</span></a>}
                      </div>
                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line mb-3 text-justify">
                        {proj.descripcion}
                      </p>
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Stack</span>
                          <div className="h-px flex-1 bg-neutral-200"></div>
                          <span className="text-xs font-medium text-neutral-600 font-mono">
                            {proj.tecnologias}
                          </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Column (Right) */}
          <aside className="md:col-span-4 space-y-10">
            
             {/* Skills */}
             {skills.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-5">
                  Habilidades
                </h3>
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-neutral-700">
                          {skill.nombre}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-neutral-800 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${(skill.nivel / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {educacion.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-5">
                  Educación
                </h3>
                <div className="space-y-6">
                  {educacion.map((edu) => (
                    <div key={edu.id} className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border-2 border-neutral-200 bg-white"></div>
                      <div className="border-l border-neutral-200 pl-5 pb-1">
                          <h4 className="text-sm font-bold text-neutral-900 leading-tight mb-1">
                              {edu.titulo}
                          </h4>
                          <div className="text-xs font-semibold text-neutral-600 mb-1">
                              {edu.institucion}
                          </div>
                          <span className="text-xs text-neutral-400 font-medium block mb-2 font-mono">
                              {edu.periodo}
                          </span>
                          {edu.descripcion && (
                              <p className="text-xs text-neutral-500 leading-relaxed">
                                  {edu.descripcion}
                              </p>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
