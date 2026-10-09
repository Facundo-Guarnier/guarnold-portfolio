import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

/** Forma de "cv-formatter".portfolio_publico(), generada desde content.yml. */
export const FIXTURE_RPC = JSON.parse(
  readFileSync(new URL("../tests/fixtures/portfolio_publico.json", import.meta.url), "utf8"),
);

const RPC = "**/rest/v1/rpc/portfolio_publico";
/** Host del Supabase FALSO que el webServer de playwright.config.ts inyecta. */
const HOST_FALSO = "https://supabase-falso.invalid/";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};
// PNG de 1x1: las imágenes de Unsplash del YAML cargan sin salir a internet.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/**
 * Responde la RPC `portfolio_publico` con `body` (o `status`) y devuelve un contador de llamadas.
 * Solo cuenta las que van al host FALSO: si Vite usara el `.env` real, el contador queda en 0 y
 * el test falla. Todo lo demás de Supabase queda bloqueado: el test ⊥ toca datos reales.
 */
export const simularRpc = async (
  page: Page,
  respuesta: { status?: number; body?: unknown },
): Promise<{ llamadas: () => number }> => {
  let llamadas = 0;

  await page.route(RPC, async (route) => {
    if (!route.request().url().startsWith(HOST_FALSO)) {
      return route.abort();
    }
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS });
    }
    llamadas += 1;
    return route.fulfill({
      status: respuesta.status ?? 200,
      headers: { ...CORS, "content-type": "application/json" },
      body: JSON.stringify(respuesta.body ?? {}),
    });
  });
  await page.route(/\.supabase\.co\//, (route) => route.abort());
  await page.route(/images\.unsplash\.com\//, (route) =>
    route.fulfill({ contentType: "image/png", body: PNG_1X1 }),
  );

  return { llamadas: () => llamadas };
};

/** Guarda `window.open` para leer a qué URL habría ido el usuario. */
export const interceptarAperturas = async (page: Page) => {
  await page.addInitScript(() => {
    (window as unknown as { __aperturas: string[] }).__aperturas = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __aperturas: string[] }).__aperturas.push(String(url));
      return null;
    };
  });
};

/** Texto visible de `main` como líneas ordenadas: compara contenido sin depender del orden. */
export const lineasVisibles = async (page: Page): Promise<string[]> => {
  const texto = await page.locator("main").innerText();
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .sort();
};

/** Errores no capturados de la página: un dato raro ⊥ debe tumbar el render. */
export const registrarErroresDePagina = (page: Page): Error[] => {
  const errores: Error[] = [];
  page.on("pageerror", (error) => errores.push(error));
  return errores;
};
