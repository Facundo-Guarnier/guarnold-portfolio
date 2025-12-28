import React from 'react';
import { Star, GitFork, BookMarked, ExternalLink } from 'lucide-react';
import { CardComponent } from './CardComponent';

interface Repo {
  name: string;
  description: string;
  language: string;
  color: string;
  stars: number;
  forks: number;
  link?: string;
}

const repos: Repo[] = [
  {
    name: "SemaforIA",
    description: "Sistema de control de tráfico inteligente basado en Reinforcement Learning para optimizar flujos vehiculares.",
    language: "Python",
    color: "#3572A5", // Python Blue
    stars: 12,
    forks: 4,
    link: "#"
  },
  {
    name: "Fideval App",
    description: "Aplicación móvil fintech para gestión de inversiones y seguimiento de mercado en tiempo real.",
    language: "Dart",
    color: "#00B4AB", // Dart Teal
    stars: 8,
    forks: 2,
    link: "#"
  },
  {
    name: "Facial-Recon-Script",
    description: "Scripts de visión por computadora utilizando OpenCV para detección y reconocimiento facial robusto.",
    language: "Python",
    color: "#3572A5",
    stars: 24,
    forks: 9,
    link: "#"
  }
];

const GithubStats: React.FC = () => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <CardComponent 
            key={repo.name} 
            className="p-5 flex flex-col h-full hover:border-primary/50 group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <BookMarked size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                <span className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                  {repo.name}
                </span>
              </div>
              {repo.link && (
                <ExternalLink size={14} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4 flex-1">
              {repo.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-auto">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: repo.color }}
                />
                <span>{repo.language}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Star size={12} />
                <span>{repo.stars}</span>
              </div>

              <div className="flex items-center gap-1">
                <GitFork size={12} />
                <span>{repo.forks}</span>
              </div>
            </div>
          </CardComponent>
        ))}
      </div>
    </div>
  );
};

export default GithubStats;