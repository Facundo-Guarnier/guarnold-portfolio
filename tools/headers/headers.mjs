import { readFileSync, existsSync } from "node:fs";

/**
 * Lee `public/_headers` (formato de Netlify) y devuelve `{ ruta: { cabecera: valor } }`.
 *
 * Una sola fuente de verdad, leída por dos consumidores: el verificador estático y el plugin que
 * hace que `vite preview` sirva **las mismas** cabeceras. Sin eso, lo que se testea en local y lo
 * que se despliega son dos cosas que se parecen.
 *
 * El formato es deliberadamente el más simple que existe: ruta en la columna 0, cabeceras
 * indentadas debajo, `#` para comentar. Parsearlo son 15 líneas y ⊥ hace falta una dependencia —
 * que es la mitad del motivo para ⊥ haber usado el `[[headers]]` de `netlify.toml`.
 */
export function leerHeaders(ruta) {
  if (!existsSync(ruta)) return null;

  const secciones = {};
  let actual = null;

  for (const cruda of readFileSync(ruta, "utf8").split("\n")) {
    const linea = cruda.replace(/\r$/, "");
    if (!linea.trim() || linea.trim().startsWith("#")) continue;

    if (!/^\s/.test(linea)) {
      actual = linea.trim();
      secciones[actual] ??= {};
      continue;
    }

    // Una cabecera indentada sin ruta arriba ⊥ se aplica a nada. Callarlo sería exactamente el
    // archivo que parece configurado y ⊥ configura.
    if (!actual) throw new Error(`_headers: cabecera sin ruta encima → ${linea.trim()}`);

    const corte = linea.indexOf(":");
    if (corte === -1) throw new Error(`_headers: línea sin \`:\` → ${linea.trim()}`);
    secciones[actual][linea.slice(0, corte).trim()] = linea.slice(corte + 1).trim();
  }

  return secciones;
}

/** Parte una CSP en `{ directiva: [valores] }`. */
export function partirCSP(csp) {
  const directivas = {};
  for (const bloque of csp.split(";")) {
    const partes = bloque.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) continue;
    directivas[partes[0]] = partes.slice(1);
  }
  return directivas;
}
