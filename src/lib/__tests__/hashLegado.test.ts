import { describe, expect, it } from 'vitest';
import { rutaDesdeHashLegado } from '@/lib/hashLegado';

describe('rutaDesdeHashLegado (enlaces viejos del HashRouter)', () => {
  it.each([
    ['#/projects', '/projects'],
    ['#/trajectory', '/trajectory'],
    ['#/', '/'],
    ['#/cv', '/cv'],
  ])('%s → %s', (hash, ruta) => {
    expect(rutaDesdeHashLegado(hash)).toBe(ruta);
  });

  it.each(['', '#seccion', '#', '#//evil.example.com', 'https://guarnold.com.ar/#/x'])(
    'no toca %j',
    (hash) => {
      expect(rutaDesdeHashLegado(hash)).toBeNull();
    },
  );
});
