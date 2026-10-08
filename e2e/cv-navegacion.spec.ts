import { expect, test } from '@playwright/test';
import { URL_APP, USUARIO_CON_ACCESO } from '../tools/local/entorno.mjs';

/**
 * Una sola app, rutas reales: `/` (portfolio), `/cv` (CV público), `/admin` (editor) y `/login`.
 * Contra el stack local (`npm run db:local`). Lo que se prueba es la navegación entre superficies,
 * ⊥ el contenido del portfolio (eso lo cubren los specs `portfolio-*`).
 */
test('portfolio → CV → editor (pide login) → volver al CV, todo por rutas reales', async ({ page }) => {
  await page.goto(`${URL_APP}/`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto(`${URL_APP}/cv`);
  await expect(page).toHaveURL(/\/cv$/);
  await page.getByRole('link', { name: /Edit CV/ }).click();

  // Sin sesión, el editor manda a su login propio (en localhost ⊥ hay Guarnold ID).
  await expect(page).toHaveURL(/\/login$/);
  await page.getByPlaceholder('admin@example.com').fill(USUARIO_CON_ACCESO.email);
  await page.locator('input[type="password"]').fill(USUARIO_CON_ACCESO.clave);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { name: 'VitaeFlow Editor' })).toBeVisible();

  // La flecha de vuelta del editor lleva al CV público, ⊥ a la raíz del portfolio.
  await page.locator('a[href="/cv"]').first().click();
  await expect(page).toHaveURL(/\/cv$/);
});

test('rutas del CV y del portfolio ⊥ se pisan con el tema: el portfolio sigue sin clase dark en <html>', async ({ page }) => {
  await page.goto(`${URL_APP}/cv`);
  await expect(page).toHaveURL(/\/cv$/);
  // Las rutas del CV cargan en diferido: la clase llega cuando se monta `CvShell`.
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('cv-activo'))).toBe(true);

  await page.goto(`${URL_APP}/`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.body.classList.contains('cv-activo'))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
});
