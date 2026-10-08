/**
 * El portfolio usaba `HashRouter`: sus enlaces viejos son `…/#/projects`. Ahora la app usa rutas
 * reales (`BrowserRouter`), así que `index.tsx` reescribe el hash a su ruta antes de montar.
 *
 * Devuelve la ruta destino, o `null` si el hash ⊥ es una ruta vieja (`#seccion`, vacío, etc.).
 */
export const rutaDesdeHashLegado = (hash: string): string | null => {
  if (!hash.startsWith('#/')) return null;
  const ruta = hash.slice(1);
  // Solo rutas internas: un hash `#//evil.com` ⊥ es una ruta (⊥ se sigue como URL externa).
  return ruta.startsWith('//') ? null : ruta;
};
