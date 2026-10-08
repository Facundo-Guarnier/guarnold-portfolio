/**
 * BrandFooter - Reusable footer component for all Guarnold projects
 *
 * Displays branding with app name, version, and links to:
 * - Brand website (guarnold.com.ar) - Main hub for all projects
 * - Repository
 *
 * Configuration via environment variables:
 * - VITE_APP_NAME: Application name
 * - VITE_APP_VERSION: Application version
 * - VITE_BRAND_URL: Brand website URL
 * - VITE_REPO_URL: Repository URL
 *
 * Usage:
 * - <BrandFooter /> - Full version with auto dark mode detection
 * - <BrandFooter compact /> - Single line version
 * - <BrandFooter forceDark /> - Force dark mode (useful if parent doesn't have 'dark' class)
 */

import React from "react";
import { Github, Globe } from "lucide-react";

interface BrandFooterProps {
  /** Additional CSS classes */
  className?: string;
  /** Show in compact mode (single line) */
  compact?: boolean;
  /**
   * Force dark mode variant.
   * If not set, uses Tailwind's dark: classes for automatic detection.
   * Set to true if parent doesn't have 'dark' class but you want dark styling.
   */
  forceDark?: boolean;
}

export const BrandFooter: React.FC<BrandFooterProps> = ({
  className = "",
  compact = false,
  forceDark = false,
}) => {
  // Read from environment variables with fallbacks
  const appName = import.meta.env.VITE_APP_NAME || "Guarnold App";
  const appVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const brandName = "Guarnold";
  const brandUrl = import.meta.env.VITE_BRAND_URL || "https://guarnold.com.ar";
  const brandSignature = "assets/guarnold_firma.png";
  const repoUrl = import.meta.env.VITE_REPO_URL || "";

  // Base wrapper for forced dark mode
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    forceDark ? <div className="dark">{children}</div> : <>{children}</>;

  // Signature component - subtle and elegant
  const Signature = () =>
    brandSignature ? (
      <img
        src={brandSignature}
        alt={brandName}
        className="w-auto h-8 -my-1 transition-opacity sm:h-10 md:h-12 sm:-my-2 opacity-40 hover:opacity-70 dark:invert dark:opacity-30 dark:hover:opacity-60"
      />
    ) : null;

  if (compact) {
    return (
      <Wrapper>
        <footer
          className={`
          py-3 px-4 border-t print:hidden transition-colors
          bg-neutral-100 border-neutral-200
          dark:bg-neutral-900 dark:border-neutral-800
          ${className}
        `}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:gap-4 md:text-sm">
            {/* App Name with Badge */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-[10px] md:text-sm hidden sm:inline">
                {appName}
              </span>
              <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-mono font-medium bg-white text-neutral-500 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                v{appVersion}
              </span>
            </div>

            <span className="hidden text-neutral-300 dark:text-neutral-600 md:inline">
              |
            </span>

            {/* Brand Link - Main Hub */}
            <a
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-lg transition-all font-medium text-[10px] sm:text-xs md:text-sm
                bg-white text-neutral-700 border border-neutral-200 
                hover:bg-neutral-200 hover:text-neutral-900
                dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700
                dark:hover:bg-neutral-700 dark:hover:text-white
              "
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              <span className="hidden lg:inline">Más proyectos en</span>
              <span className="lg:hidden">By</span>
              <strong>{brandName}</strong>
            </a>

            {/* Repo Link */}
            {repoUrl && (
              <>
                <span className="hidden text-neutral-300 dark:text-neutral-600 md:inline">
                  |
                </span>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-1.5 transition-colors p-1 sm:p-1.5 md:p-0
                    text-neutral-600 hover:text-neutral-900
                    dark:text-neutral-400 dark:hover:text-white
                  "
                  title="Ver código fuente en GitHub"
                >
                  <Github className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="hidden md:inline">Código</span>
                </a>
              </>
            )}

            {/* Signature - Subtle branding */}
            <Signature />
          </div>
        </footer>
      </Wrapper>
    );
  }

  // Full version (non-compact)
  return (
    <Wrapper>
      <footer
        className={`
        py-5 px-6 border-t print:hidden transition-colors
        bg-neutral-100 border-neutral-200
        dark:bg-neutral-900 dark:border-neutral-800
        ${className}
      `}
      >
        <div className="flex flex-col items-center justify-between gap-4 mx-auto text-sm max-w-7xl sm:flex-row">
          {/* App Info */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {appName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white text-neutral-500 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
              v{appVersion}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-medium
                bg-white text-neutral-700 border border-neutral-200 
                hover:bg-neutral-200 hover:text-neutral-900
                dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700
                dark:hover:bg-neutral-700 dark:hover:text-white
              "
            >
              <Globe className="w-4 h-4" />
              <span>
                Más proyectos en <strong>{brandName}</strong>
              </span>
            </a>

            {repoUrl && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">
                  |
                </span>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  title="Ver código fuente en GitHub"
                >
                  <Github className="w-4 h-4" />
                  <span>Repositorio</span>
                </a>
              </>
            )}

            {/* Signature - Subtle branding */}
            <Signature />
          </div>
        </div>
      </footer>
    </Wrapper>
  );
};

export default BrandFooter;
