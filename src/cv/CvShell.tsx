import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BrandFooter } from '@/cv/components/ui/BrandFooter';
import './cv.css';

/**
 * Envoltorio de todas las rutas del CV (`/cv`, `/admin`, `/editor`, `/login`).
 *
 * Marca `<body>` con `cv-activo` mientras se ve el CV: los estilos globales de impresión y de fondo
 * de `cv.css` solo aplican ahí, así el portfolio ⊥ los hereda.
 */
const CvShell: React.FC = () => {
  useEffect(() => {
    document.body.classList.add('cv-activo');
    return () => document.body.classList.remove('cv-activo');
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <BrandFooter compact />
    </div>
  );
};

export default CvShell;
