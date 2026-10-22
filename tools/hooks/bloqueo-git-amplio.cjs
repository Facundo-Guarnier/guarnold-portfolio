#!/usr/bin/env node
/**
 * Hook PreToolUse (matcher Bash): bloquea `git add -A`, `git add .`, `git add --all`
 * y `git commit -a` / `-am` / `--all`.
 *
 * Por que: en el mismo repo trabajan varios agentes a la vez. Un `git add -A` se lleva
 * cambios que no son tuyos. Lo correcto es nombrar archivos (pathspec).
 *
 * Multiplataforma: Node puro, sin bash ni python. Bloquea con exit 2 + mensaje en stderr.
 * Es una red de seguridad, no un parser de shell completo: cubre los casos del flujo normal.
 */
'use strict'

const { leerEntrada } = require('./entrada-hook.cjs')

/** Separa un comando en segmentos simples (por &&, ||, ;, | y saltos de linea). */
function segmentos(comando) {
  return String(comando).split(/&&|\|\||;|\||\r?\n/)
}

/** Tokeniza respetando comillas simples y dobles. */
function tokens(segmento) {
  const salida = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m
  while ((m = re.exec(segmento))) {
    salida.push(m[1] ?? m[2] ?? m[3])
  }
  return salida
}

/** Devuelve { sub, args } si el segmento es un `git <sub> ...`; si no, null. */
function subcomandoGit(toks) {
  if (toks[0] !== 'git') return null
  let i = 1
  while (i < toks.length && toks[i].startsWith('-')) {
    // Opciones globales con valor: -C <ruta>, -c <clave=valor>
    i += toks[i] === '-C' || toks[i] === '-c' ? 2 : 1
  }
  if (i >= toks.length) return null
  return { sub: toks[i], args: toks.slice(i + 1) }
}

/** Flags cortos agrupados que contienen la letra `letra` (ej. -A, -vA, -am). */
function tieneFlagCorto(args, letra) {
  const re = new RegExp(`^-[a-zA-Z]*${letra}[a-zA-Z]*$`)
  return args.some((a) => re.test(a))
}

/**
 * Devuelve null si el comando no es amplio, o { motivo } si lo es.
 */
function analizarComando(comando) {
  if (typeof comando !== 'string') return null
  for (const seg of segmentos(comando)) {
    const g = subcomandoGit(tokens(seg))
    if (!g) continue

    if (g.sub === 'add') {
      const amplio =
        g.args.some((a) => ['--all', '.', './', '*', ':/'].includes(a)) ||
        tieneFlagCorto(g.args, 'A')
      if (amplio) return { motivo: 'git add -A / git add . (incluye cambios de otros agentes)' }
    }

    if (g.sub === 'commit') {
      const amplio = g.args.includes('--all') || tieneFlagCorto(g.args, 'a')
      if (amplio) return { motivo: 'git commit -a (incluye todos los cambios trackeados)' }
    }
  }
  return null
}

const MENSAJE =
  'Bloqueado por tools/hooks/bloqueo-git-amplio.cjs: {motivo}.\n' +
  'Commitea con pathspec, nombrando SOLO tus archivos:\n' +
  '  git commit -m "..." -- <archivos>\n' +
  'Antes revisa: git diff --cached --name-only'

function main() {
  const entrada = leerEntrada()
  if (!entrada || entrada.tool_name !== 'Bash') process.exit(0)
  const res = analizarComando(entrada.tool_input && entrada.tool_input.command)
  if (!res) process.exit(0)
  process.stderr.write(MENSAJE.replace('{motivo}', res.motivo) + '\n')
  process.exit(2)
}

if (require.main === module) main()
module.exports = { analizarComando, tokens, segmentos }
