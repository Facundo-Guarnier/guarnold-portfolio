import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "../types";
import ProjectCard from "./ProjectCard";

interface BentoGridProps {
  projects?: Project[];
}

const BentoGrid: React.FC<BentoGridProps> = ({ projects = [] }) => {
  const [columnCount, setColumnCount] = useState(1);

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

  useEffect(() => {
    const resolveColumns = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setColumnCount(1);
        return;
      }

      if (width < 1024) {
        setColumnCount(2);
        return;
      }

      setColumnCount(3);
    };

    resolveColumns();
    window.addEventListener("resize", resolveColumns);

    return () => {
      window.removeEventListener("resize", resolveColumns);
    };
  }, []);

  const columns = useMemo(() => {
    const distributedColumns = Array.from(
      { length: columnCount },
      () => [] as Project[],
    );

    projects.forEach((project, index) => {
      distributedColumns[index % columnCount].push(project);
    });

    return distributedColumns;
  }, [projects, columnCount]);

  if (!projects.length) {
    return (
      <div className="rounded-3xl border border-outline/30 bg-surface-variant/60 p-8 text-center text-on-surface-variant">
        Próximamente más proyectos...
      </div>
    );
  }

  return (
    <div className="flex w-full gap-6 items-start pb-10">
      {columns.map((column, columnIndex) => (
        <div
          key={`column-${columnIndex}`}
          className="flex flex-col gap-6 flex-1"
        >
          {column.map((project, projectIndex) => (
            <div
              key={
                project.id ?? `${project.title ?? "project"}-${projectIndex}`
              }
              className={getSizeClasses(project.size)}
            >
              <ProjectCard
                project={{ ...project, size: normalizeSize(project.size) }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;
