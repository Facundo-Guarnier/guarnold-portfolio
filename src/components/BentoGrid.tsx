import React from "react";
import type { Project } from "../types";
import ProjectCard from "./ProjectCard";

interface BentoGridProps {
  projects?: Project[];
}

const BentoGrid: React.FC<BentoGridProps> = ({ projects = [] }) => {
  const normalizeSize = (size?: string) => {
    const normalized = (size ?? "small").toLowerCase();

    if (!["small", "medium", "large", "tall"].includes(normalized)) {
      return "small";
    }

    return normalized;
  };

  const getSizeClasses = (size?: string) => {
    const resolvedSize = normalizeSize(size);

    switch (resolvedSize) {
      case "tall":
        return "min-h-[20rem]";
      case "large":
        return "min-h-[17.5rem]";
      case "medium":
        return "min-h-[15.5rem]";
      case "small":
      default:
        return "min-h-[14rem]";
    }
  };

  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-outline/30 bg-surface-variant/60 p-8 text-center text-on-surface-variant">
        Próximamente más proyectos...
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 xl:columns-3 [column-gap:1.5rem] pb-10">
      {projects.map((project, index) => (
        <div
          key={project.id ?? `${project.title ?? "project"}-${index}`}
          className={`mb-6 break-inside-avoid ${getSizeClasses(project.size)}`}
        >
          <ProjectCard
            project={{ ...project, size: normalizeSize(project.size) }}
          />
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;
