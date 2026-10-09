import { expect, test } from "@playwright/test";
import {
  FIXTURE_RPC,
  interceptarAperturas,
  registrarErroresDePagina,
  simularRpc,
} from "./helpers";

// Datos que el YAML ⊥ tiene: si aparecen en pantalla, el dato vino de la RPC y ⊥ del respaldo.
const remoto = structuredClone(FIXTURE_RPC);
remoto.hero.title = "Hola desde Supabase.";
remoto.projects[0].title = "Proyecto remoto de prueba";
remoto.projects[0].link = "https://proyecto-remoto.example.com/";
const trabajo = remoto.experience.find((e: { type: string }) => e.type === "work");
trabajo.company = "Empresa remota SRL";

test("Home muestra el perfil y las secciones que llegan de la RPC", async ({ page }, testInfo) => {
  const rpc = await simularRpc(page, { body: remoto });
  const errores = registrarErroresDePagina(page);

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola desde Supabase.");
  await expect(page.getByRole("heading", { name: "Sobre Mí" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Facundo Guarnier" })).toHaveAttribute(
    "src",
    "/assets/profile.jpg",
  );
  await expect(page.getByRole("heading", { name: "Arsenal" })).toBeVisible();
  for (const categoria of ["Lenguajes", "Frameworks", "DevOps"]) {
    await expect(page.getByRole("heading", { name: categoria, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Python • TypeScript • Dart • SQL")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Más allá del código" })).toBeVisible();
  await expect(page.getByText("Domótica", { exact: true })).toBeVisible();
  await expect(page.getByText("Mendoza")).toBeVisible();
  await expect(page.locator(`a[href="${remoto.social.github}"]`).first()).toBeVisible();

  expect(rpc.llamadas()).toBeGreaterThan(0);
  expect(errores).toEqual([]);
  await testInfo.attach("home-supabase.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("Projects muestra las tarjetas remotas y el link de cada proyecto", async ({ page }, testInfo) => {
  await simularRpc(page, { body: remoto });
  await interceptarAperturas(page);
  const errores = registrarErroresDePagina(page);

  await page.goto("/projects");

  const tarjeta = page.locator("article", { hasText: "Proyecto remoto de prueba" });
  await expect(tarjeta).toBeVisible();
  await expect(page.locator("article")).toHaveCount(remoto.projects.length);

  // Con imagen ⇒ <img>; sin imagen ⇒ degradado (diseño previsto, ⊥ error).
  const conImagen = remoto.projects.filter((p: { image_url?: string }) => p.image_url).length;
  await expect(page.locator("article img")).toHaveCount(conImagen);

  // Clic en el título: la tarjeta abre el link remoto, ⊥ el del YAML.
  await tarjeta.getByRole("heading").click();
  expect(await page.evaluate(() => (window as unknown as { __aperturas: string[] }).__aperturas))
    .toEqual(["https://proyecto-remoto.example.com/"]);

  expect(errores).toEqual([]);
  await testInfo.attach("projects-supabase.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("Trajectory muestra la experiencia y la educación remotas", async ({ page }, testInfo) => {
  await simularRpc(page, { body: remoto });
  const errores = registrarErroresDePagina(page);

  await page.goto("/trajectory");

  await expect(page.getByText("Empresa remota SRL")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experiencia Profesional" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Educación" })).toBeVisible();
  await expect(page.getByText("Universidad de Mendoza")).toBeVisible();
  // Un título por entrada: experiencia + educación.
  await expect(page.locator("h3")).toHaveCount(remoto.experience.length);

  expect(errores).toEqual([]);
  await testInfo.attach("trajectory-supabase.png", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
