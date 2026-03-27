/**
 * BrandFooter - Reusable footer component for all Guarnold projects
 *
 * Displays branding with app name, version, and links to:
 * - Brand website (guarnold.com.ar) - Main hub for all projects
 * - Repository
 *
 * Configuration via package.json:
 * - screenName: Application name
 * - version: Application version
 * - gitURL: Repository URL
 *
 * Usage:
 * - <BrandFooter /> - Full version with auto dark mode detection
 * - <BrandFooter compact /> - Single line version
 * - <BrandFooter forceDark /> - Force dark mode (useful if parent doesn't have 'dark' class)
 */

import React from "react";
import { Github, Globe } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import pkgJson from "../../package.json";

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
  // Read from package.json with fallbacks
  const appName = pkgJson.screenName || "Guarnold Portfolio";
  const appVersion = pkgJson.version || "0.0.0";
  const brandName = "Guarnold";
  const brandUrl = "https://guarnold.com.ar";
  const repoUrl =
    pkgJson.gitURL || "https://github.com/faguarnier/guarnold-portfolio";

  // Signature - hardcoded path (won't change)
  const brandSignature = "/assets/guarnold_firma.png";

  // Get theme state from context
  const { isDark } = useTheme();

  // Base wrapper for forced dark mode
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    forceDark ? <div className="dark">{children}</div> : <>{children}</>;

  // Signature component - subtle and elegant
  const Signature = () => (
    <img
      src={brandSignature}
      alt={brandName}
      className={`h-8 sm:h-10 md:h-12 w-auto -my-1 sm:-my-2 transition-opacity ${
        isDark
          ? "invert opacity-30 hover:opacity-60"
          : "opacity-40 hover:opacity-70"
      }`}
    />
  );

  if (compact) {
    return (
      <Wrapper>
        <footer
          className={`
          py-3 px-4 border-t print:hidden transition-colors
          bg-surface/50 backdrop-blur-sm border-outline/10
          ${className}
        `}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:gap-4 md:text-sm">
            {/* App Name with Badge */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="font-semibold text-on-surface text-[10px] md:text-sm hidden sm:inline">
                {appName}
              </span>
              <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-mono font-medium bg-primary-container text-on-primary-container border border-outline/10">
                v{appVersion}
              </span>
            </div>

            <span className="hidden text-outline/30 md:inline">|</span>

            {/* Brand Link - Main Hub */}
            <a
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-lg transition-all font-medium text-[10px] sm:text-xs md:text-sm
                border border-outline/20
                ${
                  isDark
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                }
              `}
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              <span className="hidden lg:inline">Más proyectos en</span>
              <span className="lg:hidden">By</span>
              <strong>{brandName}</strong>
            </a>

            {/* Repo Link */}
            {repoUrl && (
              <>
                <span className="hidden text-outline/30 md:inline">|</span>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-1.5 transition-colors p-1 sm:p-1.5 md:p-0
                    text-on-surface-variant hover:text-primary
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
        bg-surface/50 backdrop-blur-sm border-outline/10
        ${className}
      `}
      >
        <div className="flex flex-col items-center justify-between gap-4 mx-auto text-sm max-w-7xl sm:flex-row">
          {/* App Info */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-on-surface">{appName}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary-container text-on-primary-container border border-outline/10">
              v{appVersion}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href={brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-medium
                border border-outline/20
                ${
                  isDark
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "bg-white text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                }
              `}
            >
              <Globe className="w-4 h-4" />
              <span>
                Más proyectos en <strong>{brandName}</strong>
              </span>
            </a>

            {repoUrl && (
              <>
                <span className="text-outline/30">|</span>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors text-on-surface-variant hover:text-primary"
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
