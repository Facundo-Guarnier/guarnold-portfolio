#!/usr/bin/env node

/**
 * Wrapper Genérico para Supabase MCP Server
 * Configuración 100% basada en variables de entorno (.env)
 *
 * Variables requeridas en .env:
 * - SUPABASE_ACCESS_TOKEN: Token de acceso de Supabase (sbp_...)
 * - SUPABASE_PROJECT_ID: ID del proyecto de Supabase
 *
 * Variables opcionales:
 * - MCP_PROJECT_DIR: Directorio del proyecto (por defecto: detecta automáticamente)
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Detectar directorio del proyecto automáticamente
// El wrapper está en .vscode/, entonces el proyecto es el directorio padre
const DEFAULT_PROJECT_DIR = path.resolve(__dirname, "..");

// Permitir override desde variable de entorno
const PROJECT_DIR = process.env.MCP_PROJECT_DIR || DEFAULT_PROJECT_DIR;

console.log(`[Supabase MCP] ✓ Proyecto: ${PROJECT_DIR}`);

// Función simple para leer variables del .env
function loadEnvVariable(varName) {
  const envPath = path.join(PROJECT_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(
    new RegExp(`^${varName}\\s*=\\s*"?([^"\\n]+)"?`, "m")
  );
  return match ? match[1].trim() : null;
}

// Leer PROJECT_REF desde .env (soporta múltiples nombres de variable)
const PROJECT_REF =
  loadEnvVariable("SUPABASE_PROJECT_ID") ||
  loadEnvVariable("VITE_SUPABASE_PROJECT_ID") ||
  process.env.SUPABASE_PROJECT_ID;

if (!PROJECT_REF) {
  console.error(`[Supabase MCP] ❌ Falta configuración del proyecto`);
  console.error(`\nAgrega una de estas variables en tu .env:`);
  console.error(`  SUPABASE_PROJECT_ID="tu-project-ref"`);
  console.error(`  VITE_SUPABASE_PROJECT_ID="tu-project-ref"`);
  process.exit(1);
}

// Leer el access token desde múltiples fuentes (en orden de prioridad)
let accessToken;
try {
  const homeDir = process.env.USERPROFILE || process.env.HOME;

  // OPCIÓN 1: Archivo .env del proyecto (recomendado)
  accessToken = loadEnvVariable("SUPABASE_ACCESS_TOKEN");
  if (accessToken) {
    console.log(`[Supabase MCP] ✓ Token obtenido desde .env del proyecto`);
  }

  // OPCIÓN 2: Variable de entorno del sistema
  if (!accessToken && process.env.SUPABASE_ACCESS_TOKEN) {
    accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    console.log(
      `[Supabase MCP] ✓ Token obtenido desde variable de entorno del sistema`
    );
  }

  // OPCIÓN 3: Archivo .supabase-token (legacy)
  if (!accessToken) {
    const localTokenPath = path.join(PROJECT_DIR, ".supabase-token");
    if (fs.existsSync(localTokenPath)) {
      accessToken = fs.readFileSync(localTokenPath, "utf-8").trim();
      console.log(
        `[Supabase MCP] ✓ Token obtenido desde archivo .supabase-token`
      );
    }
  }

  // OPCIÓN 4: Ubicaciones estándar del CLI
  if (!accessToken) {
    const tokenPaths = [
      path.join(homeDir, ".supabase", "access-token"), // Linux/Mac
      path.join(homeDir, "AppData", "Roaming", "supabase", "access-token"), // Windows Roaming
      path.join(homeDir, "AppData", "Local", "supabase", "access-token"), // Windows Local
    ];

    for (const tokenPath of tokenPaths) {
      if (fs.existsSync(tokenPath)) {
        accessToken = fs.readFileSync(tokenPath, "utf-8").trim();
        console.log(`[Supabase MCP] ✓ Token encontrado en: ${tokenPath}`);
        break;
      }
    }
  }

  if (!accessToken) {
    console.error(`[Supabase MCP] ❌ No se encontró el token de acceso`);
    console.error(`\n[Supabase MCP] Opciones para configurar el token:\n`);
    console.error(`  1. Archivo .env del proyecto (recomendado):`);
    console.error(`     Agrega: SUPABASE_ACCESS_TOKEN="sbp_tu_token_aqui"\n`);
    console.error(`  2. Variable de entorno del sistema:`);
    console.error(`     $env:SUPABASE_ACCESS_TOKEN = "sbp_tu_token_aqui"\n`);
    console.error(`  3. Autenticar el CLI:`);
    console.error(`     supabase login --token sbp_tu_token_aqui\n`);
    console.error(
      `[Supabase MCP] Obtén tu token en: https://supabase.com/dashboard/account/tokens`
    );
    process.exit(1);
  }
} catch (error) {
  console.error(`[Supabase MCP] Error al leer el token:`, error.message);
  process.exit(1);
}

console.log(`[Supabase MCP] Iniciando servidor MCP...`);
console.log(`[Supabase MCP] Project ID: ${PROJECT_REF}`);
console.log(`[Supabase MCP] Token: ${accessToken.substring(0, 10)}...\n`);

// Ejecutar el servidor real de Supabase MCP
// En Windows necesitamos shell: true para encontrar npx
const child = spawn(
  "npx",
  [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    accessToken,
    "--project-ref",
    PROJECT_REF,
  ],
  {
    stdio: "inherit",
    shell: true,
  }
);

child.on("exit", (code) => {
  process.exit(code);
});
