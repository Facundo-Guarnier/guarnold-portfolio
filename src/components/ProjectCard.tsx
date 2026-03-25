import React from "react";
import type { Project } from "../types";
import {
  FileText,
  Crosshair,
  Sparkles,
  FlaskConical,
  ArrowUpRight,
} from "lucide-react";

// Icon mapper for dynamic icons
const IconMap: Record<
  string,
  React.FC<{ size?: number; className?: string }>
> = {
  FileText,
  Crosshair,
  Sparkles,
  FlaskConical,
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const iconName = project.icon ?? "Sparkles";
  const Icon = IconMap[iconName] || Sparkles;
  const safeTitle = project.title ?? "Proyecto sin título";
  const safeDescription = project.description;
  const safeLink = project.link ?? "#";
  const safeTags = project.tags ?? [];
  const imageSource = project.image_url ?? project.image;
  const [hasImage, setHasImage] = React.useState(Boolean(imageSource));

  React.useEffect(() => {
    setHasImage(Boolean(imageSource));
  }, [imageSource]);

  // Base transition and style classes for consistency
  const cardBaseClasses =
    "group relative flex flex-col h-full rounded-3xl bg-surface-variant transition-all duration-300 border border-outline/50 hover:border-primary no-underline overflow-hidden hover:shadow-xl hover:-translate-y-1";

  const statusBadgeClasses =
    "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold tracking-wider shadow-lg z-20";

  // Layout for projects without images (Abstract gradient + centered icon)
  if (!hasImage) {
    return (
      <a
        href={safeLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cardBaseClasses}
      >
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative h-44 border-b border-outline/20 bg-gradient-to-br from-primary/20 via-surface to-primary/10">
          <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_20%,var(--md-sys-color-primary)_0,transparent_45%),radial-gradient(circle_at_80%_30%,var(--md-sys-color-secondary)_0,transparent_40%),radial-gradient(circle_at_50%_80%,var(--md-sys-color-tertiary)_0,transparent_40%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-surface/85 text-primary shadow-sm border border-outline/20 backdrop-blur-sm flex items-center justify-center">
              <Icon size={30} />
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col h-full justify-between">
          {/* Top section: Icon and Status */}
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div />

            <div className="flex items-center gap-2">
              {project.status && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {project.status}
                  </span>
                </div>
              )}

              <div className="p-2 rounded-full bg-surface/50 text-on-surface opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 border border-outline/10">
                <ArrowUpRight size={16} />
              </div>
            </div>
          </div>

          {/* Main content section */}
          <div className="relative z-10 flex-1">
            <h3 className="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
              {safeTitle}
            </h3>
            {safeDescription && (
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
                {safeDescription}
              </p>
            )}
          </div>

          {/* Footer tags */}
          <div className="relative z-10 flex flex-wrap gap-2">
            {safeTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary-container text-on-secondary-container border border-outline/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    );
  }

  // Layout for projects with images (Preview-focused)
  return (
    <a
      href={safeLink}
      target="_blank"
      rel="noopener noreferrer"
      className={cardBaseClasses}
    >
      <div
        className={`relative overflow-hidden w-full ${project.size === "tall" ? "h-64" : "h-48"}`}
      >
        {imageSource && (
          <img
            src={imageSource}
            alt={safeTitle}
            onError={() => setHasImage(false)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        )}
        {/* Darkening overlay for readability of status on light images */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-60" />

        {/* Glassmorphic Status Indicator */}
        {project.status && (
          <div className={statusBadgeClasses}>
            <span className="text-white">{project.status}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 justify-between bg-surface-variant">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
              {safeTitle}
            </h3>
            <ArrowUpRight
              size={20}
              className="text-on-surface-variant opacity-50 group-hover:opacity-100 group-hover:text-primary group-hover:-translate-y-0.5 transition-all duration-300"
            />
          </div>

          {safeDescription && (
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
              {safeDescription}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {safeTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary-container text-on-secondary-container border border-outline/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
