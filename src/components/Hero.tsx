import React from "react";
import { Download, ArrowDown } from "lucide-react";
import type { Profile } from "../types";

interface HeroProps {
  profile?: Profile | null;
}

const Hero: React.FC<HeroProps> = ({ profile }) => {
  const scrollToProjects = () => {
    const grid = document.getElementById("projects-grid");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative flex flex-col items-center justify-center py-24 overflow-hidden text-center md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-background" />
      <div className="absolute w-64 h-64 rounded-full top-1/4 left-1/4 bg-secondary/10 blur-3xl" />
      <div className="absolute w-64 h-64 rounded-full bottom-1/4 right-1/4 bg-tertiary/10 blur-3xl" />

      <div className="max-w-4xl px-4 space-y-6 duration-700 animate-in fade-in slide-in-from-bottom-8">
        {/* Top Badge */}
        <span className="inline-block px-4 py-1.5 rounded-full bg-surface-variant border border-outline/20 text-sm font-medium text-primary tracking-wide uppercase">
          Developer & Maker
        </span>

        <div className="space-y-2">
          {/* Main Headline */}
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl text-on-surface">
            Hola, soy {profile?.name ?? "Facundo Guarnier"}.
          </h1>

          {/* Sub-Headline / Nickname */}
          {profile?.role && (
            <p className="text-xl italic font-medium md:text-2xl text-on-surface-variant opacity-80">
              {profile.role}
            </p>
          )}
        </div>

        {/* Description */}
        {profile?.bio && (
          <p className="max-w-2xl pt-2 mx-auto text-lg leading-relaxed md:text-xl text-on-surface-variant">
            {profile.bio}
          </p>
        )}

        {/* Buttons */}
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
  );
};

export default Hero;
