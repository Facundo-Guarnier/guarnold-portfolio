import React, { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

interface Particle {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  size: number;
  colorIndex: 0 | 1 | 2; // primary, secondary, tertiary
}

const ParticleBackground: React.FC = () => {
  const { isDark } = useTheme();

  // Get theme colors from CSS variables
  const getThemeColor = (colorName: string) => {
    if (typeof window === "undefined") return "#3b82f6";
    const style = getComputedStyle(document.documentElement);
    return (
      style.getPropertyValue(`--md-sys-color-${colorName}`).trim() || "#3b82f6"
    );
  };

  // Color map for particles
  const colors = useMemo(
    () => [
      getThemeColor("primary"),
      getThemeColor("secondary"),
      getThemeColor("tertiary"),
    ],
    [isDark],
  );

  // Generate particles array - memoized to avoid recreation
  const particles = useMemo<Particle[]>(() => {
    const particleCount = 50;
    const result: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      result.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 20 + Math.random() * 15, // 20-35s
        delay: (i / particleCount) * 2, // Distribuido uniformemente: 0-2s
        size: 4 + Math.random() * 8, // 4-12px
        colorIndex: (i % 3) as 0 | 1 | 2,
      });
    }

    return result;
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base background glow */}
      <div
        className="absolute inset-0 transition-all duration-1000 opacity-20"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${colors[0]}22 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, ${colors[1]}22 0%, transparent 50%)`,
        }}
        aria-hidden="true"
      />

      {/* Particles container */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: colors[particle.colorIndex],
            boxShadow: `0 0 ${particle.size * 2}px ${colors[particle.colorIndex]}99`,
            animation: `float ${particle.duration}s linear ${particle.delay}s infinite`,
            opacity: 0.6,
          }}
          aria-hidden="true"
        />
      ))}

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.6;
          }
          100% {
            transform: translateY(-120vh) translateX(80px);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="animation: float"] {
            animation: none !important;
            opacity: 0.4 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleBackground;
