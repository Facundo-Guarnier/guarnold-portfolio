# Guarnold Portfolio

Portfolio personal profesional desarrollado con React + TypeScript + Vite, con enfoque Mobile-First y estética Material You.

## Descripción

Este proyecto muestra trayectoria, proyectos y presentación profesional en un sitio web liviano y moderno.

Características principales:

- UI basada en Material Design 3 (Material You).
- Theming dinámico (colores por semilla, modo claro/oscuro).
- Datos gestionados desde YAML local con patrón de servicios.
- Layouts tipo Bento Grid para home y portfolio.
- Navegación SPA con React Router (HashRouter).

## Stack tecnológico

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Material Color Utilities

## Requisitos previos

- Node.js 18 o superior (recomendado Node.js 20+)
- npm 9 o superior

## Instalación

1. Clonar el repositorio:

   `git clone https://github.com/Facundo-Guarnier/guarnold-portfolio.git`

2. Entrar al proyecto:

   `cd guarnold-portfolio`

3. Instalar dependencias:

   `npm install`

## Uso en desarrollo

Iniciar el servidor local:

`npm run dev`

Por defecto Vite publica en `http://localhost:3000` o el siguiente puerto libre.

## Build de producción

Generar build optimizada:

`npm run build`

Previsualizar build localmente:

`npm run preview`

## Estructura del proyecto (resumen)

- `src/pages`: páginas principales (`Home`, `Trajectory`, `Projects`).
- `src/components`: componentes reutilizables (cards, grid, navbar, etc.).
- `src/data/content.yml`: contenido principal del portfolio.
- `src/services/dataService.ts`: capa de acceso a datos.
- `src/context/ThemeContext.tsx`: lógica de tema dinámico.

## Personalización rápida

1. Editar contenido en `src/data/content.yml`.
2. Reemplazar assets en `public/assets` (logo, imágenes, mapa, etc.).
3. Ajustar estilos en componentes y tokens de tema según necesidad.

## Estado actual de datos

Actualmente el contenido se consume desde YAML local (modo desacoplado). La arquitectura está preparada para migrar a fuente remota (por ejemplo Supabase) sin reescribir la UI principal.

## Scripts disponibles

- `npm run dev`: entorno local con hot reload.
- `npm run build`: compilación de producción.
- `npm run preview`: preview local de la build.

## Licencia

Este proyecto se distribuye bajo licencia MIT.

Consulta el texto completo en [LICENSE](LICENSE).
