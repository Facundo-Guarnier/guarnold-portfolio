# Guarnold — portfolio, CV y editor

El sitio personal de Facundo Guarnier en una sola aplicación. Tiene tres partes:

- **Portfolio** (`/`): presentación, trayectoria y proyectos, con estética Material You y tema
  de colores por semilla (claro y oscuro).
- **CV público** (`/cv`): el currículum en formato A4, listo para imprimir o descargar en PDF.
- **Editor del CV** (`/admin`): donde se edita el perfil. Se entra con la cuenta central de Guarnold ID
  cuando el sitio se sirve desde `guarnold.com.ar`, o con un login propio en `/login` en cualquier otro lado.

Los datos del portfolio salen de Supabase (lo que se marca como «Portfolio» en el editor). Si la base no
responde o no está configurada, el portfolio usa `src/data/content.yml`, que es también el archivo que el
editor puede importar.

## Stack

- React 19, TypeScript y Vite
- Tailwind CSS compilado en el build (sin CDN)
- Supabase (base compartida, con acceso por aplicación)
- React Router con rutas reales (`BrowserRouter`)
- Vitest para unitarios, Playwright para E2E

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Para el stack local de base de datos: Docker y el CLI de Supabase

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev          # http://localhost:3001 (base compartida de guarnold-id, `.env.development`: NUNCA prod)
npm run dev:cuenta   # igual, con Guarnold ID local (localhost:5170): ver AGENTS.md
npm run dev:docker   # http://localhost:5177 (stack local propio de este repo, `.env.docker.local`)
```

Para trabajar contra una base local hace falta levantar el stack primero:

```bash
npm run db:local          # levanta Supabase en Docker y aplica las migraciones
npm run db:local:parar    # lo apaga
```

`db:local` escribe `.env.docker.local`, que es la configuración del modo `docker`. Las cuentas de
prueba de la base local están en `AGENTS.md`.

## Pruebas

```bash
npm run typecheck          # TypeScript sin emitir archivos
npm test                   # unitarios: portfolio, CV y herramientas (no necesita Docker)
npm run test:sql           # pruebas SQL sobre el stack local
npm run test:integracion   # PostgREST y RLS sobre el stack local
npm run test:e2e           # Playwright: portfolio (puerto 3001) y CV (puerto 5177)
npm run verificar:headers  # revisa la Content-Security-Policy de public/_headers
```

Los E2E del CV necesitan el stack local (`npm run db:local`). Los del portfolio no: usan una base falsa.

## Build y publicación

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ con las cabeceras de public/_headers
```

El sitio se publica en Netlify. Las cabeceras de seguridad están en `public/_headers` y el SPA fallback en
`public/_redirects`. Los cambios de base de datos viajan por la CI de Supabase (`.github/workflows/desplegar-supabase.yml`),
al mergear a `main`. Ver `docs/guides/despliegue-supabase.md`.

## Estructura

```
src/                 portfolio (páginas, componentes, tema)
src/cv/              CV: página pública, editor, hooks, lógica y tipos
src/lib/             cliente Supabase único, sesión de Guarnold ID y enlaces viejos
src/data/            content.yml, el respaldo del portfolio
supabase/            migraciones, configuración del stack local y pruebas SQL
tools/               despliegue, cabeceras, stack local y servidor MCP
tests/               integración y fixtures
e2e/                 pruebas de navegador
```

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Portfolio |
| `/trajectory`, `/projects` | Secciones del portfolio |
| `/cv` | CV público |
| `/admin` | Editor del CV (`/editor` es un alias) |
| `/login` | Login propio del editor, fuera de `guarnold.com.ar` |

Los enlaces del portfolio con formato `#/projects` (la versión anterior, con hash) se redirigen solos a la
ruta nueva.

## Más detalle

`AGENTS.md` tiene las reglas del proyecto (acceso por aplicación, sesión central, CSP y el flujo de trabajo).
