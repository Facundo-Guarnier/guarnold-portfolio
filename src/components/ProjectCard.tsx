import React from "react";
import type { Project } from "../types";
import {
  FileText,
  Crosshair,
  Sparkles,
  FlaskConical,
  ArrowUpRight,
  Github,
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
  const githubLink = project.github_url;
  const safeTags = project.tags ?? [];
  const cardSize = (project.size ?? "small").toLowerCase();
  const isSmall = cardSize === "small";
  const isMedium = cardSize === "medium";
  const isTall = cardSize === "tall";
  const descriptionClampClass = isSmall ? "line-clamp-2" : "line-clamp-3";
  const visibleTags = safeTags.slice(0, isSmall ? 3 : isMedium ? 4 : 6);
  const imageSource = project.image_url ?? project.image;
  const [hasImage, setHasImage] = React.useState(Boolean(imageSource));

  React.useEffect(() => {
    setHasImage(Boolean(imageSource));
  }, [imageSource]);

  const openUrl = (url?: string) => {
    if (!url || url === "#") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Base transition and style classes for consistency
  const cardBaseClasses =
    "group relative flex flex-col h-full rounded-3xl bg-surface-variant transition-all duration-300 border border-outline/50 hover:border-primary no-underline overflow-hidden hover:shadow-xl hover:-translate-y-1";

  const imageHeightClass = isTall
    ? "h-56"
    : isSmall
      ? "h-32"
      : isMedium
        ? "h-36"
        : "h-44";

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      {githubLink && (
        <button
          type="button"
          aria-label="Ver repositorio en GitHub"
          onClick={(event) => {
            event.stopPropagation();
            openUrl(githubLink);
          }}
          className="p-2 transition-colors border rounded-full bg-surface/60 text-on-surface/70 hover:text-primary border-outline/10"
        >
          <Github size={16} />
        </button>
      )}

      <button
        type="button"
        aria-label="Abrir proyecto"
        onClick={(event) => {
          event.stopPropagation();
          openUrl(safeLink);
        }}
        className="p-2 transition-colors border rounded-full bg-surface/60 text-on-surface/70 hover:text-primary border-outline/10"
      >
        <ArrowUpRight size={16} />
      </button>
    </div>
  );

  const StatusChip = () =>
    project.status ? (
      <div className="absolute top-3 right-3 z-20 px-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm">
        <span className="text-[13px] uppercase font-bold tracking-wider">
          {project.status}
        </span>
      </div>
    ) : null;

  // Layout for projects without images (Abstract gradient + centered icon)
  if (!hasImage) {
    return (
      <article
        className={cardBaseClasses}
        role="button"
        tabIndex={0}
        onClick={() => openUrl(safeLink)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openUrl(safeLink);
          }
        }}
      >
        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-primary/5 group-hover:opacity-100" />

        <div
          className={`relative ${imageHeightClass} border-b border-outline/20 bg-gradient-to-br from-primary/20 via-surface to-primary/10`}
        >
          <StatusChip />
          <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_20%_20%,var(--md-sys-color-primary)_0,transparent_45%),radial-gradient(circle_at_80%_30%,var(--md-sys-color-secondary)_0,transparent_40%),radial-gradient(circle_at_50%_80%,var(--md-sys-color-tertiary)_0,transparent_40%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-12 h-12 border shadow-sm rounded-2xl bg-surface/85 text-primary border-outline/20 backdrop-blur-sm">
              <Icon size={30} />
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full p-5 md:p-6">
          <div className="relative z-10 flex items-start justify-end mb-4">
            <ActionButtons />
          </div>

          <div className="relative z-10 flex-1 min-h-0">
            <h3 className="mb-2 text-xl font-bold transition-colors text-on-surface group-hover:text-primary">
              {safeTitle}
            </h3>
            {safeDescription && (
              <p
                className={`text-sm text-on-surface-variant leading-relaxed mb-4 ${descriptionClampClass}`}
              >
                {safeDescription}
              </p>
            )}
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 pt-3 mt-auto border-t border-outline/10">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary-container text-on-secondary-container border border-outline/5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    );
  }

  // Layout for projects with images (Preview-focused)
  return (
    <article
      className={cardBaseClasses}
      role="button"
      tabIndex={0}
      onClick={() => openUrl(safeLink)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openUrl(safeLink);
        }
      }}
    >
      <div className={`relative overflow-hidden w-full ${imageHeightClass}`}>
        <StatusChip />
        {imageSource && (
          <img
            src={imageSource}
            alt={safeTitle}
            onError={() => setHasImage(false)}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-110"
          />
        )}
        {/* Darkening overlay for readability of status on light images */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-60" />
      </div>

      <div className="flex flex-col justify-between flex-1 p-6 bg-surface-variant">
        <div className="flex-1 min-h-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-bold transition-colors text-on-surface group-hover:text-primary">
              {safeTitle}
            </h3>
            <ActionButtons />
          </div>

          {safeDescription && (
            <p
              className={`text-sm text-on-surface-variant leading-relaxed mb-4 ${descriptionClampClass}`}
            >
              {safeDescription}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-3 mt-auto border-t border-outline/10">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary-container text-on-secondary-container border border-outline/5 truncate"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
