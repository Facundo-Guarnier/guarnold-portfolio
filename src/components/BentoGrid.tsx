import React, { useEffect, useState } from "react";
import { getProjects } from "../services/dataService";
import type { Project } from "../types";
import ProjectCard from "./ProjectCard";

const BentoGrid: React.FC = () => {
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

  const getSizeClasses = (size?: string) => {
    switch (size) {
      case "tall":
        return "md:row-span-2 md:col-span-1";
      case "large":
        return "md:col-span-2 md:row-span-2";
      case "medium":
        // Spanning 2 columns makes medium items wide
        return "md:col-span-2 md:row-span-1";
      case "small":
      default:
        return "md:col-span-1 md:row-span-1";
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)] pb-12">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="h-48 rounded-3xl bg-surface-variant animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)] pb-12">
      {projects.map((project, index) => (
        <div
          key={project.id ?? `${project.title ?? "project"}-${index}`}
          className={getSizeClasses(project.size)}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;
