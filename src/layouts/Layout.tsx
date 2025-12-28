import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <Navbar />
      {/* Main content area - flex-1 pushes footer down, w-full allows full-width sections like Hero */}
      <main className="flex-1 w-full flex flex-col relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;