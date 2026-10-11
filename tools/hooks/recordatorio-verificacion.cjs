#!/usr/bin/env node
/**
 * Hook Stop: si la sesion modifico codigo (.ts/.tsx/.js/.mjs/.cjs/.jsx) y no corrio
 * verificacion (tests / typecheck / lint / build) DESPUES de la ultima modificacion,
 * le pide al agente que la corra antes de terminar.
 *
 * Anti-bucle: si `stop_hook_active` es true, ya se pidio una vez en este turno, y se
 * deja terminar. Nunca bloquea dos veces seguidas.
 *
 * Fail-open: si no se puede leer el transcript, no opina.
 *
 * Advertencia: depende del formato del transcript JSONL, que no es un contrato documentado.
 * Por eso es un recordatorio, no una garantia: la garantia la dan el implementador y el verificador.
 */
'use strict'

const fs = require('node:fs')
const { leerEntrada } = require('./entrada-hook.cjs')

const RE_CODIGO = /\.(ts|tsx|js|mjs|cjs|jsx)$/i
const EDICION = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const RE_VERIFICA =
  /\b(vitest|tsc|typecheck|eslint|lint|playwright)\b|npm (run )?(test|lint|build)|npx (vitest|tsc|eslint)/

/** Devuelve { ultimaEdicion, ultimaVerificacion } (indices de linea; -1 si no hubo). */
function indices(lineasJsonl) {
  let ultimaEdicion = -1
  let ultimaVerificacion = -1
  lineasJsonl.forEach((linea, i) => {
    let obj
    try {
      obj = JSON.parse(linea)
    } catch {
      return
    }
    const contenido = obj && obj.message && Array.isArray(obj.message.content) ? obj.message.content : []
    for (const item of contenido) {
      if (!item || item.type !== 'tool_use') continue
      const input = item.input || {}
      if (EDICION.has(item.name) && RE_CODIGO.test(String(input.file_path || ''))) {
        ultimaEdicion = i
      }
      if (item.name === 'Bash' && RE_VERIFICA.test(String(input.command || ''))) {
        ultimaVerificacion = i
      }
    }
  })
  return { ultimaEdicion, ultimaVerificacion }
}

/** Hay que pedir verificacion? */
function necesitaVerificar(lineasJsonl) {
  const { ultimaEdicion, ultimaVerificacion } = indices(lineasJsonl)
  return ultimaEdicion !== -1 && ultimaEdicion > ultimaVerificacion
}

const MENSAJE =
  'Antes de terminar: modificaste codigo (.ts/.tsx/.js/.mjs) y no corriste tests ni typecheck despues del ultimo cambio. ' +
  'Corre la verificacion del repo (typecheck, tests de lo tocado; lint si aplica) y reporta la salida real.'

function main() {
  const entrada = leerEntrada()
  if (!entrada || entrada.stop_hook_active) process.exit(0)
  let texto
  try {
    texto = fs.readFileSync(entrada.transcript_path, 'utf8')
  } catch {
    process.exit(0)
  }
  if (!necesitaVerificar(texto.split(/\r?\n/).filter(Boolean))) process.exit(0)
  process.stdout.write(JSON.stringify({ decision: 'block', reason: MENSAJE }) + '\n')
  process.exit(0)
}

if (require.main === module) main()
module.exports = { necesitaVerificar, indices }
