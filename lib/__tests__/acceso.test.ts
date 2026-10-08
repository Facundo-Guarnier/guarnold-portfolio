import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));

import { tengoAcceso } from '../acceso';

describe('tengoAcceso()', () => {
  beforeEach(() => rpc.mockReset());

  it('pregunta a tengo_acceso y devuelve true solo si la base dice true', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(tengoAcceso()).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('tengo_acceso');
  });

  it('false de la base ⊥ es un error: devuelve false', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(tengoAcceso()).resolves.toBe(false);
  });

  it('cualquier cosa que ⊥ sea exactamente true cuenta como sin acceso (falla cerrado)', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(tengoAcceso()).resolves.toBe(false);
  });

  it('un error de la base TIRA: ⊥ se confunde con «sin acceso»', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('red caída') });
    await expect(tengoAcceso()).rejects.toThrow('red caída');
  });
});
