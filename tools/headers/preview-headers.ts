import type { Plugin } from "vite";
import { resolve } from "node:path";
// @ts-expect-error -- `.mjs` sin tipos: es el mismo parser que usa el verificador, a propósito.
import { leerHeaders } from "./headers.mjs";

/**
 * Hace que `vite preview` sirva las cabeceras de `public/_headers`.
 *
 * ## Por qué hace falta
 *
 * Esas cabeceras las aplica **Netlify**, ⊥ Vite ∴ en local ⊥ existen. Sin este plugin, la única
 * forma de saber si la CSP rompe la app es desplegarla — y una CSP mal puesta **⊥ falla en local
 * y sí en producción**, que es el peor modo de falla posible para un archivo de configuración.
 *
 * Acá el archivo es la única fuente de verdad: lo lee el verificador estático y lo lee esto. Si se
 * lo edita mal, las dos cosas se enteran.
 *
 * ## ⚠️ Por qué SOLO en `preview`, ⊥ en `dev`
 *
 * El dev server de Vite inyecta scripts inline para el HMR y abre un WebSocket a sí mismo ∴ un
 * `script-src 'self'` **rompe el desarrollo**. Sería la forma más rápida de que alguien borre esta
 * pieza. El `preview` sirve el build real, que es lo que se despliega.
 *
 * ∴ el camino autenticado ⊥ queda cubierto por esto (la suite E2E corre contra `dev`). Lo que sí
 * cubre: el shell público, las fuentes, los estilos y la conexión de auth. El resto lo cubre el
 * `curl -sI` de después del deploy. 🔗 `README.md` — dice qué queda sin cubrir en vez de dar a
 * entender que ⊥ queda nada.
 */
export function servirHeadersEnPreview(archivo = "public/_headers"): Plugin {
  return {
    name: "servir-headers-en-preview",
    // 🔴 `'serve'`, ⊥ `'preview'`: `apply` solo acepta `serve`/`build` y un valor invalido ⊥
    // avisa — Vite descarta el plugin en silencio. Medido: con `'preview'` el test daba
    // `Received: undefined` en la cabecera, o sea CERO CSP servida. Quien acota a preview es el
    // hook `configurePreviewServer`, ⊥ este campo.
    apply: "serve",
    configurePreviewServer(server) {
      const secciones = leerHeaders(resolve(process.cwd(), archivo)) as Record<
        string,
        Record<string, string>
      > | null;

      if (!secciones?.["/*"]) {
        // ⊥ es un `console.warn`: sin cabeceras, el test de CSP pasaría por ⊥ haber CSP que violar.
        // Un chequeo que ⊥ puede mirar ! frenar. 🔗 docs/principles/chequeos-que-mienten.md
        throw new Error(
          `[preview-headers] ⊥ pude leer una sección \`/*\` en ${archivo}. El preview serviría sin ` +
            `cabeceras y cualquier test sobre la CSP daría verde por ausencia de CSP.`,
        );
      }

      server.middlewares.use((req, res, next) => {
        for (const [cabecera, valor] of Object.entries(secciones["/*"])) {
          res.setHeader(cabecera, valor);
        }
        // Las secciones por ruta, para lo que aplique (p. ej. `/sw.js`).
        const ruta = (req.url ?? "").split("?")[0];
        for (const [patron, cabeceras] of Object.entries(secciones)) {
          if (patron === "/*" || patron !== ruta) continue;
          for (const [cabecera, valor] of Object.entries(cabeceras)) res.setHeader(cabecera, valor);
        }
        next();
      });
    },
  };
}
