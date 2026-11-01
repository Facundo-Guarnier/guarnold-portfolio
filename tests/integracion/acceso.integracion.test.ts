import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { leerStack, USUARIO_CON_ACCESO, USUARIO_SIN_ACCESO } from '../../tools/local/entorno.mjs';
import { totp } from '../../tools/local/codigo-totp.mjs';

/**
 * Contra el stack LOCAL (PostgREST real, con las policies reales): lo que la app promete a nivel de
 * red, ⊥ solo a nivel de SQL. Las pruebas SQL (`npm run test:sql`) ya cubren la lógica; esto cubre
 * que supabase-js, con el esquema `cv-formatter` y los tokens de cada cuenta, obtenga lo mismo.
 *
 *   npm run test:integracion      (requiere `npm run db:local`)
 */

const stack = leerStack();

const nuevoCliente = () =>
  createClient(stack.apiUrl, stack.anonKey, {
    db: { schema: 'cv-formatter' },
    auth: { persistSession: false, autoRefreshToken: false },
  });

type Cliente = ReturnType<typeof nuevoCliente>;

async function conCuenta(usuario: { email: string; clave: string }): Promise<Cliente> {
  const c = nuevoCliente();
  const { error } = await c.auth.signInWithPassword({ email: usuario.email, password: usuario.clave });
  if (error) throw new Error(`No pude loguear a ${usuario.email}: ${error.message}`);
  return c;
}

/** Sesión aal2: contraseña + código TOTP (escribir el CV lo exige). */
async function conCuentaY2FA(usuario: { email: string; clave: string }): Promise<Cliente> {
  const c = await conCuenta(usuario);
  const { data, error } = await c.auth.mfa.listFactors();
  const factor = data?.totp.find((f) => f.status === 'verified');
  if (error || !factor) throw new Error(`${usuario.email} ⊥ tiene factor TOTP. Corré npm run db:local`);
  const v = await c.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp() });
  if (v.error) throw new Error(`Código TOTP rechazado: ${v.error.message}`);
  return c;
}

const anon = nuevoCliente();
let perfilId = '';
let nombreOriginal = '';

beforeAll(async () => {
  const { data, error } = await anon.from('profiles').select('id, nombre').limit(1).single();
  if (error || !data) throw new Error(`Sin perfil en el stack local: ${error?.message ?? 'vacío'}. Corré npm run db:local`);
  perfilId = data.id;
  nombreOriginal = data.nombre ?? '';
});

describe('anon (visitante del CV público)', () => {
  it('puede ejecutar portfolio_publico() y recibe la forma de content.yml', async () => {
    const { data, error } = await anon.rpc('portfolio_publico');
    expect(error).toBeNull();
    expect(data).toMatchObject({ identity: expect.any(Object), experience: expect.any(Array), projects: expect.any(Array) });
  });

  it('portfolio_publico() ⊥ expone email ni teléfono por defecto', async () => {
    const { data } = await anon.rpc('portfolio_publico');
    expect(data.identity.email).toBeUndefined();
    expect(data.identity.phone).toBeUndefined();
  });

  it('⊥ puede editar el perfil: la policy filtra y el UPDATE toca 0 filas', async () => {
    const { data, error } = await anon.from('profiles').update({ nombre: 'anon-intruso' }).eq('id', perfilId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('⊥ puede insertar ítems del perfil (RLS lo rechaza)', async () => {
    const { error } = await anon.from('perfil_items').insert({ profile_id: perfilId, tipo: 'idioma', texto: 'anon' });
    expect(error).not.toBeNull();
  });

  it('⊥ puede llamar tengo_acceso() (es UX de cuentas logueadas)', async () => {
    const { error } = await anon.rpc('tengo_acceso');
    expect(error).not.toBeNull();
  });
});

describe('cuenta CON acceso a cv-formatter, con 2FA (aal2)', () => {
  let cuenta: Cliente;
  beforeAll(async () => {
    cuenta = await conCuentaY2FA(USUARIO_CON_ACCESO);
  });

  it('tengo_acceso() es true y estado_editor() es si', async () => {
    const { data, error } = await cuenta.rpc('tengo_acceso');
    expect(error).toBeNull();
    expect(data).toBe(true);
    const estado = await cuenta.rpc('estado_editor');
    expect(estado.error).toBeNull();
    expect(estado.data).toBe('si');
  });

  it('puede editar el perfil', async () => {
    const { data, error } = await cuenta.from('profiles').update({ nombre: 'Prueba integración' }).eq('id', perfilId).select();
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    await cuenta.from('profiles').update({ nombre: nombreOriginal }).eq('id', perfilId);
  });

  it('puede escribir perfil_items y el ítem sale en portfolio_publico() solo si en_portfolio', async () => {
    const { data: insertado, error } = await cuenta
      .from('perfil_items')
      .insert({ profile_id: perfilId, tipo: 'fortaleza', texto: 'Prueba de integración', en_cv: false, en_portfolio: false })
      .select('id')
      .single();
    expect(error).toBeNull();
    const id = insertado!.id as string;
    try {
      const antes = await anon.rpc('portfolio_publico');
      expect(antes.data.strengths?.items ?? []).not.toContain('Prueba de integración');

      await cuenta.from('perfil_items').update({ en_portfolio: true }).eq('id', id);
      const despues = await anon.rpc('portfolio_publico');
      expect(despues.data.strengths.items).toContain('Prueba de integración');
    } finally {
      await cuenta.from('perfil_items').delete().eq('id', id);
    }
  });
});

describe('cuenta CON acceso a cv-formatter, solo contraseña (aal1)', () => {
  let cuenta: Cliente;
  beforeAll(async () => {
    cuenta = await conCuenta(USUARIO_CON_ACCESO);
  });

  it('estado_editor() es sin_2fa', async () => {
    const { data, error } = await cuenta.rpc('estado_editor');
    expect(error).toBeNull();
    expect(data).toBe('sin_2fa');
  });

  it('⊥ puede editar el perfil: el UPDATE toca 0 filas', async () => {
    const { data, error } = await cuenta.from('profiles').update({ nombre: 'aal1-intruso' }).eq('id', perfilId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('⊥ puede insertar perfil_items (RLS lo rechaza)', async () => {
    const { error } = await cuenta.from('perfil_items').insert({ profile_id: perfilId, tipo: 'idioma', texto: 'aal1' });
    expect(error).not.toBeNull();
  });
});

describe('cuenta SIN acceso a cv-formatter (tiene login, ⊥ la app)', () => {
  let cuenta: Cliente;
  beforeAll(async () => {
    cuenta = await conCuenta(USUARIO_SIN_ACCESO);
  });

  it('tengo_acceso() es false', async () => {
    const { data, error } = await cuenta.rpc('tengo_acceso');
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it('⊥ puede editar el perfil: el UPDATE toca 0 filas', async () => {
    const { data, error } = await cuenta.from('profiles').update({ nombre: 'sin-acceso' }).eq('id', perfilId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('⊥ puede insertar perfil_items (RLS lo rechaza)', async () => {
    const { error } = await cuenta.from('perfil_items').insert({ profile_id: perfilId, tipo: 'idioma', texto: 'intruso' });
    expect(error).not.toBeNull();
  });

  it('⊥ puede borrar links ni experiencias ajenas', async () => {
    const { data, error } = await cuenta.from('experiences').delete().eq('profile_id', perfilId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

afterAll(async () => {
  // Por si algún test dejó el nombre cambiado.
  const admin = await conCuentaY2FA(USUARIO_CON_ACCESO);
  await admin.from('profiles').update({ nombre: nombreOriginal }).eq('id', perfilId);
});
