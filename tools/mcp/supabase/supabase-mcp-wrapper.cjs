#!/usr/bin/env node

/**
 * Wrapper Generico para Supabase MCP Server.
 * Flujo de migraciones: borrador -> aplicar -> renombre automatico.
 * Ver setup en: tools/mcp/supabase/README.md
 */

// Version DE ESTE WRAPPER (no la del servidor MCP, que es MCP_SERVER_VERSION abajo).
// Subila cuando cambies este archivo, para poder comparar copias entre repos sin hashear.
const WRAPPER_VERSION = '2.4.0'

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const {
  detectarDDL,
  detectarEscritura,
  buildSchemaChangeError,
} = require('./supabase-mcp-sql-guard.cjs')

// ─────────────────────────────────────────────────────────────────────────────
// MODO: `--mode=prod` -> apunta a PRODUCCION, y SOLO LECTURA. Sin flag -> dev.
//
// Decide TRES cosas: cual PROJECT_REF se usa, si se pasa `--read-only` al server
// oficial, y si se podan las tools de escritura.
//
// ! La garantia real la da `--read-only`: el backend corre el SQL en una
//   transaccion read-only de POSTGRES, asi que un UPDATE lo rechaza el MOTOR
//   (ERROR 25006). Los chequeos de este wrapper son 2da capa: adelantan el error
//   con un mensaje util, pero ⊥ son lo que garantiza.
// ─────────────────────────────────────────────────────────────────────────────
const MODE = process.argv.includes('--mode=prod') ? 'prod' : 'dev'
const READ_ONLY = MODE === 'prod'

// Tools que ESCRIBEN. En prod se podan de `tools/list` (ahorro de contexto) y se
// cortan en `tools/call` (2da capa). ⊥ pasan por Postgres ∴ `--read-only` ⊥ las cubre.
const WRITE_TOOLS = [
  'apply_migration',
  'deploy_edge_function',
  'create_branch',
  'delete_branch',
  'merge_branch',
  'reset_branch',
  'rebase_branch',
  'create_project',
  'pause_project',
  'restore_project',
  'delete_project',
  'update_storage_config',
  'update_postgrest_config',
]

// REDIRECT ALL LOGS TO STDERR SO WE DON'T CORRUPT THE MCP JSON-RPC STREAM
console.log = console.error

// Raiz del proyecto.
//
// Por DEFECTO se deduce contando niveles desde __dirname, asumiendo que el wrapper vive
// en `tools/mcp/supabase/` (3 arriba = raiz). Si lo moves a otra carpeta -por ejemplo
// `.vscode/`, donde vivian las versiones viejas- este numero QUEDA MAL y el wrapper
// busca el .env y los borradores fuera del repo.
//
// ! `MCP_PROJECT_DIR` es un ESCAPE para ese caso, ⊥ la opcion recomendada. Se probo
//   ponerlo en `.mcp.json` como `"${workspaceFolder}"` y **rompio los 10 servers**:
//   esa sintaxis es de VS Code y Claude Code ⊥ la expande, asi que el wrapper recibio
//   la cadena LITERAL como ruta, ⊥ encontro el .env y murio con "Falta configuracion
//   del proyecto" aunque las variables estuvieran cargadas. Si lo seteas, que sea con
//   una ruta ABSOLUTA de verdad.
const NIVELES_HASTA_LA_RAIZ = '../../..'
const DEFAULT_PROJECT_DIR = path.resolve(__dirname, NIVELES_HASTA_LA_RAIZ)

const PROJECT_DIR = process.env.MCP_PROJECT_DIR || DEFAULT_PROJECT_DIR

console.log(`[Supabase MCP] v${WRAPPER_VERSION} | Proyecto: ${PROJECT_DIR}`)

// Un `${...}` que llego sin expandir ⊥ es una ruta: es una plantilla que nadie resolvio.
// Vale la pena gritarlo, porque el sintoma (falta configuracion) apunta al .env y la
// causa esta en el .mcp.json.
if (/\$\{|%[A-Za-z_]+%/.test(PROJECT_DIR)) {
  console.error(
    `[Supabase MCP] ❌ MCP_PROJECT_DIR llego SIN EXPANDIR: ${PROJECT_DIR}` +
      `\n[Supabase MCP]    Claude Code ⊥ interpola \${workspaceFolder} (eso es de VS Code).` +
      `\n[Supabase MCP]    Arreglo: SACA MCP_PROJECT_DIR del .mcp.json (el wrapper deduce la raiz solo),` +
      `\n[Supabase MCP]    o poné una ruta absoluta real.`
  )
  process.exit(1)
}

// Fallar temprano y con un mensaje que apunte a la causa real, en vez de morir
// mas adelante con "no existe el borrador" y mandar a buscar el problema al lado equivocado.
if (!fs.existsSync(path.join(PROJECT_DIR, '.git'))) {
  console.error(
    `[Supabase MCP] AVISO: ${PROJECT_DIR} no parece la raiz del repo (no hay .git).` +
      `\n[Supabase MCP] Segui, pero si falla "no existe el borrador" el problema es este path.` +
      `\n[Supabase MCP] Arreglo: mové el wrapper a tools/mcp/supabase/ (la raiz se deduce sola), o` +
      `\n[Supabase MCP] seteá MCP_PROJECT_DIR con una ruta ABSOLUTA (⊥ \${workspaceFolder}: ⊥ se expande).`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Flujo de migraciones (ver plans/flujo-migraciones-2026-08.md)
//
//   migrations-draft/<desc>.sql   escrita, AUN NO aplicada
//   migrations/<version>_<desc>.sql   aplicada; el nombre ES el version real
//
// El agente NUNCA escribe un timestamp: lo asigna el servidor al aplicar. Este
// wrapper mueve el borrador a su nombre definitivo recien cuando la aplicacion
// tuvo exito, y le informa al agente el nombre nuevo en la respuesta.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Version del servidor MCP: FIJA, no `@latest`.
//
// `@latest` corre codigo de terceros resuelto en tiempo de ejecucion, con el
// access token a mano — mismo riesgo que un tag movil en un workflow de CI.
// Y el paquete esta en 0.x: un 0.10 -> 0.11 puede cambiar comportamiento sin aviso.
// El renombre automatico de migraciones DEPENDE de como apply_migration registra
// el `name`, asi que una version nueva podria romperlo en silencio.
//
// 0.10.0 es la version con la que se valido el flujo end-to-end (2026-08-19).
// Al actualizar: subir este numero, correr una migracion de prueba y verificar que
// el archivo se renombre solo. Ver .agents/tasks/2026-0073.md
// ─────────────────────────────────────────────────────────────────────────────
const MCP_SERVER_PKG = '@supabase/mcp-server-supabase'
const MCP_SERVER_VERSION = '0.10.0'

/**
 * Avisa (sin bloquear) si hay una version mas nueva publicada. Cachea 24 h para no
 * pegarle al registry en cada arranque. Nunca falla el wrapper: es informativo.
 */
function notificarSiHayVersionNueva() {
  const cacheFile = path.join(require('os').tmpdir(), 'supabase-mcp-version-check.json')
  try {
    const c = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
    if (Date.now() - c.ts < 24 * 60 * 60 * 1000) {
      if (c.latest && c.latest !== MCP_SERVER_VERSION) avisar(c.latest)
      return
    }
  } catch (e) {
    /* sin cache o corrupta: se consulta */
  }

  const https = require('https')
  const req = https.get(
    { hostname: 'registry.npmjs.org', path: `/${MCP_SERVER_PKG}/latest`, timeout: 5000 },
    (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          const latest = JSON.parse(data).version
          fs.writeFileSync(cacheFile, JSON.stringify({ ts: Date.now(), latest }))
          if (latest && latest !== MCP_SERVER_VERSION) avisar(latest)
        } catch (e) {
          /* silencio: es informativo */
        }
      })
    }
  )
  req.on('error', () => {})
  req.on('timeout', () => req.destroy())

  function avisar(latest) {
    console.error(
      `\n[Supabase MCP] ⬆ Hay una version nueva del servidor MCP: ${latest} (usando ${MCP_SERVER_VERSION}).` +
        `\n[Supabase MCP]   Para actualizar: subir MCP_SERVER_VERSION en este wrapper, aplicar una` +
        `\n[Supabase MCP]   migracion de prueba y verificar que el archivo se renombre solo.`
    )
  }
}

const MIGRATIONS_DIR = path.join(PROJECT_DIR, 'supabase', 'migrations')
const DRAFT_DIR = path.join(PROJECT_DIR, 'supabase', 'migrations-draft')

/** Ejecuta SQL de solo lectura contra el proyecto via Management API. */
function mgmtQuery(sql) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const body = JSON.stringify({ query: sql })
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 15000,
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data))
            } catch (e) {
              reject(new Error(`Respuesta no-JSON: ${data.slice(0, 200)}`))
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.write(body)
    req.end()
  })
}

/** Busca el `version` que el servidor le asigno a la migracion recien aplicada. */
async function fetchAppliedVersion(name) {
  const safe = String(name).replace(/'/g, "''")
  const rows = await mgmtQuery(
    `select version from supabase_migrations.schema_migrations
     where name = '${safe}' order by version desc limit 1;`
  )
  const list = Array.isArray(rows) ? rows : rows.rows || rows.result || []
  return list.length ? String(list[0].version) : null
}

/**
 * Traduce la posicion de un error de Postgres a un numero de linea del archivo.
 * Objetivo: que el agente vaya DIRECTO a la linea que fallo en vez de releer
 * toda la migracion (evita saturarlo).
 */
function locateError(errorText, sqlContent) {
  const byLine = /\bLINE\s+(\d+)\s*:/i.exec(errorText || '')
  if (byLine) return { line: Number(byLine[1]), src: 'postgres' }
  const byPos = /\bposition:?\s*(\d+)/i.exec(errorText || '')
  if (byPos && sqlContent) {
    const pos = Number(byPos[1])
    const line = sqlContent.slice(0, pos).split(/\r?\n/).length
    return { line, src: 'position' }
  }
  return null
}

/** Respuesta MCP de texto plano. Corta: no devolvemos el SQL aplicado. */
function textResponse(id, text, isError) {
  return {
    jsonrpc: '2.0',
    id,
    result: { content: [{ type: 'text', text }], isError: Boolean(isError) },
  }
}

/**
 * Idempotencia de POLICY / TRIGGER / TYPE.
 *
 * ! Van aparte de `unsafePatterns` porque Postgres ⊥ acepta `IF NOT EXISTS` en
 *   `CREATE POLICY` ni en `CREATE TRIGGER`: la unica forma idempotente es un
 *   `DROP ... IF EXISTS` previo DEL MISMO NOMBRE, o un bloque `DO` que consulte
 *   pg_policies / pg_trigger / pg_type. ∴ ⊥ alcanza un regex de una linea.
 *
 * ! El chequeo es POR NOMBRE a proposito: dropear OTRA policy ⊥ cubre a esta. Ese
 *   es el caso que se escapa de una revision a ojo.
 *
 * Medido sobre las migraciones ya aplicadas: 30/351 en andreu, 20/116 en estel,
 * 15/511 en dafre, 1/131 en lujan lo violarian. Patron real y frecuente, ⊥ teorico.
 * (Solo corre sobre BORRADORES nuevos: las aplicadas son inmutables y ⊥ se re-chequean.)
 */
function violacionesPorNombre(sqlLimpio) {
  const v = []
  const enBloqueDo = /\bDO\s+\$\$/i.test(sqlLimpio)
  const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  for (const m of sqlLimpio.matchAll(/\bCREATE\s+POLICY\s+"?([a-z0-9_\- ]+)"?/gi)) {
    const nom = m[1].trim()
    const tieneDrop = new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"?${escapar(nom)}"?`, 'i').test(
      sqlLimpio
    )
    if (!tieneDrop && !enBloqueDo) {
      v.push(
        `CREATE POLICY "${nom}" sin DROP POLICY IF EXISTS previo (del MISMO nombre) ni bloque DO`
      )
    }
  }
  for (const m of sqlLimpio.matchAll(/\bCREATE\s+TRIGGER\s+"?([a-z0-9_]+)"?/gi)) {
    const nom = m[1]
    const tieneDrop = new RegExp(
      `DROP\\s+TRIGGER\\s+IF\\s+EXISTS\\s+"?${escapar(nom)}"?`,
      'i'
    ).test(sqlLimpio)
    if (!tieneDrop && !enBloqueDo) {
      v.push(
        `CREATE TRIGGER "${nom}" sin DROP TRIGGER IF EXISTS previo (del MISMO nombre) ni bloque DO`
      )
    }
  }
  for (const m of sqlLimpio.matchAll(/\bCREATE\s+TYPE\s+"?([a-z0-9_.]+)"?/gi)) {
    if (!enBloqueDo) {
      v.push(`CREATE TYPE "${m[1]}" fuera de un bloque DO con chequeo a pg_type`)
    }
  }
  return v
}

/** apply_migration en vuelo: id de la request -> datos del borrador. */
const pendingMigrations = new Map()

// Función simple para leer variables del .env
function loadEnvVariable(varName) {
  const envPath = path.join(PROJECT_DIR, '.env')
  if (!fs.existsSync(envPath)) {
    return null
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const match = envContent.match(new RegExp(`^${varName}\\s*=\\s*"?([^"\\n]+)"?`, 'm'))
  return match ? match[1].trim() : null
}

// Leer PROJECT_REF desde .env.
//
// ! El orden ⊥ es arbitrario. `SUPABASE_PROJECT_ID` quedo ULTIMO (legacy) porque esa
// variable la lee TAMBIEN el CLI de Supabase, que la usa para NOMBRAR los contenedores
// del stack local (`supabase_db_<valor>`). Al hacer doble trabajo -- ref del proyecto
// remoto aca + namespace local alla -- no se podia poner un nombre legible para humanos
// sin apuntar el MCP a un proyecto inexistente. Ahora cada nombre hace UN trabajo:
//   - SUPABASE_REMOTE_REF        -> el proyecto remoto (explicito, gana siempre)
//   - VITE_SUPABASE_PROJECT_ID   -> el que ya usa el frontend (mismo valor)
//   - SUPABASE_PROJECT_ID        -> legacy; si ademas queres contenedores legibles,
//                                   ponele el nombre corto y defini una de las de arriba.
const PROJECT_REF =
  MODE === 'prod'
    ? loadEnvVariable('SUPABASE_PROD_REF') || process.env.SUPABASE_PROD_REF
    : loadEnvVariable('SUPABASE_REMOTE_REF') ||
      loadEnvVariable('VITE_SUPABASE_PROJECT_ID') ||
      loadEnvVariable('SUPABASE_PROJECT_ID') ||
      process.env.SUPABASE_REMOTE_REF ||
      process.env.SUPABASE_PROJECT_ID

if (!PROJECT_REF) {
  console.error(`[Supabase MCP] ❌ Falta configuración del proyecto (modo: ${MODE})`)
  if (MODE === 'prod') {
    console.error(`\nAgrega en tu .env el ref del proyecto de PRODUCCION:`)
    console.error(`  SUPABASE_PROD_REF="ref-de-prod"`)
    console.error(`\n(El token de acceso es el mismo que para dev.)`)
  } else {
    console.error(`\nAgrega una de estas variables en tu .env:`)
    console.error(`  SUPABASE_REMOTE_REF="tu-project-ref"        # recomendada`)
    console.error(`  VITE_SUPABASE_PROJECT_ID="tu-project-ref"`)
  }
  process.exit(1)
}

// Leer el access token desde múltiples fuentes (en orden de prioridad)
let accessToken
try {
  const homeDir = process.env.USERPROFILE || process.env.HOME

  // OPCIÓN 1: Variable de entorno (la inyecta `infisical run`; ver docs/guides/gestion-de-secretos.md)
  // Va PRIMERO a propósito: si el proceso arrancó con secretos inyectados, esos ganan sobre un
  // .env que puede haber quedado viejo en disco. Al revés, un .env olvidado pisaría en silencio
  // al gestor de secretos — el fallback ganándole a la fuente de verdad.
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    accessToken = process.env.SUPABASE_ACCESS_TOKEN
    console.log(`[Supabase MCP] ✓ Token obtenido desde variable de entorno (Infisical o sistema)`)
  }

  // OPCIÓN 2: Archivo .env del proyecto (fallback)
  if (!accessToken) {
    accessToken = loadEnvVariable('SUPABASE_ACCESS_TOKEN')
    if (accessToken) {
      console.log(`[Supabase MCP] ✓ Token obtenido desde .env del proyecto`)
    }
  }

  // OPCIÓN 3: Archivo .supabase-token (legacy)
  if (!accessToken) {
    const localTokenPath = path.join(PROJECT_DIR, '.supabase-token')
    if (fs.existsSync(localTokenPath)) {
      accessToken = fs.readFileSync(localTokenPath, 'utf-8').trim()
      console.log(`[Supabase MCP] ✓ Token obtenido desde archivo .supabase-token`)
    }
  }

  // OPCIÓN 4: Ubicaciones estándar del CLI
  if (!accessToken) {
    const tokenPaths = [
      path.join(homeDir, '.supabase', 'access-token'), // Linux/Mac
      path.join(homeDir, 'AppData', 'Roaming', 'supabase', 'access-token'), // Windows Roaming
      path.join(homeDir, 'AppData', 'Local', 'supabase', 'access-token'), // Windows Local
    ]

    for (const tokenPath of tokenPaths) {
      if (fs.existsSync(tokenPath)) {
        accessToken = fs.readFileSync(tokenPath, 'utf-8').trim()
        console.log(`[Supabase MCP] ✓ Token encontrado en: ${tokenPath}`)
        break
      }
    }
  }

  if (!accessToken) {
    console.error(`[Supabase MCP] ❌ No se encontró el token de acceso`)
    console.error(`\n[Supabase MCP] Opciones para configurar el token:\n`)
    console.error(`  1. Archivo .env del proyecto (recomendado):`)
    console.error(`     Agrega: SUPABASE_ACCESS_TOKEN="sbp_tu_token_aqui"\n`)
    console.error(`  2. Variable de entorno del sistema:`)
    console.error(`     $env:SUPABASE_ACCESS_TOKEN = "sbp_tu_token_aqui"\n`)
    console.error(`  3. Autenticar el CLI:`)
    console.error(`     supabase login --token sbp_tu_token_aqui\n`)
    console.error(`[Supabase MCP] Obtén tu token en: https://supabase.com/dashboard/account/tokens`)
    process.exit(1)
  }
} catch (error) {
  console.error(`[Supabase MCP] Error al leer el token:`, error.message)
  process.exit(1)
}

// Función para validar la configuración antes de iniciar el servidor
async function validateSupabaseConnection() {
  return new Promise((resolve, reject) => {
    const https = require('https')

    console.log(`[Supabase MCP] 🔍 Validando configuración...`)

    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const project = JSON.parse(data)
            console.log(`[Supabase MCP] ✅ Conexión exitosa`)
            console.log(
              `[Supabase MCP] 📦 Proyecto: ${project.name || PROJECT_REF} (${PROJECT_REF})`
            )
            // El agente lee esto: contra QUE base habla y que puede hacer.
            if (READ_ONLY) {
              console.log(`[Supabase MCP] 🔒 ENTORNO: PRODUCCION — SOLO LECTURA`)
              console.log(`[Supabase MCP]    Permitido: SELECT, list_*, get_*, logs, advisors.`)
              console.log(
                `[Supabase MCP]    Bloqueado por Postgres (⊥ se puede forzar): INSERT/UPDATE/DELETE,`
              )
              console.log(`[Supabase MCP]    DDL, apply_migration, deploy_edge_function, branches.`)
            } else {
              console.log(`[Supabase MCP] 🔧 ENTORNO: DEV — lectura + escritura`)
              console.log(
                `[Supabase MCP]    DDL solo por migracion (skill db-new-migrations). execute_sql ⊥ hace DDL.`
              )
            }
            console.log(`[Supabase MCP] 🌐 Región: ${project.region || 'N/A'}`)
            resolve(true)
          } catch (e) {
            reject(new Error('Error al parsear respuesta del servidor'))
          }
        } else if (res.statusCode === 401) {
          reject(
            new Error(
              'Token inválido o expirado. Genera uno nuevo en:\n     https://supabase.com/dashboard/account/tokens'
            )
          )
        } else if (res.statusCode === 403) {
          reject(
            new Error(
              'Token válido pero sin permisos para acceder al proyecto.\n     Verifica que el PROJECT_REF sea correcto.'
            )
          )
        } else if (res.statusCode === 404) {
          reject(
            new Error(
              `Proyecto "${PROJECT_REF}" no encontrado.\n     Verifica SUPABASE_PROJECT_ID en tu .env`
            )
          )
        } else {
          reject(new Error(`Error HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`Error de conexión: ${error.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout: No se pudo conectar a Supabase'))
    })

    req.end()
  })
}

// Validar conexión antes de iniciar el servidor
validateSupabaseConnection()
  .then(() => {
    console.log(`[Supabase MCP] 🚀 Iniciando servidor MCP...\n`)

    // Ejecutar el servidor real de Supabase MCP
    const cmd = process.platform === 'win32' ? 'cmd.exe' : 'npx'

    // ! Los flags se arman UNA vez y se usan en las dos ramas. Cuando cada rama tenia
    //   su propia lista, `--read-only` estaba solo en la de Windows: en Linux/Mac el
    //   server de PROD arrancaba con ESCRITURA habilitada y la unica barrera quedaba
    //   siendo el regex de este wrapper, que es justo lo que ⊥ garantiza nada.
    const serverArgs = [
      '-y',
      `${MCP_SERVER_PKG}@${MCP_SERVER_VERSION}`,
      ...(READ_ONLY ? ['--read-only'] : []),
      '--project-ref',
      PROJECT_REF,
    ]
    const args = process.platform === 'win32' ? ['/c', 'npx', ...serverArgs] : serverArgs

    // El token va por env y NO como argumento: un argumento queda visible en la
    // lista de procesos de la maquina (ps / Task Manager).
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'inherit'],
      shell: false,
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
    })

    notificarSiHayVersionNueva()

    const readline = require('readline')

    // Proxy stdin (Cliente -> MCP Server)
    const rlStdin = readline.createInterface({
      input: process.stdin,
      terminal: false,
    })
    rlStdin.on('line', (line) => {
      try {
        const msg = JSON.parse(line)

        if (msg.method === 'tools/call' && msg.params && msg.params.arguments) {
          const toolName = msg.params.name

          // 0. En prod, las tools de ESCRITURA de plataforma ⊥ pasan por Postgres
          //    ∴ `--read-only` ⊥ las cubre -> se cortan aca.
          if (READ_ONLY && WRITE_TOOLS.includes(toolName)) {
            console.error(`\n[Supabase MCP:prod] 🛑 BLOQUEADO (solo lectura): ${toolName}\n`)
            process.stdout.write(
              JSON.stringify(
                textResponse(
                  msg.id,
                  `\`${toolName}\` no esta disponible: este MCP es PRODUCCION en SOLO LECTURA.\n` +
                    `Usa el servidor supabase-wrapper-dev y que el cambio llegue a prod por migracion + CI/CD.`,
                  true
                )
              ) + '\n'
            )
            return
          }

          // 1. Interceptar apply_migration
          if (toolName === 'apply_migration') {
            const rawName = String(msg.params.arguments.name || '')
            // El agente pasa SOLO la descripcion: `add_user_settings`.
            // Sin timestamp -> no puede inventarlo. Lo asigna el servidor al aplicar.
            const desc = rawName.replace(/\.sql$/i, '')

            if (/^\d{14}_/.test(desc)) {
              process.stdout.write(
                JSON.stringify(
                  textResponse(
                    msg.id,
                    `Error: el nombre no lleva timestamp. Paso "${rawName}".\n` +
                      `Usa solo la descripcion (ej: "add_user_settings").\n` +
                      `El timestamp lo asigna el servidor al aplicar; este wrapper renombra el archivo despues.`,
                    true
                  )
                ) + '\n'
              )
              return
            }

            if (!/^[a-z][a-z0-9_]*$/i.test(desc)) {
              process.stdout.write(
                JSON.stringify(
                  textResponse(
                    msg.id,
                    `Error: nombre invalido ("${rawName}"). Solo letras, digitos y guion bajo, empezando por letra.`,
                    true
                  )
                ) + '\n'
              )
              return
            }

            const draftPath = path.join(DRAFT_DIR, `${desc}.sql`)
            if (!fs.existsSync(draftPath)) {
              process.stdout.write(
                JSON.stringify(
                  textResponse(
                    msg.id,
                    `Error: no existe el borrador supabase/migrations-draft/${desc}.sql\n` +
                      `Escribi el archivo ANTES de aplicar: si la aplicacion falla, se corrige ahi mismo.`,
                    true
                  )
                ) + '\n'
              )
              return
            }

            const fileContent = fs.readFileSync(draftPath, 'utf-8')

            // Idempotencia: el mismo SQL tiene que poder reaplicarse sin romper.
            const cleanContent = fileContent
              .replace(/--.*$/gm, '')
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .trim()
            const unsafePatterns = [
              {
                pattern: /\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i,
                msg: 'CREATE TABLE sin IF NOT EXISTS',
              },
              { pattern: /\bDROP\s+TABLE\s+(?!IF\s+EXISTS)/i, msg: 'DROP TABLE sin IF EXISTS' },
              {
                pattern: /\bALTER\s+TABLE\s+.+\bADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/i,
                msg: 'ADD COLUMN sin IF NOT EXISTS',
              },
              { pattern: /\bDROP\s+COLUMN\s+(?!IF\s+EXISTS)/i, msg: 'DROP COLUMN sin IF EXISTS' },
              {
                pattern: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)/i,
                msg: 'CREATE INDEX sin IF NOT EXISTS',
              },
              { pattern: /\bCREATE\s+FUNCTION\b/i, msg: 'CREATE FUNCTION sin OR REPLACE' },
            ]
            const violations = unsafePatterns
              .filter(({ pattern }) => pattern.test(cleanContent))
              .map((v) => v.msg)
              .concat(violacionesPorNombre(cleanContent))
            if (violations.length > 0) {
              const details = violations.map((m) => `  - ${m}`).join('\n')
              process.stdout.write(
                JSON.stringify(
                  textResponse(
                    msg.id,
                    `Error: el SQL no es idempotente:\n${details}\n` +
                      `Corregi supabase/migrations-draft/${desc}.sql y reintenta con el MISMO nombre.`,
                    true
                  )
                ) + '\n'
              )
              return
            }

            // El `name` que se envia es lo que despues permite ubicar el registro.
            msg.params.arguments.name = desc
            msg.params.arguments.query = fileContent
            pendingMigrations.set(msg.id, { desc, draftPath, fileContent })
            console.error(`\n[Supabase MCP] APLICANDO borrador: ${desc}.sql`)
            child.stdin.write(JSON.stringify(msg) + '\n')
            return
          }

          // 2. Interceptar execute_sql para bloquear DDL
          if (toolName === 'execute_sql') {
            const query = msg.params.arguments.query || ''

            // El analisis lo hace `supabase-mcp-sql-guard.cjs`: neutraliza comentarios,
            // literales y bloques dollar-quoted, parte en SENTENCIAS y mira el verbo de
            // cada una.
            //
            // ! Antes esto era un regex anclado con `^` sobre el texto ENTERO, y el guard
            //   bueno estaba en un modulo que ⊥ importaba nadie. Cuatro bypass triviales
            //   pasaban derecho contra la base viva: `select 1; drop ...`, `; drop ...`,
            //   `do $$ ... $$`, y `select ... into`. 🔗 auditoria-seguridad-2026-09 §D3.
            const ddl = detectarDDL(query)
            const isDDL = ddl.bloqueado

            // 2da capa de prod. La 1ra —y la que de verdad garantiza— es `--read-only`:
            // el backend corre el SQL en una transaccion read-only de Postgres, asi que
            // un UPDATE lo rechaza el MOTOR (25006). Esto solo adelanta el error con un
            // mensaje util y ⊥ gasta un turno del agente.
            if (READ_ONLY) {
              const escritura = detectarEscritura(query)
              const isWrite = escritura.bloqueado
              if (isWrite) {
                console.error(
                  `\n[Supabase MCP:prod] 🛑 BLOQUEADO (solo lectura):\n${query.substring(0, 200)}\n`
                )
                process.stdout.write(
                  JSON.stringify(
                    textResponse(
                      msg.id,
                      `Este MCP es la base de PRODUCCION y es de SOLO LECTURA. Solo SELECT.\n` +
                        `La escritura la rechaza Postgres, ⊥ este guard: no se puede forzar.\n\n` +
                        `Para cambiar datos o esquema: trabaja en DEV (servidor supabase-wrapper-dev) y que\n` +
                        `el cambio llegue a prod por migracion + CI/CD. Ver AGENTS.md §1b y MIGRATIONS.md.`,
                      true
                    )
                  ) + '\n'
                )
                return
              }
            }

            if (isDDL) {
              console.error(`\n[Supabase MCP] 🛑 BLOCKED DDL (${ddl.razon}):\n${ddl.sentencia}\n`)
              process.stdout.write(
                JSON.stringify({
                  jsonrpc: '2.0',
                  id: msg.id,
                  result: {
                    content: [
                      {
                        type: 'text',
                        // Se nombra la SENTENCIA que cayo, ⊥ el principio del texto: con
                        // multi-statement, el `query.substring(0,200)` mostraba el `select`
                        // inofensivo del principio y ⊥ el `drop` que disparo el bloqueo.
                        text:
                          `❌ ${buildSchemaChangeError(ddl.razon)}\n\n` +
                          `Sentencia que lo disparo: ${ddl.sentencia}`,
                      },
                    ],
                    isError: true,
                  },
                }) + '\n'
              )
              return
            }
          }
        }

        // Passthrough default
        child.stdin.write(JSON.stringify(msg) + '\n')
      } catch (e) {
        child.stdin.write(line + '\n')
      }
    })

    // Proxy stdout (MCP Server -> Cliente)
    const rlStdout = readline.createInterface({
      input: child.stdout,
      terminal: false,
    })
    // Serializa las escrituras: finalizar una migracion es async (consulta HTTP),
    // y sin cola una respuesta posterior podria adelantarsele.
    let writeChain = Promise.resolve()
    const emit = (obj) => process.stdout.write(JSON.stringify(obj) + '\n')

    /**
     * Cierra el ciclo de una migracion aplicada:
     *   exito -> mueve el borrador a migrations/<version>_<desc>.sql e INFORMA el nombre nuevo
     *   error -> deja el borrador intacto y dice explicitamente que NO se rehaga
     */
    async function finalizeMigration(response, pending) {
      const { desc, draftPath, fileContent } = pending
      const bodyText = JSON.stringify(response.result || response.error || {})
      const failed =
        Boolean(response.error) || (response.result && response.result.isError === true)

      if (failed) {
        const loc = locateError(bodyText, fileContent)
        const donde = loc ? `\nFallo cerca de la LINEA ${loc.line} de ese archivo.` : ''
        return textResponse(
          response.id,
          `La migracion NO se aplico.\n\n${bodyText.slice(0, 800)}\n\n` +
            `El borrador supabase/migrations-draft/${desc}.sql QUEDO INTACTO.${donde}\n` +
            `Corregi solo lo que fallo y reintenta apply_migration con el MISMO nombre ("${desc}").\n` +
            `NO crees un archivo nuevo ni reescribas la migracion entera.`,
          true
        )
      }

      let version = null
      try {
        version = await fetchAppliedVersion(desc)
      } catch (e) {
        console.error(`[Supabase MCP] No se pudo leer el version aplicado: ${e.message}`)
      }

      if (!version) {
        return textResponse(
          response.id,
          `Migracion aplicada, pero no se pudo determinar su version.\n` +
            `El borrador sigue en supabase/migrations-draft/${desc}.sql - NO lo reapliques.\n` +
            `Renombralo a mano a supabase/migrations/<version>_${desc}.sql ` +
            `(el version esta en supabase_migrations.schema_migrations).`,
          false
        )
      }

      const finalName = `${version}_${desc}.sql`
      const finalPath = path.join(MIGRATIONS_DIR, finalName)

      if (fs.existsSync(finalPath)) {
        return textResponse(
          response.id,
          `Migracion aplicada (version ${version}), pero ya existe ${finalName}. ` +
            `No se piso nada: el borrador sigue en migrations-draft/${desc}.sql. Resolvelo a mano.`,
          false
        )
      }

      try {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
        fs.renameSync(draftPath, finalPath)
      } catch (e) {
        return textResponse(
          response.id,
          `Migracion aplicada (version ${version}), pero fallo mover el archivo: ${e.message}\n` +
            `Movelo a mano: migrations-draft/${desc}.sql -> migrations/${finalName}`,
          false
        )
      }

      console.error(`[Supabase MCP] OK ${desc}.sql -> migrations/${finalName}`)
      return textResponse(
        response.id,
        `Migracion aplicada.\nEl archivo ahora es: supabase/migrations/${finalName}\n` +
          `(ya no existe migrations-draft/${desc}.sql - usa el nombre nuevo si necesitas referenciarlo).`,
        false
      )
    }

    rlStdout.on('line', (line) => {
      let response
      try {
        response = JSON.parse(line)
      } catch (e) {
        writeChain = writeChain.then(() => process.stdout.write(line + '\n'))
        return
      }

      const pending = response && response.id != null ? pendingMigrations.get(response.id) : null

      if (!pending) {
        // En prod, PODAR las tools de escritura de `tools/list`.
        //
        // ! Esto ⊥ es seguridad (de eso se encarga `--read-only`, que impone Postgres).
        // Es AHORRO DE CONTEXTO: una tool anunciada viaja con su JSON Schema completo y
        // el agente lo paga en tokens cada sesion aunque nunca la pueda usar. Podarlas
        // tambien evita que intente una escritura y gaste un turno en el rechazo.
        //
        // ⊥ se puede hacer con `--features` del server oficial: `apply_migration` y
        // `execute_sql` viven en el MISMO grupo (`database`), y `deploy_edge_function`
        // va junto a `list_edge_functions` (`functions`). El filtro ! ser por tool.
        if (READ_ONLY && response.result && Array.isArray(response.result.tools)) {
          const antes = response.result.tools.length
          response.result.tools = response.result.tools.filter((t) => !WRITE_TOOLS.includes(t.name))
          const podadas = antes - response.result.tools.length
          if (podadas > 0) {
            console.error(
              `[Supabase MCP:prod] 🔒 ${podadas} tools de escritura ocultas (quedan ${response.result.tools.length} de lectura)`
            )
          }
          writeChain = writeChain.then(() => emit(response))
          return
        }
        writeChain = writeChain.then(() => process.stdout.write(line + '\n'))
        return
      }

      pendingMigrations.delete(response.id)
      writeChain = writeChain.then(() =>
        finalizeMigration(response, pending)
          .then(emit)
          .catch((e) => {
            console.error(`[Supabase MCP] Error al finalizar migracion: ${e.message}`)
            process.stdout.write(line + '\n')
          })
      )
    })

    // Cerrar streams cuando corresponda
    process.stdin.on('end', () => child.stdin.end())
    child.stdout.on('end', () => process.stdout.end())

    child.on('error', (err) => {
      console.error(`\n[Supabase MCP] ❌ Error del proceso hijo:`, err.message)
      process.exit(1)
    })

    child.on('exit', (code) => {
      process.exit(code)
    })
  })
  .catch((error) => {
    console.error(`\n[Supabase MCP] ❌ Error de validación:`)
    console.error(`  ${error.message}\n`)
    process.exit(1)
  })
