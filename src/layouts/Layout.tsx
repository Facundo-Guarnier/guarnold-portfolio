import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrandFooter from "../components/BrandFooter";
import FloatingThemeToggle from "../components/FloatingThemeToggle";
import ParticleBackground from "../components/ParticleBackground";

const Layout: React.FC = () => {
  return (
    <div className="relative flex flex-col min-h-screen transition-colors duration-300 bg-background">
      <ParticleBackground />
      <Navbar />
      {/* Main content area - flex-1 pushes footer down, w-full allows full-width sections like Hero */}
      <main className="relative flex flex-col flex-1 w-full z-10">
        <Outlet />
      </main>
      <BrandFooter compact />
      <FloatingThemeToggle />
    </div>
  );
};

export default Layout;
