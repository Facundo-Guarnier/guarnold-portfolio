import React from "react";
import BentoGrid from "../components/BentoGrid";
import GithubStats from "../components/GithubStats";
import { Sparkles, Code2 } from "lucide-react";

const Projects: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-24">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-6">
            Portfolio
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Una colección de mis trabajos más recientes, experimentos creativos
            y contribuciones al código abierto.
          </p>
        </div>

        {/* Section 1: Bento Grid */}
        <section>
          <div className="flex items-center gap-3 mb-10 border-b border-outline/10 pb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
              Proyectos Destacados
            </h2>
          </div>
          <BentoGrid />
        </section>

        {/* Section 2: Github Stats */}
        <section>
          <div className="flex items-center gap-3 mb-10 border-b border-outline/10 pb-4">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <Code2 size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
              Actividad en Código (GitHub)
            </h2>
          </div>
          <GithubStats />
        </section>
      </div>
    </div>
  );
};

export default Projects;
