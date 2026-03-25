import React, { useEffect, useState } from "react";
import BentoGrid from "../components/BentoGrid";
import { Sparkles } from "lucide-react";
import { getProjects } from "../services/dataService";
import type { Project } from "../types";

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const data = await getProjects();
      setProjects(data);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="animate-in fade-in duration-300 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="h-12 w-64 rounded-xl bg-surface-variant animate-pulse mb-4" />
          <div className="h-6 w-[40rem] max-w-full rounded-xl bg-surface-variant animate-pulse mb-10" />

          <div className="h-10 w-80 max-w-full rounded-xl bg-surface-variant animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)] pb-10">
            {[...Array(4)].map((_, index) => (
              <div
                key={`project-skeleton-${index}`}
                className="h-56 rounded-3xl bg-surface-variant animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header - Fixed height so subtitle position is consistent */}
        <header className="max-w-3xl h-28 md:h-32 mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">
            Portfolio
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Una colección de mis trabajos más recientes, experimentos creativos
            y contribuciones al código abierto.
          </p>
        </header>

        <section>
          <div className="flex items-center gap-3 mb-10 border-b border-outline/10 pb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">
              Proyectos Destacados
            </h2>
          </div>
          <BentoGrid projects={projects} />
        </section>
      </div>
    </div>
  );
};

export default Projects;
