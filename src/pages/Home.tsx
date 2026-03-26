import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  MapPin,
  Linkedin,
  Github,
  Terminal,
  Code2,
  Box,
  Cpu,
  LayoutGrid,
  Smartphone,
  Database,
  ArrowDown,
  Download,
} from "lucide-react";
import { CardComponent } from "../components/CardComponent";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils";
import { getHomeContent } from "../services/dataService";
import type { HomeContent } from "../types";

const Home: React.FC = () => {
  const { isDark } = useTheme();
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeContent = async () => {
      const data = await getHomeContent();
      setHomeContent(data);
      setLoading(false);
    };

    fetchHomeContent();
  }, []);

  const scrollToProjects = () => {
    const grid = document.getElementById("projects-grid");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth" });
    }
  };

  const stackIconMap: Record<
    string,
    React.FC<{ size?: number; className?: string }>
  > = {
    code: Code2,
    layout: LayoutGrid,
    smartphone: Smartphone,
    database: Database,
    terminal: Terminal,
    cpu: Cpu,
    box: Box,
  };

  const technologies = useMemo(() => {
    return (homeContent?.stack?.technologies ?? []).map((tech) => {
      const iconKey = (tech.icon ?? "terminal").toLowerCase();
      const Icon = stackIconMap[iconKey] ?? Terminal;
      return {
        name: tech.name,
        Icon,
      };
    });
  }, [homeContent?.stack?.technologies]);

  const homeCardBaseClasses = cn(
    "rounded-3xl border shadow-md transition-transform duration-300",
    isDark
      ? "bg-surface border-outline/40"
      : "bg-surface-variant border-outline/25",
  );

  if (loading) {
    return (
      <div className="w-full duration-300 animate-in fade-in">
        <section className="relative flex flex-col items-center justify-center pt-20 pb-14 overflow-hidden text-center md:pt-24 md:pb-16">
          <div className="w-full max-w-4xl px-4 space-y-6">
            <div className="w-40 h-8 mx-auto rounded-full bg-surface-variant animate-pulse" />
            <div className="w-full max-w-2xl mx-auto h-14 rounded-2xl bg-surface-variant animate-pulse" />
            <div className="w-full max-w-xl mx-auto h-7 rounded-xl bg-surface-variant animate-pulse" />
            <div className="w-full h-5 max-w-2xl mx-auto rounded-xl bg-surface-variant animate-pulse" />
          </div>
        </section>

        <section className="px-4 pt-8 pb-12 mx-auto max-w-7xl sm:px-6 lg:px-8 md:pt-10 md:pb-14 scroll-mt-20">
          <div className="w-56 h-10 mb-10 rounded-xl bg-surface-variant animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
            <div className="md:col-span-2 h-80 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="md:col-start-3 md:row-start-1 md:row-span-2 h-[28rem] rounded-3xl bg-surface-variant animate-pulse" />
            <div className="h-56 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="h-48 md:col-span-2 rounded-3xl bg-surface-variant animate-pulse" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full duration-500 animate-in fade-in">
      <section className="relative flex flex-col items-center justify-center pt-20 pb-14 overflow-hidden text-center md:pt-24 md:pb-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-background" />
        <div className="absolute w-64 h-64 rounded-full top-1/4 left-1/4 bg-secondary/10 blur-3xl" />
        <div className="absolute w-64 h-64 rounded-full bottom-1/4 right-1/4 bg-tertiary/10 blur-3xl" />

        <div className="max-w-4xl px-4 space-y-6 duration-700 animate-in fade-in slide-in-from-bottom-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-surface-variant border border-outline/20 text-sm font-medium text-primary tracking-wide uppercase">
            Developer & Maker
          </span>

          <div className="space-y-2">
            {homeContent?.hero?.title && (
              <h1 className="text-5xl font-extrabold leading-tight tracking-tighter md:text-6xl text-on-surface text-balance">
                {homeContent.hero.title}
              </h1>
            )}

            {homeContent?.hero?.subtitle && (
              <p className="text-lg italic font-medium md:text-xl text-on-surface-variant opacity-85">
                {homeContent.hero.subtitle.split("Guarnold")[0]}
                {homeContent.hero.subtitle.includes("Guarnold") && (
                  <span className="font-bold text-primary">Guarnold</span>
                )}
                {homeContent.hero.subtitle.split("Guarnold")[1]}
              </p>
            )}
          </div>

          {homeContent?.hero?.description && (
            <p className="max-w-2xl pt-2 mx-auto text-lg leading-relaxed md:text-xl text-on-surface-variant">
              {homeContent.hero.description}
            </p>
          )}

          <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
            <button
              onClick={scrollToProjects}
              className="px-8 py-3.5 rounded-full bg-primary text-on-primary font-bold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Ver Proyectos
              <ArrowDown size={18} />
            </button>

            <a
              href="https://cv.guarnold.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border border-outline text-on-surface font-medium hover:bg-surface-variant/50 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              Descargar CV
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 pb-12 mx-auto max-w-7xl sm:px-6 lg:px-8 md:pt-10 md:pb-14 scroll-mt-20">
        <div className="flex items-center justify-between pb-4 mb-10 border-b border-outline/10">
          <h2 className="flex items-center gap-3 text-3xl font-bold text-on-surface">
            <span className="w-2 h-8 rounded-full bg-primary"></span>
            Sobre Mí
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
          <CardComponent
            className={cn(
              homeCardBaseClasses,
              "flex flex-col justify-center p-8 md:col-span-2 hover:-translate-y-1",
            )}
          >
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="flex items-center justify-center w-40 h-40 overflow-hidden border-2 rounded-3xl bg-primary/20 shrink-0 border-primary/30">
                {homeContent?.identity?.avatar_url ? (
                  <img
                    src={homeContent.identity.avatar_url}
                    alt={homeContent.identity?.name ?? "Avatar"}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User size={80} className="opacity-50 text-primary" />
                )}
              </div>

              <div className="space-y-4 text-center md:text-left">
                <div>
                  {homeContent?.about_card?.title && (
                    <h3 className="text-3xl font-bold text-on-surface">
                      {homeContent.about_card.title}
                    </h3>
                  )}
                  {homeContent?.about_card?.role && (
                    <p className="font-medium text-primary">
                      {homeContent.about_card.role}
                    </p>
                  )}
                </div>
                {homeContent?.about_card?.description && (
                  <p className="leading-relaxed text-on-surface-variant">
                    {homeContent.about_card.description}
                  </p>
                )}
              </div>
            </div>
          </CardComponent>

          <CardComponent
            className={cn(
              homeCardBaseClasses,
              "md:col-start-3 md:row-start-1 md:row-span-2 md:col-span-1 p-0 overflow-hidden group relative min-h-[28rem] hover:-translate-y-1",
            )}
          >
            <img
              src={
                homeContent?.location?.background_image ??
                "/assets/mapa_argentina.png"
              }
              alt="Mapa de Argentina"
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="relative z-20 flex flex-col justify-end h-full p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 shadow-lg rounded-xl bg-primary text-on-primary group-hover:animate-bounce">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">
                    {homeContent?.location?.city}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {homeContent?.location?.country}
                  </p>
                </div>
              </div>
            </div>
          </CardComponent>

          <CardComponent
            className={cn(
              homeCardBaseClasses,
              "p-8 space-y-6 md:col-span-1 md:col-start-1 md:row-start-2 hover:-translate-y-1",
            )}
          >
            <h3 className="flex items-center gap-2 text-xl font-bold text-on-surface">
              <Terminal size={20} className="text-primary" />
              {homeContent?.stack?.title}
            </h3>
            {homeContent?.stack?.description && (
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {homeContent.stack.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <span
                  key={tech.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold border border-primary/10 transition-transform hover:scale-105"
                >
                  <tech.Icon size={14} />
                  {tech.name}
                </span>
              ))}
            </div>
          </CardComponent>

          <CardComponent
            className={cn(
              homeCardBaseClasses,
              "p-6 md:col-span-1 md:col-start-2 md:row-start-2 flex flex-col justify-between gap-4 hover:-translate-y-1",
            )}
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-on-surface">Redes</h3>
              <p className="text-sm text-on-surface-variant">Conectemos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
              {homeContent?.social?.linkedin && (
                <a
                  href={homeContent.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition-all"
                >
                  <Linkedin size={18} />
                  LinkedIn
                </a>
              )}

              {homeContent?.social?.github && (
                <a
                  href={homeContent.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition-all"
                >
                  <Github size={18} />
                  GitHub
                </a>
              )}
            </div>
          </CardComponent>
        </div>
      </section>
    </div>
  );
};

export default Home;
