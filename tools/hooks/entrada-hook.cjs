'use strict'

/**
 * Lee el payload JSON que Claude Code manda por stdin a los hooks.
 * Devuelve el objeto, o null si no hay payload o no es JSON (en ese caso el hook no opina).
 */
const fs = require('node:fs')

function leerEntrada() {
  try {
    const texto = fs.readFileSync(0, 'utf8')
    if (!texto.trim()) return null
    return JSON.parse(texto)
  } catch {
    return null
  }
}

module.exports = { leerEntrada }
