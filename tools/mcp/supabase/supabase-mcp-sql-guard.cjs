'use strict'

/**
 * Guard SQL del wrapper MCP: decide si un `execute_sql` lleva DDL (siempre prohibido:
 * el schema se cambia por migracion) o escritura (prohibida solo en el server de PROD).
 *
 * ## Por que esto no es un regex suelto
 *
 * La version anterior que CORRIA en el wrapper era:
 *
 *   /^(CREATE|ALTER|DROP|TRUNCATE|RENAME|GRANT|REVOKE|COMMENT)\b/i.test(cleanQuery)
 *
 * y se saltaba con cuatro cosas triviales, porque el `^` mira UNA sola vez el principio
 * de TODO el texto:
 *
 *   select 1; drop table guarnote.projects;        -> arranca con `select`
 *   ; drop table guarnote.projects;                -> arranca con `;`
 *   do $$ begin execute 'drop table x'; end $$;    -> `DO` ⊥ estaba en la lista
 *   select * into guarnote.robado from projects;   -> DDL efectivo que arranca con `select`
 *
 * La version "estricta" que vivia en este archivo tenia el problema opuesto: patrones SIN
 * anclar (`/\bcreate\b/i`) que bloquean `select * from t where titulo = 'create algo'`.
 * Un guard con falsos positivos se termina desactivando, que es como este quedo muerto.
 *
 * ∴ el unico camino correcto es **entender la sentencia**, ⊥ buscar palabras:
 *
 *   1. Neutralizar lo que ⊥ es codigo (comentarios, literales, identificadores citados,
 *      bloques dollar-quoted). Un `--` adentro de un literal ⊥ es un comentario, y una
 *      palabra clave adentro de un literal ⊥ es una palabra clave.
 *   2. Partir en sentencias por `;` — recien AHORA es seguro, porque los `;` que quedan
 *      ⊥ pueden estar adentro de un literal ni de un bloque.
 *   3. Mirar el verbo inicial de CADA sentencia.
 *
 * El paso 1 es un escaner de a un caracter y ⊥ una pila de regex a proposito: el orden
 * entre comentarios y literales ⊥ se puede resolver con regex independientes (cual gana
 * depende de cual aparece primero en el texto, ⊥ de cual regex corras antes).
 *
 * ⚠️ Esto es 2da capa. La 1ra —y la que de verdad garantiza— es `--read-only` de Postgres
 * en el server de prod. Pero hoy ese server ⊥ arranca (le falta `SUPABASE_PROD_REF`) y el
 * de escritura apunta a la base viva ∴ por ahora este guard es la unica capa que hay.
 * 🔗 `docs/auditoria-seguridad-2026-09.md` §D3.
 */

/**
 * Devuelve el SQL con comentarios, literales, identificadores citados y bloques
 * dollar-quoted reemplazados por relleno inocuo, conservando las posiciones de los `;`.
 */
function neutralizar(sql) {
  const s = String(sql).replace(/^﻿/, '')
  let salida = ''
  let i = 0

  while (i < s.length) {
    const par = s.slice(i, i + 2)

    // Comentario de linea: se come hasta el fin de linea.
    if (par === '--') {
      while (i < s.length && s[i] !== '\n') i += 1
      salida += ' '
      continue
    }

    // Comentario de bloque. En Postgres ANIDAN ∴ se lleva profundidad; con un
    // `indexOf('*/')` un `/* /* */ drop table x */` dejaba el `drop` afuera del comentario.
    if (par === '/*') {
      let profundidad = 1
      i += 2
      while (i < s.length && profundidad > 0) {
        if (s.slice(i, i + 2) === '/*') {
          profundidad += 1
          i += 2
        } else if (s.slice(i, i + 2) === '*/') {
          profundidad -= 1
          i += 2
        } else {
          i += 1
        }
      }
      salida += ' '
      continue
    }

    // Literal de texto. `''` adentro es una comilla escapada, ⊥ el cierre.
    if (s[i] === "'") {
      i += 1
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") {
          i += 2
          continue
        }
        if (s[i] === "'") {
          i += 1
          break
        }
        i += 1
      }
      salida += " 'lit' "
      continue
    }

    // Identificador citado: "mi tabla". Mismo criterio con `""`.
    if (s[i] === '"') {
      i += 1
      while (i < s.length) {
        if (s[i] === '"' && s[i + 1] === '"') {
          i += 2
          continue
        }
        if (s[i] === '"') {
          i += 1
          break
        }
        i += 1
      }
      salida += ' ident '
      continue
    }

    // Dollar quoting: $$...$$ o $tag$...$tag$. Adentro puede haber CUALQUIER cosa,
    // incluidas comillas sin cerrar y `;` — por eso se saltea entero.
    if (s[i] === '$') {
      const apertura = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i))
      if (apertura) {
        const etiqueta = apertura[0]
        const cierre = s.indexOf(etiqueta, i + etiqueta.length)
        i = cierre === -1 ? s.length : cierre + etiqueta.length
        salida += ' $cuerpo$ '
        continue
      }
    }

    salida += s[i]
    i += 1
  }

  return salida
}

/** Parte en sentencias. Solo es seguro sobre la salida de `neutralizar`. */
function sentenciasDe(sql) {
  return neutralizar(sql)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Verbos que cambian la estructura. Se miran ANCLADOS al inicio de cada sentencia. */
const DDL_INICIAL =
  /^(create|alter|drop|truncate|rename|grant|revoke|comment|reassign|cluster|refresh|import|vacuum|analyze)\b/i

/** `DO` corre SQL dinamico ∴ puede esconder cualquier DDL adentro del bloque. */
const BLOQUE_DO = /^do\b/i

/**
 * `SELECT ... INTO tabla` CREA una tabla: es DDL disfrazado de consulta.
 * `INSERT INTO` ⊥ matchea porque arranca con `insert`, ⊥ con `select`/`with`.
 */
const SELECT_INTO = /^(?:select|with)\b[\s\S]*\binto\b/i

/** Verbos que ESCRIBEN datos. Prohibidos solo en el server de prod (`--read-only`). */
const ESCRITURA_INICIAL = /^(insert|update|delete|merge|copy|call|set\s+role|set\s+session)\b/i

/** CTE que envuelve una escritura: `with x as (delete ... returning *) select ...`. */
const CTE_ESCRITURA = /^with\b[\s\S]*\b(insert|update|delete)\b/i

function recorte(sentencia) {
  return sentencia.length > 120 ? `${sentencia.slice(0, 120)}...` : sentencia
}

/**
 * ¿Alguna sentencia cambia la ESTRUCTURA? Se evalua sentencia por sentencia, asi que
 * `select 1; drop table x` cae por la segunda.
 */
function detectarDDL(query) {
  if (typeof query !== 'string') return { bloqueado: false }

  for (const sentencia of sentenciasDe(query)) {
    if (BLOQUE_DO.test(sentencia)) {
      return { bloqueado: true, razon: 'DO', sentencia: recorte(sentencia) }
    }
    const ddl = DDL_INICIAL.exec(sentencia)
    if (ddl) {
      return { bloqueado: true, razon: ddl[1].toUpperCase(), sentencia: recorte(sentencia) }
    }
    if (SELECT_INTO.test(sentencia)) {
      return { bloqueado: true, razon: 'SELECT INTO', sentencia: recorte(sentencia) }
    }
  }

  return { bloqueado: false }
}

/** ¿Alguna sentencia ESCRIBE (datos o estructura)? Incluye todo lo de `detectarDDL`. */
function detectarEscritura(query) {
  if (typeof query !== 'string') return { bloqueado: false }

  const ddl = detectarDDL(query)
  if (ddl.bloqueado) return ddl

  for (const sentencia of sentenciasDe(query)) {
    const escritura = ESCRITURA_INICIAL.exec(sentencia)
    if (escritura) {
      return {
        bloqueado: true,
        razon: escritura[1].toUpperCase().replace(/\s+/g, ' '),
        sentencia: recorte(sentencia),
      }
    }
    if (CTE_ESCRITURA.test(sentencia)) {
      return { bloqueado: true, razon: 'CTE con escritura', sentencia: recorte(sentencia) }
    }
  }

  return { bloqueado: false }
}

function buildSchemaChangeError(reason) {
  return [
    `Consulta bloqueada: se detectó un intento de cambio de estructura (${reason}).`,
    'Los cambios de schema solo se permiten mediante migraciones.',
    'Usá la herramienta apply_migration para aplicar el cambio.',
    'El SQL va en supabase/migrations-draft/<desc>.sql: el timestamp lo asigna el servidor al aplicar.',
  ].join(' ')
}

/**
 * Compat con el wrapper legacy (`supabase-mcp-wrapper(funcionaba con codex).cjs`), que
 * ⊥ lo lanza ninguna config pero sigue importando este nombre. Reimplementado sobre el
 * analizador nuevo ∴ ya ⊥ tiene los falsos positivos de la version vieja.
 */
function analyzeSqlQuery(query) {
  const ddl = detectarDDL(query)
  return ddl.bloqueado ? { allowed: false, reason: ddl.razon } : { allowed: true }
}

module.exports = {
  neutralizar,
  sentenciasDe,
  detectarDDL,
  detectarEscritura,
  buildSchemaChangeError,
  analyzeSqlQuery,
}
