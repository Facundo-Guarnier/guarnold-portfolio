import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerStack, URL_APP, USUARIO_CON_ACCESO } from '../tools/local/entorno.mjs';

/**
 * Lo que el owner hace de verdad, en un navegador, contra el stack local:
 *  1. entra, importa el content.yml del portfolio y lo GUARDA;
 *  2. recarga y los datos siguen ahí;
 *  3. los interruptores CV / Portfolio de un ítem controlan la vista previa del CV y lo que ve
 *     el portfolio (`portfolio_publico()`), una vez guardado.
 *
 * Prerrequisito: `npm run db:local`. El dev server (`vite --mode docker`) lo levanta Playwright.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(AQUI, '..', 'tests', 'fixtures', 'content.yml');
const stack = leerStack();

const EMPRESA = 'Merovingian Data (Híbrido)';

async function entrar(page: Page) {
  await page.goto(`${URL_APP}/login`);
  await page.getByPlaceholder('admin@example.com').fill(USUARIO_CON_ACCESO.email);
  await page.locator('input[type="password"]').fill(USUARIO_CON_ACCESO.clave);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { name: 'VitaeFlow Editor' })).toBeVisible();
}

/** Guarda si hay cambios. Sin cambios el botón está deshabilitado: nada que guardar, y ⊥ es error. */
async function guardar(page: Page) {
  const boton = page.getByRole('button', { name: /Guardar/ });
  if (!(await boton.isEnabled())) return;
  await boton.click();
  // «Sin guardar» desaparece cuando el guardado terminó y el estado quedó sincronizado.
  await expect(page.getByText('Sin guardar', { exact: true })).toHaveCount(0);
}

/** La fila de una experiencia por el nombre de su empresa. */
const filaExperiencia = (page: Page, empresa: string) =>
  page.getByTestId('item-experiencia').filter({ hasText: empresa });

/** El portfolio, como lo lee el sitio: la RPC pública, con la clave anónima. */
async function portfolioPublico(): Promise<Record<string, any>> {
  const r = await fetch(`${stack.apiUrl}/rest/v1/rpc/portfolio_publico`, {
    headers: {
      apikey: stack.anonKey,
      Authorization: `Bearer ${stack.anonKey}`,
      'Accept-Profile': 'cv-formatter',
    },
  });
  expect(r.status, 'portfolio_publico() debe responder 200 al anónimo').toBe(200);
  return r.json();
}

const empresasDelPortfolio = (j: Record<string, any>) =>
  (j.experience as Array<{ company?: string }>).map((e) => e.company);

test('importar content.yml, guardar, recargar y los interruptores CV / Portfolio', async ({ page }) => {
  await entrar(page);

  // 1. Importar el portfolio (sin guardar todavía).
  await page.getByTestId('importar-portfolio-archivo').setInputFiles(FIXTURE);
  await expect(page.getByRole('status')).toContainText('Importado content.yml (sin guardar)');
  // Los conteos dependen del estado previo de la base: una corrida repetida ⊥ tiene nada nuevo y el
  // resumen omite esas líneas. Acá solo se mira que el resumen tenga contenido.
  await expect(page.getByRole('status').locator('li').first()).toBeVisible();

  // 2. Guardar, recargar: los datos persisten.
  await guardar(page);
  await page.reload();
  await expect(filaExperiencia(page, 'Merovingian Data')).toHaveCount(1);
  await expect(filaExperiencia(page, 'Tinkin')).toHaveCount(1);
  await expect(page.getByPlaceholder('Arsenal').first()).toHaveValue('Arsenal');

  // 3. CV: lo importado va solo al portfolio, así que el interruptor CV queda apagado. Si una corrida
  //    anterior lo prendió y guardó, lo apagamos (sin guardar: la vista previa ya lo refleja).
  const fila = filaExperiencia(page, 'Merovingian Data');
  const chipCv = fila.getByRole('button', { name: /en el CV/ });
  const chipPortfolio = fila.getByRole('button', { name: /en el portfolio/ });
  if ((await chipCv.getAttribute('aria-pressed')) === 'true') await chipCv.click();
  await expect(chipCv).toHaveAttribute('aria-pressed', 'false');
  await expect(chipPortfolio).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('vista-cv')).not.toContainText(EMPRESA);

  //    Prender CV: la vista previa la muestra al instante (sin guardar).
  await chipCv.click();
  await expect(chipCv).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('vista-cv')).toContainText('Merovingian Data');

  //    Apagar Portfolio, guardar: el portfolio ⊥ la lista más.
  await chipPortfolio.click();
  await guardar(page);
  expect(empresasDelPortfolio(await portfolioPublico())).not.toContain(EMPRESA);

  //    Prenderlo de nuevo, guardar: vuelve.
  await chipPortfolio.click();
  await guardar(page);
  await page.reload();
  const j = await portfolioPublico();
  expect(empresasDelPortfolio(j)).toContain(EMPRESA);
  expect(j.identity.name).toBe('Facundo Guarnier');
  expect(j.identity.nickname).toBe('Guarnold');
  expect(j.location).toMatchObject({ city: 'Mendoza', country: 'Argentina' });
  expect(j.hero.title).toBe('Hola, soy Facundo Guarnier.');
  expect(j.stack.groups.map((g: { category: string }) => g.category)).toEqual(['Lenguajes', 'Frameworks', 'DevOps']);
  expect(j.strengths.items).toContain('Prudencia');
  expect(j.social.github).toBe('https://github.com/Facundo-Guarnier');

  // 4. El CV del owner (en pantalla) sigue reflejando el chip después del reload.
  await expect(filaExperiencia(page, 'Merovingian Data').getByRole('button', { name: /en el CV/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('vista-cv')).toContainText('Merovingian Data');
});

test('«Usar el portfolio de este sitio» importa el content.yml empaquetado, sin archivo', async ({ page }) => {
  await entrar(page);

  await page.getByRole('button', { name: 'Usar el portfolio de este sitio' }).click();
  // El YAML del bundle es el mismo que sirve el portfolio: su resumen lo nombra y trae líneas.
  await expect(page.getByRole('status')).toContainText('Importado content.yml de este sitio (sin guardar)');
  await expect(page.getByRole('status').locator('li').first()).toBeVisible();
  // La foto del portfolio (`/assets/profile.jpg`) ⊥ genera aviso: vive en este mismo sitio.
  await expect(page.getByRole('status')).not.toContainText('profile.jpg');
});
