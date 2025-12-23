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
 * - VITE_BRAND_NAME: Brand name (Guarnold)
 * - VITE_BRAND_URL: Brand website URL
 * - VITE_REPO_URL: Repository URL
 * 
 * Usage:
 * - <BrandFooter /> - Full version with auto dark mode detection
 * - <BrandFooter compact /> - Single line version
 * - <BrandFooter dark /> - Force dark mode (useful if parent doesn't have 'dark' class)
 */

import React from 'react';
import { Github, Globe } from 'lucide-react';

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
  className = '', 
  compact = false,
  forceDark = false 
}) => {
  // Read from environment variables with fallbacks
  const appName = import.meta.env.VITE_APP_NAME || 'Guarnold App';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const brandName = import.meta.env.VITE_BRAND_NAME || 'Guarnold';
  const brandUrl = import.meta.env.VITE_BRAND_URL || 'https://guarnold.com.ar';
  const brandSignature = import.meta.env.VITE_BRAND_SIGNATURE || '';
  const repoUrl = import.meta.env.VITE_REPO_URL || '';

  // Base wrapper for forced dark mode
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => 
    forceDark ? <div className="dark">{children}</div> : <>{children}</>;

  // Signature component - subtle and elegant
  const Signature = () => brandSignature ? (
    <img 
      src={brandSignature} 
      alt={brandName}
      className="h-10 sm:h-12 w-auto -my-2 opacity-40 hover:opacity-70 transition-opacity dark:invert dark:opacity-30 dark:hover:opacity-60"
    />
  ) : null;

  if (compact) {
    return (
      <Wrapper>
        <footer className={`
          py-4 px-6 border-t print:hidden transition-colors
          bg-neutral-100 border-neutral-200
          dark:bg-neutral-900 dark:border-neutral-800
          ${className}
        `}>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            {/* App Name with Badge */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {appName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white text-neutral-500 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                v{appVersion}
              </span>
            </div>
            
            <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
            
            {/* Brand Link - Main Hub */}
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
              <span className="hidden sm:inline">Más proyectos en</span>
              <strong>{brandName}</strong>
            </a>
            
            {/* Repo Link */}
            {repoUrl && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600 hidden sm:inline">|</span>
                <a 
                  href={repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-2 transition-colors
                    text-neutral-600 hover:text-neutral-900
                    dark:text-neutral-400 dark:hover:text-white
                  "
                  title="Ver código fuente en GitHub"
                >
                  <Github className="w-4 h-4" />
                  <span>Código</span>
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
      <footer className={`
        py-5 px-6 border-t print:hidden transition-colors
        bg-neutral-100 border-neutral-200
        dark:bg-neutral-900 dark:border-neutral-800
        ${className}
      `}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
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
              <span>Más proyectos en <strong>{brandName}</strong></span>
            </a>
            
            {repoUrl && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">|</span>
                <a 
                  href={repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-2 transition-colors
                    text-neutral-600 hover:text-neutral-900
                    dark:text-neutral-400 dark:hover:text-white
                  "
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
