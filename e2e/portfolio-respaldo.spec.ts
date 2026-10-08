import { expect, test, type Browser } from "@playwright/test";
import {
  FIXTURE_RPC,
  lineasVisibles,
  registrarErroresDePagina,
  simularRpc,
} from "./helpers";

// Rutas con el elemento que aparece cuando la página ya cargó sus datos.
const PAGINAS = [
  { ruta: "/", listo: "h1" },
  { ruta: "/#/projects", listo: "article" },
  { ruta: "/#/trajectory", listo: "h3" },
];

/**
 * Abre el sitio en un contexto NUEVO (el servicio cachea por documento) y recorre las páginas
 * por hash, como lo haría el usuario. Devuelve el texto visible de cada una.
 */
const recorrer = async (
  browser: Browser,
  respuesta: { status?: number; body?: unknown },
) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const rpc = await simularRpc(page, respuesta);
  const errores = registrarErroresDePagina(page);

  const lineas: Record<string, string[]> = {};
  for (const { ruta, listo } of PAGINAS) {
    await page.goto(ruta);
    await expect(page.locator(listo).first()).toBeVisible();
    lineas[ruta] = await lineasVisibles(page);
  }

  return { lineas, errores, llamadas: rpc.llamadas(), cerrar: () => context.close() };
};

test("RPC con error 500: Home, Projects y Trajectory muestran content.yml", async ({ page }, testInfo) => {
  await simularRpc(page, { status: 500, body: { message: "fallo simulado" } });
  const errores = registrarErroresDePagina(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola, soy Facundo Guarnier.");
  await expect(page.getByRole("heading", { name: "Arsenal" })).toBeVisible();

  await page.goto("/#/projects");
  await expect(page.locator("article")).toHaveCount(FIXTURE_RPC.projects.length);
  await expect(page.getByRole("heading", { name: "Buckshot Tracker Pro" })).toBeVisible();

  await page.goto("/#/trajectory");
  await expect(page.getByText("Merovingian Data (Híbrido)")).toBeVisible();
  await expect(page.getByText("Universidad de Mendoza")).toBeVisible();

  expect(errores).toEqual([]);
  await testInfo.attach("home-respaldo.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("mismo contenido visible con la RPC caída que con el perfil remoto", async ({ browser }) => {
  const conRespaldo = await recorrer(browser, { status: 500, body: { message: "fallo" } });
  const conRemoto = await recorrer(browser, { body: FIXTURE_RPC });
  try {
    expect(conRespaldo.llamadas).toBe(1);
    expect(conRemoto.llamadas).toBe(1);
    expect(conRespaldo.errores).toEqual([]);
    expect(conRemoto.errores).toEqual([]);

    for (const { ruta } of PAGINAS) {
      // El orden de experiencia cambia (la RPC ordena por fecha); el contenido ⊥ debe cambiar.
      expect(conRemoto.lineas[ruta], `contenido de ${ruta}`).toEqual(conRespaldo.lineas[ruta]);
    }
  } finally {
    await conRespaldo.cerrar();
    await conRemoto.cerrar();
  }
});
