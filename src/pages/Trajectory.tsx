import React from 'react';
import { Briefcase, GraduationCap, Calendar } from 'lucide-react';
import { cn } from '../utils';
import { CardComponent } from '../components/CardComponent';

interface TrajectoryItem {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
}

const experienceData: TrajectoryItem[] = [
  {
    id: 'tinkin',
    title: 'Software Developer',
    organization: 'Tinkin (Remoto)',
    period: 'Ago 2024 - Presente',
    description: 'Desarrollo full-stack (Scrum). Fideval App (Flutter), Mercately (React/TS), Kamina Academy (FastAPI). Dictado de sesiones técnicas.',
  },
  {
    id: 'freelance',
    title: 'Freelance Developer',
    organization: 'Autónomo',
    period: '2021 - Presente',
    description: 'Desarrollo de soluciones web a medida y scripts de automatización (Python/Computer Vision).',
  }
];

const educationData: TrajectoryItem[] = [
  {
    id: 'university',
    title: 'Ingeniería en Informática',
    organization: 'Universidad de Mendoza',
    period: '2020 - 2025',
    description: "Formación integral con promedio destacado. Tesis: 'SemaforIA' (Reinforcement Learning)."
  },
  {
    id: 'english',
    title: 'Formación en Idioma Inglés',
    organization: 'Clases Particulares',
    period: '2021 - Presente',
    description: 'Nivel B1 alcanzado. Formación continua orientada a la lectura de documentación técnica y comunicación profesional.'
  }
];

const TimelineItem: React.FC<{ item: TrajectoryItem; isLast: boolean }> = ({ item, isLast }) => {
  const isPresent = item.period.toLowerCase().includes('presente');

  return (
    <div className={cn("relative pl-8 md:pl-10", !isLast && "pb-12")}>
      {/* Dot on the timeline - positioned to align with the card header roughly */}
      <div 
        className={cn(
          "absolute left-[-5px] top-[26px] w-3 h-3 rounded-full border-2 ring-4 ring-background transition-colors duration-300 z-10",
          isPresent ? "bg-green-500 border-green-500" : "bg-surface-variant border-outline"
        )} 
      />

      <CardComponent className="p-5 md:p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/30 group">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <span className="text-primary font-semibold text-sm md:text-base">
              {item.organization}
            </span>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit shrink-0",
            isPresent 
              ? "bg-green-500/10 text-green-500 border border-green-500/20" 
              : "bg-surface-variant text-on-surface-variant border border-outline/10"
          )}>
            <Calendar size={12} />
            {item.period}
          </div>
        </div>

        <p className="text-on-surface-variant text-sm leading-relaxed">
          {item.description}
        </p>
      </CardComponent>
    </div>
  );
};

const Trajectory: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700 max-w-4xl mx-auto px-4 py-16 md:py-24">
       {/* Header */}
       <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
          Trayectoria
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl">
          Mi camino profesional y académico en detalle.
        </p>
      </div>

      {/* Experience Section */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Briefcase size={24} />
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Experiencia Profesional</h2>
        </div>
        
        <div className="border-l-2 border-primary/20 ml-5 md:ml-6 pt-2 pb-2">
          {experienceData.map((item, index) => (
            <TimelineItem 
              key={item.id} 
              item={item} 
              isLast={index === experienceData.length - 1} 
            />
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
            <GraduationCap size={24} />
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Educación</h2>
        </div>
        
        <div className="border-l-2 border-primary/20 ml-5 md:ml-6 pt-2 pb-2">
          {educationData.map((item, index) => (
            <TimelineItem 
              key={item.id} 
              item={item} 
              isLast={index === educationData.length - 1} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trajectory;