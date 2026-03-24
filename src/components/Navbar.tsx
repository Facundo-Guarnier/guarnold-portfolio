import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Github, Linkedin, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils";

const Navbar: React.FC = () => {
  const { isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Trayectoria", path: "/trajectory" },
    { name: "Portfolio", path: "/projects" },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full px-4 transition-all duration-300 border-b",
        isScrolled
          ? cn(
              "backdrop-blur-md shadow-sm py-2",
              isDark
                ? "bg-black/70 border-white/10"
                : "bg-white/70 border-black/5",
            )
          : cn(
              "backdrop-blur-sm py-4 border-transparent",
              isDark ? "bg-black/60" : "bg-white/60",
            ),
      )}
    >
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-on-surface group shrink-0"
        >
          <div
            className={cn(
              "p-1.5 rounded-xl bg-surface border border-outline/20 shadow-sm transition-transform group-hover:scale-105",
            )}
          >
            <img
              src="/assets/g_icon.png"
              alt="Guarnold"
              className="w-6 h-6 rounded-md"
            />
          </div>
          <span className="hidden transition-colors group-hover:text-primary xs:inline">
            Guarnold.
          </span>
        </Link>

        <div className="items-center hidden gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant",
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 pr-2 mr-1">
            <a
              href="https://github.com/faguarnier"
              target="_blank"
              rel="noreferrer"
              className="p-2 transition-all rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-variant/30"
            >
              <Github size={20} />
            </a>
            <a
              href="https://linkedin.com/in/faguarnier"
              target="_blank"
              rel="noreferrer"
              className="p-2 transition-all rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-variant/30"
            >
              <Linkedin size={20} />
            </a>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 transition-colors rounded-full md:hidden hover:bg-surface-variant/50 text-on-surface-variant"
            aria-label="Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={cn(
            "md:hidden top-full left-0 w-full p-4 space-y-4 animate-in slide-in-from-top-4 duration-200 shadow-xl",
          )}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block text-lg font-medium transition-colors",
                  isActive ? "text-primary" : "text-on-surface-variant",
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
