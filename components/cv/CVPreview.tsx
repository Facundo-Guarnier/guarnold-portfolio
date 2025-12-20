
import React from 'react';
import { CVData } from '../../types/cv';
import { MapPin, Mail, Phone, Github, Linkedin, ExternalLink, Globe, User, Twitter, Link as LinkIcon, Gitlab, Youtube, Instagram, MessageCircle, Send, Code2, BookOpen, Palette } from 'lucide-react';

interface CVPreviewProps {
  data: CVData;
  className?: string;
}

// THEME CONFIGURATION
// Structure: [Light Class] [Dark Class (Bright/Pastel)] [Print Class (Always Black/Grey)]
const THEME_COLORS: Record<string, any> = {
  neutral: {
    primary: 'text-neutral-900 dark:text-white print:text-black',
    secondary: 'text-neutral-600 dark:text-neutral-400 print:text-neutral-600',
    accent: 'text-neutral-500 dark:text-neutral-500 print:text-neutral-500',
    border: 'border-neutral-200 dark:border-neutral-800 print:border-neutral-200',
    borderLeft: 'border-neutral-100 dark:border-neutral-800 print:border-neutral-200',
    hoverBorder: 'hover:border-neutral-300 dark:hover:border-neutral-600',
    iconBg: 'bg-neutral-100 dark:bg-neutral-800 print:bg-neutral-100',
    iconColor: 'text-neutral-600 dark:text-neutral-300 print:text-neutral-600',
    barBg: 'bg-neutral-200 dark:bg-neutral-800 print:bg-neutral-200',
    barFill: 'bg-neutral-600 dark:bg-neutral-200 print:bg-neutral-600',
    linkHover: 'hover:text-neutral-900 dark:hover:text-white',
  },
  blue: {
    primary: 'text-blue-900 dark:text-blue-300 print:text-black',
    secondary: 'text-blue-700 dark:text-blue-400 print:text-neutral-600',
    accent: 'text-blue-500 dark:text-blue-300 print:text-neutral-500',
    border: 'border-blue-200 dark:border-blue-900/50 print:border-neutral-200',
    borderLeft: 'border-blue-100 dark:border-blue-900/50 print:border-neutral-200',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30 print:bg-neutral-100',
    iconColor: 'text-blue-700 dark:text-blue-300 print:text-neutral-600',
    barBg: 'bg-blue-100 dark:bg-blue-900/40 print:bg-neutral-200',
    barFill: 'bg-blue-600 dark:bg-blue-400 print:bg-neutral-600',
    linkHover: 'hover:text-blue-800 dark:hover:text-blue-200',
  },
  emerald: {
    primary: 'text-emerald-900 dark:text-emerald-300 print:text-black',
    secondary: 'text-emerald-700 dark:text-emerald-400 print:text-neutral-600',
    accent: 'text-emerald-500 dark:text-emerald-300 print:text-neutral-500',
    border: 'border-emerald-200 dark:border-emerald-900/50 print:border-neutral-200',
    borderLeft: 'border-emerald-100 dark:border-emerald-900/50 print:border-neutral-200',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 print:bg-neutral-100',
    iconColor: 'text-emerald-700 dark:text-emerald-300 print:text-neutral-600',
    barBg: 'bg-emerald-100 dark:bg-emerald-900/40 print:bg-neutral-200',
    barFill: 'bg-emerald-600 dark:bg-emerald-400 print:bg-neutral-600',
    linkHover: 'hover:text-emerald-800 dark:hover:text-emerald-200',
  },
  purple: {
    primary: 'text-purple-900 dark:text-purple-300 print:text-black',
    secondary: 'text-purple-700 dark:text-purple-400 print:text-neutral-600',
    accent: 'text-purple-500 dark:text-purple-300 print:text-neutral-500',
    border: 'border-purple-200 dark:border-purple-900/50 print:border-neutral-200',
    borderLeft: 'border-purple-100 dark:border-purple-900/50 print:border-neutral-200',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30 print:bg-neutral-100',
    iconColor: 'text-purple-700 dark:text-purple-300 print:text-neutral-600',
    barBg: 'bg-purple-100 dark:bg-purple-900/40 print:bg-neutral-200',
    barFill: 'bg-purple-600 dark:bg-purple-400 print:bg-neutral-600',
    linkHover: 'hover:text-purple-800 dark:hover:text-purple-200',
  },
  rose: {
    primary: 'text-rose-900 dark:text-rose-300 print:text-black',
    secondary: 'text-rose-700 dark:text-rose-400 print:text-neutral-600',
    accent: 'text-rose-500 dark:text-rose-300 print:text-neutral-500',
    border: 'border-rose-200 dark:border-rose-900/50 print:border-neutral-200',
    borderLeft: 'border-rose-100 dark:border-rose-900/50 print:border-neutral-200',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30 print:bg-neutral-100',
    iconColor: 'text-rose-700 dark:text-rose-300 print:text-neutral-600',
    barBg: 'bg-rose-100 dark:bg-rose-900/40 print:bg-neutral-200',
    barFill: 'bg-rose-600 dark:bg-rose-400 print:bg-neutral-600',
    linkHover: 'hover:text-rose-800 dark:hover:text-rose-200',
  },
  amber: {
    primary: 'text-amber-900 dark:text-amber-300 print:text-black',
    secondary: 'text-amber-700 dark:text-amber-400 print:text-neutral-600',
    accent: 'text-amber-600 dark:text-amber-300 print:text-neutral-500',
    border: 'border-amber-200 dark:border-amber-900/50 print:border-neutral-200',
    borderLeft: 'border-amber-100 dark:border-amber-900/50 print:border-neutral-200',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30 print:bg-neutral-100',
    iconColor: 'text-amber-700 dark:text-amber-300 print:text-neutral-600',
    barBg: 'bg-amber-100 dark:bg-amber-900/40 print:bg-neutral-200',
    barFill: 'bg-amber-600 dark:bg-amber-400 print:bg-neutral-600',
    linkHover: 'hover:text-amber-800 dark:hover:text-amber-200',
  }
};

const ICON_MAP: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-3.5 h-3.5 shrink-0" />,
  github: <Github className="w-3.5 h-3.5 shrink-0" />,
  gitlab: <Gitlab className="w-3.5 h-3.5 shrink-0" />,
  stackoverflow: <Code2 className="w-3.5 h-3.5 shrink-0" />,
  twitter: <Twitter className="w-3.5 h-3.5 shrink-0" />,
  youtube: <Youtube className="w-3.5 h-3.5 shrink-0" />,
  medium: <BookOpen className="w-3.5 h-3.5 shrink-0" />,
  instagram: <Instagram className="w-3.5 h-3.5 shrink-0" />,
  behance: <Palette className="w-3.5 h-3.5 shrink-0" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5 shrink-0" />,
  telegram: <Send className="w-3.5 h-3.5 shrink-0" />,
  email: <Mail className="w-3.5 h-3.5 shrink-0" />,
  phone: <Phone className="w-3.5 h-3.5 shrink-0" />,
  portfolio: <Globe className="w-3.5 h-3.5 shrink-0" />,
  other: <LinkIcon className="w-3.5 h-3.5 shrink-0" />
};

const SocialIcon: React.FC<{ platform?: string; label: string }> = ({ platform, label }) => {
  let key = platform;
  if (!key) {
    const l = label.toLowerCase();
    if (l.includes('linkedin')) key = 'linkedin';
    else if (l.includes('github') || l.includes('git')) key = 'github';
    else if (l.includes('twitter') || l.includes('x')) key = 'twitter';
    else if (l.includes('mail')) key = 'email';
    else if (l.includes('gitlab')) key = 'gitlab';
    else key = 'portfolio';
  }
  return <>{ICON_MAP[key || 'other'] || ICON_MAP['other']}</>;
};

const CircuitWatermark = ({ isDark }: { isDark: boolean }) => (
  <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none z-0 overflow-hidden opacity-[0.06] print:opacity-[0.08] ${isDark ? 'text-neutral-500' : 'text-neutral-900'} print:text-neutral-900`}>
    <svg viewBox="0 0 500 500" className="w-full h-full fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <circle cx="480" cy="480" r="1.5" fill="currentColor" className="opacity-50"/>
      <circle cx="460" cy="480" r="1.5" fill="currentColor" className="opacity-50"/>
      <circle cx="480" cy="460" r="1.5" fill="currentColor" className="opacity-50"/>
    </svg>
  </div>
);

export const CVPreview: React.FC<CVPreviewProps> = ({ data, className = '' }) => {
  const { personal, experiencia, educacion, skills, proyectos, settings } = data;
  
  // Default to neutral if theme not found
  const theme = THEME_COLORS[settings?.themeColor || 'neutral'] || THEME_COLORS['neutral'];
  const isDark = settings?.darkMode || false;

  // Root container styles:
  // - On Screen (Light): bg-white text-neutral-900
  // - On Screen (Dark): bg-slate-950 text-white
  // - On Print: FORCE bg-white text-neutral-900
  const containerClasses = `
    relative w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 md:p-14 shadow-2xl overflow-hidden box-border
    bg-white text-neutral-900 
    dark:bg-slate-950 dark:text-white
    print:bg-white print:text-neutral-900 print:shadow-none print:w-full print:p-10 print:dark:bg-white print:dark:text-neutral-900
    ${className}
  `;

  const bodyText = "text-neutral-700 dark:text-neutral-300 print:text-neutral-700";
  const smallText = "text-neutral-500 dark:text-neutral-400 print:text-neutral-500";

  return (
    // IMPORTANT: 'dark' class applied here triggers dark mode for all children if isDark is true.
    <div className={`${isDark ? 'dark' : ''} h-full`}>
      <div className={containerClasses} id="cv-preview">
        
        {/* Watermark */}
        <CircuitWatermark isDark={isDark} />

        {/* Content Wrapper */}
        <div className="relative z-10">
          
          {/* Header Section */}
          <header className={`border-b pb-8 mb-10 ${theme.border}`}>
            <div className="flex flex-col md:flex-row gap-8 md:items-end justify-between">
              
              {/* Text Content */}
              <div className="flex-1 order-2 md:order-1 text-center md:text-left">
                <h1 className={`text-5xl md:text-6xl font-bold uppercase tracking-tighter mb-3 leading-none ${theme.primary}`}>
                  {personal.nombre}
                </h1>
                <p className={`text-sm md:text-base font-medium tracking-[0.2em] uppercase ${smallText}`}>
                  {personal.titulo}
                </p>
                
                {/* Contact Bar */}
                <div className={`mt-6 flex flex-wrap justify-center md:justify-start gap-y-3 gap-x-6 text-sm font-medium ${theme.secondary}`}>
                  {personal.email && (
                    <div className="flex items-center gap-2 group">
                      <div className={`p-1.5 rounded-md transition-colors ${theme.iconBg} ${theme.iconColor}`}>
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span>{personal.email}</span>
                    </div>
                  )}
                  {personal.telefono && (
                    <div className="flex items-center gap-2 group">
                       <div className={`p-1.5 rounded-md transition-colors ${theme.iconBg} ${theme.iconColor}`}>
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <span>{personal.telefono}</span>
                    </div>
                  )}
                  {personal.ubicacion && (
                    <div className="flex items-center gap-2 group">
                       <div className={`p-1.5 rounded-md transition-colors ${theme.iconBg} ${theme.iconColor}`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span>{personal.ubicacion}</span>
                    </div>
                  )}
                  {/* Dynamic Links */}
                  {personal.links && personal.links.map(link => (
                     <div key={link.id} className="flex items-center gap-2 group">
                        <div className={`p-1.5 rounded-md transition-colors ${theme.iconBg} ${theme.iconColor}`}>
                           <SocialIcon platform={link.platform} label={link.label} />
                        </div>
                       <a 
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`transition-colors border-b border-transparent pb-0.5 print:no-underline print:border-none hover:border-current ${theme.linkHover}`}
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
                    <div className={`absolute inset-0 rounded-full translate-x-1 translate-y-1 bg-neutral-900 dark:bg-neutral-700 print:hidden`}></div>
                    <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 z-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border-white dark:border-neutral-700 print:bg-white print:border-neutral-200 print:w-32 print:h-32`}>
                      <User className="w-16 h-16 text-neutral-300 absolute" />
                      <img 
                        src={personal.foto} 
                        alt={personal.nombre}
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Row 1: Two Columns (Main & Sidebar) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
            {/* Main Column (Left) */}
            <div className="md:col-span-8 space-y-10">
              
              {/* Profile Summary */}
              {personal.resumen && (
                <section>
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme.primary}`}>
                    <div className={`w-8 h-px bg-current`}></div>
                    Perfil Profesional
                  </h3>
                  <p className={`text-sm leading-7 whitespace-pre-line text-justify font-normal ${bodyText}`}>
                    {personal.resumen}
                  </p>
                </section>
              )}

              {/* Experience */}
              {experiencia.length > 0 && (
                <section>
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${theme.primary}`}>
                     <div className={`w-8 h-px bg-current`}></div>
                    Experiencia Laboral
                  </h3>
                  <div className="space-y-8">
                    {experiencia.map((exp) => (
                      <div key={exp.id} className={`break-inside-avoid group relative pl-4 border-l-2 transition-colors ${theme.borderLeft} ${theme.hoverBorder}`}>
                        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-1.5">
                          <h4 className={`text-lg font-bold tracking-tight ${theme.primary}`}>
                            {exp.puesto}
                          </h4>
                          <span className={`text-sm font-medium whitespace-nowrap ${smallText}`}>
                            {exp.periodo}
                          </span>
                        </div>
                        <div className={`text-sm font-semibold mb-3 ${theme.secondary}`}>
                          {exp.empresa}
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-line text-justify ${bodyText}`}>
                          {exp.descripcion}
                        </p>
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
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-5 ${theme.primary}`}>
                    Habilidades
                  </h3>
                  <div className="space-y-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="break-inside-avoid">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-sm font-semibold text-neutral-700 dark:text-neutral-300 print:text-neutral-700`}>
                            {skill.nombre}
                          </span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme.barBg}`}>
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${theme.barFill}`} 
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
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-5 ${theme.primary}`}>
                    Educación
                  </h3>
                  <div className="space-y-6">
                    {educacion.map((edu) => (
                      <div key={edu.id} className="break-inside-avoid relative">
                        <div className={`absolute -left-[19px] top-1.5 w-2 h-2 rounded-full border-2 bg-white dark:bg-slate-950 print:bg-white ${theme.border}`}></div>
                        <div className={`border-l pl-5 pb-1 ${theme.border}`}>
                            <h4 className={`text-sm font-bold leading-tight mb-1 ${theme.primary}`}>
                                {edu.titulo}
                            </h4>
                            <div className={`text-xs font-semibold mb-1 ${theme.secondary}`}>
                                {edu.institucion}
                            </div>
                            <span className={`text-xs font-medium block mb-2 font-mono ${smallText}`}>
                                {edu.periodo}
                            </span>
                            {edu.descripcion && (
                                <p className={`text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 print:text-neutral-600`}>
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

          {/* Row 2: Full Width Projects Section */}
          {proyectos && proyectos.length > 0 && (
              <section className={`mt-10 pt-10 border-t ${theme.borderLeft}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${theme.primary}`}>
                  <div className={`w-8 h-px bg-current`}></div>
                  Proyectos Destacados
              </h3>
              <div className="space-y-0">
                  {proyectos.map((proj) => (
                  <div key={proj.id} className="break-inside-avoid group mb-8 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-base font-bold ${theme.primary}`}>
                          {proj.nombre}
                          </h4>
                          {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className={`text-xs flex items-center gap-1 transition-colors ${smallText} hover:text-current`}><ExternalLink className="w-3 h-3"/> <span className="print:hidden">Ver Proyecto</span></a>}
                      </div>
                      <p className={`text-sm leading-relaxed whitespace-pre-line mb-2 text-justify ${bodyText}`}>
                      {proj.descripcion}
                      </p>
                      <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${smallText}`}>Stack</span>
                          <div className={`h-px w-8 bg-neutral-200 dark:bg-neutral-800 print:bg-neutral-200`}></div>
                          <span className={`text-xs font-medium font-mono ${theme.secondary}`}>
                          {proj.tecnologias}
                          </span>
                      </div>
                  </div>
                  ))}
              </div>
              </section>
          )}

        </div>
      </div>
    </div>
  );
};
