import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 border-t border-outline/10 mt-auto bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-on-surface-variant">
          © {new Date().getFullYear()} Guarnold. Built with <span className="text-primary font-medium">React</span> & <span className="text-primary font-medium">Material You</span>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;