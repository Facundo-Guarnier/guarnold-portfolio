import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Guarnold ID se prende por DOMINIO, ⊥ por una variable: servido desde `*.guarnold.com.ar` →
 * login central; cualquier otro host (local, CI, preview) → login propio.
 */
describe('modo central según el dominio', () => {
  const original = window.location;
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: original, configurable: true });
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const conHost = async (host: string) => {
    vi.stubEnv('VITE_CUENTA_URL', undefined);
    vi.resetModules();
    Object.defineProperty(window, 'location', {
      value: new URL(`https://${host}/`),
      configurable: true,
    });
    return (await import('../sesionCentral')).sesionCentral;
  };

  it('en producción (*.guarnold.com.ar) usa Guarnold ID', async () => {
    expect(await conHost('cv.guarnold.com.ar')).not.toBeNull();
  });

  it.each(['localhost', 'cv-abc.netlify.app', 'guarnold.com.ar.evil.com', 'evilguarnold.com.ar'])(
    'en %s ⊥ (login propio)',
    async (host) => {
      expect(await conHost(host)).toBeNull();
    }
  );

  it("VITE_CUENTA_URL='' lo apaga aunque el dominio sea de producción", async () => {
    vi.resetModules();
    vi.stubEnv('VITE_CUENTA_URL', '');
    Object.defineProperty(window, 'location', {
      value: new URL('https://cv.guarnold.com.ar/'),
      configurable: true,
    });
    expect((await import('../sesionCentral')).sesionCentral).toBeNull();
  });
});
