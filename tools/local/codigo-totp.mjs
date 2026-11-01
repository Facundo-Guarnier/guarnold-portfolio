#!/usr/bin/env node
/**
 * Código TOTP de la cuenta CON acceso del stack local (secreto fijo de entorno.mjs): escribir el CV
 * exige aal2. Lo usan los tests de integración y el E2E; a mano: `npm run totp:local`.
 * RFC 6238, SHA-1, 6 dígitos, paso de 30 s. Mismo helper que guarnold-id.
 */
import { createHmac } from 'node:crypto';
import { SECRETO_TOTP_LOCAL, USUARIO_CON_ACCESO } from './entorno.mjs';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ABytes(secreto) {
  let bits = '';
  for (const c of secreto.replace(/=+$/, '').toUpperCase()) {
    const v = ALFABETO.indexOf(c);
    if (v < 0) throw new Error(`base32 inválido: ${c}`);
    bits += v.toString(2).padStart(5, '0');
  }
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
}

/** Código TOTP para el instante `t` (ms desde epoch). */
export function totp(secreto = SECRETO_TOTP_LOCAL, t = Date.now()) {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(t / 1000 / 30)));
  const h = createHmac('sha1', base32ABytes(secreto)).update(contador).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

// Solo al ejecutarlo directo (no al importar `totp`).
if (process.argv[1]?.replace(/\\/g, '/').endsWith('/codigo-totp.mjs')) {
  const ahora = Date.now();
  const restan = 30 - (Math.floor(ahora / 1000) % 30);
  console.log(`${USUARIO_CON_ACCESO.email}  código TOTP: ${totp(SECRETO_TOTP_LOCAL, ahora)}  (vence en ${restan} s)`);
}
