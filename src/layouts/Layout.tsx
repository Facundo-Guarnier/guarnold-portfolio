import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import BrandFooter from "../components/BrandFooter";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 bg-background">
      <Navbar />
      {/* Main content area - flex-1 pushes footer down, w-full allows full-width sections like Hero */}
      <main className="relative flex flex-col flex-1 w-full">
        <Outlet />
      </main>
      <BrandFooter compact />
    </div>
  );
};

export default Layout;
