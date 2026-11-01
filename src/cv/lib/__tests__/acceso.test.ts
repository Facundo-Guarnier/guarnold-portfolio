import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));

import { estadoEditor } from '../acceso';

describe('estadoEditor()', () => {
  beforeEach(() => rpc.mockReset());

  it('pregunta a estado_editor y devuelve si cuando la base dice si', async () => {
    rpc.mockResolvedValue({ data: 'si', error: null });
    await expect(estadoEditor()).resolves.toBe('si');
    expect(rpc).toHaveBeenCalledWith('estado_editor');
  });

  it('sin_2fa y sin_acceso ⊥ son errores: se devuelven tal cual', async () => {
    rpc.mockResolvedValue({ data: 'sin_2fa', error: null });
    await expect(estadoEditor()).resolves.toBe('sin_2fa');
    rpc.mockResolvedValue({ data: 'sin_acceso', error: null });
    await expect(estadoEditor()).resolves.toBe('sin_acceso');
  });

  it('cualquier respuesta desconocida cuenta como sin acceso (falla cerrado)', async () => {
    for (const data of [null, true, 'SI', 'otra']) {
      rpc.mockResolvedValue({ data, error: null });
      await expect(estadoEditor()).resolves.toBe('sin_acceso');
    }
  });

  it('un error de la base TIRA: ⊥ se confunde con «sin acceso»', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('red caída') });
    await expect(estadoEditor()).rejects.toThrow('red caída');
  });
});
