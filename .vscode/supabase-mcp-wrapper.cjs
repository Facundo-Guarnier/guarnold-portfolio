#!/usr/bin/env node

/**
 * Wrapper Genérico para Supabase MCP Server
 * Ver setup en: .vscode/README.md
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

// Función para validar la configuración antes de iniciar el servidor
async function validateSupabaseConnection() {
  return new Promise((resolve, reject) => {
    const https = require("https");

    console.log(`[Supabase MCP] 🔍 Validando configuración...`);

    const options = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT_REF}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 segundos
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const project = JSON.parse(data);
            console.log(`[Supabase MCP] ✅ Conexión exitosa`);
            console.log(
              `[Supabase MCP] 📦 Proyecto: ${project.name || PROJECT_REF}`
            );
            console.log(`[Supabase MCP] 🌐 Región: ${project.region || "N/A"}`);
            resolve(true);
          } catch (e) {
            reject(new Error("Error al parsear respuesta del servidor"));
          }
        } else if (res.statusCode === 401) {
          reject(
            new Error(
              "Token inválido o expirado. Genera uno nuevo en:\n     https://supabase.com/dashboard/account/tokens"
            )
          );
        } else if (res.statusCode === 403) {
          reject(
            new Error(
              "Token válido pero sin permisos para acceder al proyecto.\n     Verifica que el PROJECT_REF sea correcto."
            )
          );
        } else if (res.statusCode === 404) {
          reject(
            new Error(
              `Proyecto "${PROJECT_REF}" no encontrado.\n     Verifica SUPABASE_PROJECT_ID en tu .env`
            )
          );
        } else {
          reject(new Error(`Error HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Error de conexión: ${error.message}`));
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout: No se pudo conectar a Supabase"));
    });

    req.end();
  });
}

// Validar conexión antes de iniciar el servidor
validateSupabaseConnection()
  .then(() => {
    console.log(`[Supabase MCP] 🚀 Iniciando servidor MCP...\n`);

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
  })
  .catch((error) => {
    console.error(`\n[Supabase MCP] ❌ Error de validación:`);
    console.error(`  ${error.message}\n`);
    process.exit(1);
  });
