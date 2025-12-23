/**
 * BrandFooter - Reusable footer component for all Guarnold projects
 * 
 * Displays subtle branding with app name, version, and links to:
 * - Brand website (guarnold.com.ar)
 * - Repository
 * 
 * Configuration via environment variables:
 * - VITE_APP_NAME: Application name
 * - VITE_APP_VERSION: Application version
 * - VITE_BRAND_NAME: Brand name (Guarnold)
 * - VITE_BRAND_URL: Brand website URL
 * - VITE_REPO_URL: Repository URL
 */

import React from 'react';
import { Github, Globe } from 'lucide-react';

interface BrandFooterProps {
  /** Additional CSS classes */
  className?: string;
  /** Show in compact mode (single line) */
  compact?: boolean;
  /** Dark mode variant */
  dark?: boolean;
}

export const BrandFooter: React.FC<BrandFooterProps> = ({ 
  className = '', 
  compact = false,
  dark = false 
}) => {
  // Read from environment variables with fallbacks
  const appName = import.meta.env.VITE_APP_NAME || 'Guarnold App';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const brandName = import.meta.env.VITE_BRAND_NAME || 'Guarnold';
  const brandUrl = import.meta.env.VITE_BRAND_URL || 'https://guarnold.com.ar';
  const repoUrl = import.meta.env.VITE_REPO_URL || '';

  const baseTextClass = dark 
    ? 'text-neutral-500 hover:text-neutral-300' 
    : 'text-neutral-400 hover:text-neutral-600';
  
  const dividerClass = dark ? 'text-neutral-700' : 'text-neutral-300';

  if (compact) {
    return (
      <footer className={`py-2 px-4 print:hidden ${className}`}>
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className={dark ? 'text-neutral-600' : 'text-neutral-400'}>
            {appName} v{appVersion}
          </span>
          <span className={dividerClass}>•</span>
          <a 
            href={brandUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`transition-colors ${baseTextClass}`}
          >
            {brandName}
          </a>
          {repoUrl && (
            <>
              <span className={dividerClass}>•</span>
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`transition-colors ${baseTextClass}`}
                title="Ver código fuente"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer className={`py-4 px-6 print:hidden ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* App Info */}
        <div className={`flex items-center gap-2 ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>
          <span className="font-medium">{appName}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${dark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-500'}`}>
            v{appVersion}
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <a 
            href={brandUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 transition-colors ${baseTextClass}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{brandName}</span>
          </a>
          
          {repoUrl && (
            <a 
              href={repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 transition-colors ${baseTextClass}`}
              title="Ver código fuente"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Repositorio</span>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default BrandFooter;
