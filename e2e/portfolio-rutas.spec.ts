import { expect, test } from "@playwright/test";
import { FIXTURE_RPC, registrarErroresDePagina, simularRpc } from "./helpers";

// Las rutas del portfolio son reales (BrowserRouter). Los enlaces viejos del HashRouter siguen
// funcionando: `…/#/projects` se reescribe a `/projects` antes de montar la app.

test("un enlace viejo #/projects abre /projects y muestra los proyectos", async ({ page }) => {
  await simularRpc(page, { body: FIXTURE_RPC });
  const errores = registrarErroresDePagina(page);

  await page.goto("/#/projects");

  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator("article").first()).toBeVisible();
  expect(errores).toEqual([]);
});

test("una ruta desconocida vuelve al inicio del portfolio", async ({ page }) => {
  await simularRpc(page, { body: FIXTURE_RPC });

  await page.goto("/ruta-que-no-existe");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
