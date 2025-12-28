import React from 'react';
import { Download, ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToProjects = () => {
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative flex flex-col items-center justify-center text-center py-24 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-background" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl" />

      <div className="space-y-6 max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Top Badge */}
        <span className="inline-block px-4 py-1.5 rounded-full bg-surface-variant border border-outline/20 text-sm font-medium text-primary tracking-wide uppercase">
          Developer & Maker
        </span>
        
        <div className="space-y-2">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface tracking-tight leading-tight">
            Hola, soy Facundo Guarnier.
          </h1>
          
          {/* Sub-Headline / Nickname */}
          <p className="text-xl md:text-2xl text-on-surface-variant font-medium italic opacity-80">
            Aunque mis amigos me dicen <span className="text-primary font-bold not-italic">Guarnold</span>, un gusto!
          </p>
        </div>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed pt-2">
          Soy un desarrollador apasionado por crear herramientas útiles, interfaces intuitivas y experiencias visuales únicas que viven en internet.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
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