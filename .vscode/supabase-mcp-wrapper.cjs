#!/usr/bin/env node

/**
 * Wrapper para Supabase MCP Server - Guarnold CV System
 * Usa el CLI de Supabase para obtener credenciales de forma segura
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Directorio del proyecto (ruta absoluta)
const PROJECT_DIR = "c:\\repositorios_git\\cv-formatter";

console.log(`[Supabase MCP - Guarnold CV System] ✓ Proyecto: ${PROJECT_DIR}`);

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

// Leer PROJECT_REF desde .env
const PROJECT_REF = loadEnvVariable("VITE_SUPABASE_PROJECT_ID");
if (!PROJECT_REF) {
  console.error(
    `[Supabase MCP - Guarnold CV System] ❌ No se encontró VITE_SUPABASE_PROJECT_ID en .env`
  );
  process.exit(1);
}

// Leer el access token desde múltiples fuentes (en orden de prioridad)
let accessToken;
try {
  const homeDir = process.env.USERPROFILE || process.env.HOME;

  // OPCIÓN 1: Archivo .env del proyecto (recomendado)
  accessToken = loadEnvVariable("SUPABASE_ACCESS_TOKEN");
  if (accessToken) {
    console.log(
      `[Supabase MCP - Guarnold CV System] ✓ Token obtenido desde .env del proyecto`
    );
  }

  // OPCIÓN 2: Variable de entorno del sistema
  if (!accessToken && process.env.SUPABASE_ACCESS_TOKEN) {
    accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    console.log(
      `[Supabase MCP - Guarnold CV System] ✓ Token obtenido desde variable de entorno del sistema`
    );
  }

  // OPCIÓN 3: Archivo .supabase-token (legacy)
  if (!accessToken) {
    const localTokenPath = path.join(PROJECT_DIR, ".supabase-token");
    if (fs.existsSync(localTokenPath)) {
      accessToken = fs.readFileSync(localTokenPath, "utf-8").trim();
      console.log(
        `[Supabase MCP - Guarnold CV System] ✓ Token obtenido desde archivo .supabase-token`
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
        console.log(
          `[Supabase MCP - Guarnold CV System] ✓ Token encontrado en: ${tokenPath}`
        );
        break;
      }
    }
  }

  if (!accessToken) {
    console.error(
      `[Supabase MCP - Guarnold CV System] ❌ No se encontró el token de acceso`
    );
    console.error(
      `\n[Supabase MCP - Guarnold CV System] Opciones para configurar el token:\n`
    );
    console.error(`  1. Archivo .env del proyecto (recomendado):`);
    console.error(`     Agrega: SUPABASE_ACCESS_TOKEN="sbp_tu_token_aqui"\n`);
    console.error(`  2. Variable de entorno del sistema:`);
    console.error(`     $env:SUPABASE_ACCESS_TOKEN = "sbp_tu_token_aqui"\n`);
    console.error(`  3. Autenticar el CLI:`);
    console.error(`     supabase login --token sbp_tu_token_aqui\n`);
    console.error(
      `[Supabase MCP - Guarnold CV System] Obtén tu token en: https://supabase.com/dashboard/account/tokens`
    );
    process.exit(1);
  }
} catch (error) {
  console.error(
    `[Supabase MCP - Guarnold CV System] Error al leer el token:`,
    error.message
  );
  process.exit(1);
}

console.log(`[Supabase MCP - Guarnold CV System] Iniciando servidor MCP...`);

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
