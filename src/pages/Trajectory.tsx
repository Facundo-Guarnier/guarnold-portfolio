import React, { useEffect, useState } from "react";
import { Briefcase, GraduationCap, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "../utils";
import { CardComponent } from "../components/CardComponent";
import { getExperience } from "../services/dataService";
import type { Experience } from "../types";

const TimelineItem: React.FC<{ item: Experience; isLast: boolean }> = ({
  item,
  isLast,
}) => {
  const formatDate = (date?: string | null) => {
    if (!date) return null;
    const [year, month] = date.split("-");
    if (!year) return null;
    return month ? `${month}/${year}` : year;
  };

  const startDate = item.start_date;
  const endDate = item.end_date;
  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);
  const sameYear = Boolean(
    startDate && endDate && startDate.split("-")[0] === endDate.split("-")[0],
  );

  const period = startLabel
    ? endLabel
      ? `${startLabel} - ${endLabel}${sameYear ? " · finalizado" : ""}`
      : `${startLabel} - Presente`
    : (endLabel ?? "Fecha no especificada");

  const isCompleted = Boolean(item.is_completed);
  const statusLabel = item.status;
  const title = item.role ?? item.title ?? "Sin título";
  const organization =
    item.company ?? item.institution ?? "Organización no especificada";

  return (
    <div className={cn("relative pl-8 md:pl-10", !isLast && "pb-12")}>
      <div className="absolute left-[-9px] top-[20px] z-10 ring-4 rounded-full ring-background bg-background">
        {isCompleted ? (
          <CheckCircle2 size={16} className="text-primary" />
        ) : (
          <div className="w-3 h-3 m-[2px] rounded-full border-2 bg-surface-variant border-outline" />
        )}
      </div>

      <CardComponent
        className={cn(
          "p-5 transition-all duration-300 md:p-6 hover:shadow-lg hover:border-primary/30 group",
          isCompleted && "border-primary/25 shadow-sm shadow-primary/10",
        )}
      >
        <div className="flex flex-col justify-between gap-3 mb-3 md:flex-row md:items-start">
          <div>
            <h3 className="text-lg font-bold transition-colors md:text-xl text-on-surface group-hover:text-primary">
              {title}
            </h3>
            <span className="text-sm font-semibold text-primary md:text-base">
              {organization}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-wider uppercase border rounded-full w-fit shrink-0 bg-surface-variant text-on-surface-variant border-outline/10">
              <Calendar size={12} />
              {period}
            </div>
            {statusLabel && (
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border w-fit shrink-0",
                  isCompleted
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-secondary/10 text-secondary border-secondary/20",
                )}
              >
                {statusLabel}
              </div>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {item.description}
          </p>
        )}

        {!!item.technologies?.length && (
          <div className="flex flex-wrap gap-2 mt-4">
            {item.technologies.map((technology) => (
              <span
                key={`${item.id}-${technology}`}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-variant/70 text-on-surface-variant border border-outline/10"
              >
                {technology}
              </span>
            ))}
          </div>
        )}
      </CardComponent>
    </div>
  );
};

const Trajectory: React.FC = () => {
  const [experience, setExperience] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperience = async () => {
      const data = await getExperience();
      setExperience(data);
      setLoading(false);
    };

    fetchExperience();
  }, []);

  const workExperience = experience.filter((item) => item.type === "work");
  const educationExperience = experience.filter(
    (item) => item.type === "education",
  );

  if (loading) {
    return (
      <div className="w-full duration-300 animate-in fade-in">
        <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8 md:py-16">
          <div className="w-64 h-12 mb-4 rounded-xl bg-surface-variant animate-pulse" />
          <div className="h-6 max-w-full mb-10 w-96 rounded-xl bg-surface-variant animate-pulse" />

          <div className="space-y-16">
            <section>
              <div className="h-10 max-w-full mb-10 w-80 rounded-xl bg-surface-variant animate-pulse" />
              <div className="ml-5 space-y-6 md:ml-6">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={`work-skeleton-${index}`}
                    className="h-36 rounded-3xl bg-surface-variant animate-pulse"
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="w-64 h-10 max-w-full mb-10 rounded-xl bg-surface-variant animate-pulse" />
              <div className="ml-5 space-y-6 md:ml-6">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={`edu-skeleton-${index}`}
                    className="h-36 rounded-3xl bg-surface-variant animate-pulse"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full duration-700 animate-in fade-in">
      <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 ">
        {/* Header - Fixed height so subtitle position is consistent */}
        <header className="max-w-3xl mb-6 h-28 md:h-32">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl text-on-surface">
            Trayectoria
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            Mi camino profesional y académico en detalle.
          </p>
        </header>

        {/* Sections Container */}
        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 pb-4 mb-10 border-b border-outline/10">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Briefcase size={24} />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl text-on-surface">
                Experiencia Profesional
              </h2>
            </div>

            <div className="pt-2 pb-2 ml-5 border-l-2 border-primary/20 md:ml-6">
              {workExperience.map((item, index) => (
                <TimelineItem
                  key={item.id ?? `work-${index}`}
                  item={item}
                  isLast={index === workExperience.length - 1}
                />
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section>
            <div className="flex items-center gap-3 pb-4 mb-10 border-b border-outline/10">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl text-on-surface">
                Educación
              </h2>
            </div>

            <div className="pt-2 pb-2 ml-5 border-l-2 border-primary/20 md:ml-6">
              {educationExperience.map((item, index) => (
                <TimelineItem
                  key={item.id ?? `education-${index}`}
                  item={item}
                  isLast={index === educationExperience.length - 1}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Trajectory;
