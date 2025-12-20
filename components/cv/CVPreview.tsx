
import React from 'react';
import { CVData } from '../../types/cv';
import { MapPin, Mail, Phone, Github, Linkedin, ExternalLink } from 'lucide-react';

interface CVPreviewProps {
  data: CVData;
  className?: string;
}

export const CVPreview: React.FC<CVPreviewProps> = ({ data, className = '' }) => {
  const { personal, experiencia, educacion, skills, proyectos } = data;

  return (
    <div 
      className={`bg-white text-neutral-900 w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 md:p-12 shadow-2xl print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 box-border ${className}`}
      id="cv-preview"
    >
      {/* Header Section */}
      <header className="border-b-2 border-neutral-900 pb-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
          
          {/* Text Content */}
          <div className="flex-1 order-2 md:order-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-2 text-neutral-900">
              {personal.nombre}
            </h1>
            <p className="text-xl md:text-2xl font-light text-neutral-500 tracking-wide">
              {personal.titulo}
            </p>
            
            {/* Contact Bar - Compact grid for print */}
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-5 text-sm text-neutral-600">
              {personal.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{personal.email}</span>
                </div>
              )}
              {personal.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{personal.telefono}</span>
                </div>
              )}
              {personal.ubicacion && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{personal.ubicacion}</span>
                </div>
              )}
              {personal.linkedin && (
                <div className="flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{personal.linkedin}</span>
                </div>
              )}
              {personal.github && (
                <div className="flex items-center gap-2">
                  <Github className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{personal.github}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Picture */}
          {personal.foto && (
            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <img 
                src={personal.foto} 
                alt={personal.nombre}
                className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-[3px] border-neutral-100 shadow-sm print:w-32 print:h-32" 
              />
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
        {/* Main Column (Left) */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Profile Summary */}
          {personal.resumen && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                Perfil Profesional
              </h3>
              <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line text-justify">
                {personal.resumen}
              </p>
            </section>
          )}

          {/* Experience */}
          {experiencia.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-5 flex items-center gap-2">
                <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                Experiencia Laboral
              </h3>
              <div className="space-y-6">
                {experiencia.map((exp) => (
                  <div key={exp.id} className="group">
                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1">
                      <h4 className="text-base font-bold text-neutral-900">
                        {exp.puesto}
                      </h4>
                      <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                        {exp.periodo}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-neutral-600 mb-2">
                      {exp.empresa}
                    </div>
                    {/* Critical: whitespace-pre-line enables the bullet points and newlines */}
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-5 flex items-center gap-2">
                <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                Proyectos Destacados
              </h3>
              <div className="space-y-6">
                {proyectos.map((proj) => (
                  <div key={proj.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-bold text-neutral-900">
                        {proj.nombre}
                        </h4>
                        {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/> <span className="print:hidden">Link</span></a>}
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line mb-2 text-justify">
                      {proj.descripcion}
                    </p>
                    <div className="text-xs text-neutral-500 font-medium italic border-t border-neutral-100 pt-1 mt-1 inline-block">
                        <span className="not-italic font-semibold text-neutral-400 mr-1">Stack:</span>
                        {proj.tecnologias}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column (Right) */}
        <aside className="md:col-span-4 space-y-8">
          
           {/* Skills */}
           {skills.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-200 pb-2 md:border-none md:pb-0">
                Habilidades
              </h3>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-neutral-700">
                        {skill.nombre}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neutral-800 rounded-full" 
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-200 pb-2 md:border-none md:pb-0">
                Educación
              </h3>
              <div className="space-y-5">
                {educacion.map((edu) => (
                  <div key={edu.id}>
                    <h4 className="text-sm font-bold text-neutral-900 leading-tight mb-1">
                        {edu.titulo}
                    </h4>
                    <div className="text-xs text-neutral-600 mb-1">
                        {edu.institucion}
                    </div>
                    <span className="text-xs text-neutral-400 font-medium block mb-1">
                        {edu.periodo}
                    </span>
                    {edu.descripcion && (
                        <p className="text-xs text-neutral-500 leading-snug">
                            {edu.descripcion}
                        </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};
