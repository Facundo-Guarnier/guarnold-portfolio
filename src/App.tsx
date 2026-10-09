import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import Trajectory from './pages/Trajectory';
import Projects from './pages/Projects';

// El CV (y el editor, con su SDK de Supabase y sus formularios) se baja solo cuando se entra a su ruta:
// el portfolio ⊥ paga ese peso.
const CvShell = lazy(() => import('./cv/CvShell'));
const CvHome = lazy(() => import('./cv/pages/Home'));
const Admin = lazy(() => import('./cv/pages/Admin'));
const Login = lazy(() => import('./cv/pages/Login'));

/**
 * Una sola app, tres superficies:
 *
 * - `/`, `/trajectory`, `/projects`: el portfolio (Material You, `ThemeContext`).
 * - `/cv`: el CV público. `/admin` (y `/editor`) el editor; `/login` el login propio.
 *   Todo lo del CV va bajo `CvShell`, que pone su propio fondo y la clase `cv-activo` en `<body>`.
 */
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="trajectory" element={<Trajectory />} />
            <Route path="projects" element={<Projects />} />
          </Route>

          <Route element={<CvShell />}>
            <Route path="/cv" element={<CvHome />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/editor" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Rutas desconocidas → portfolio. Los enlaces viejos `#/…` se reescriben antes (index.tsx). */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
