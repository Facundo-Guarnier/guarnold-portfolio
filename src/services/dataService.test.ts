// @vitest-environment node
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import contenidoYml from "../data/content.yml";
import {
  ARCHIVOS_LOCALES,
  AVATAR_POR_DEFECTO,
  FONDO_MAPA_POR_DEFECTO,
  normalizarPerfilRemoto,
  resolverImagen,
} from "./dataService";

// content.yml tipado a mano: el declarado global es Record<string, unknown>.
const contentYml = contenidoYml as unknown as {
  identity: { name: string };
  hero: { title: string };
  projects: { id: string }[];
  experience: unknown[];
};

// Forma de "cv-formatter".portfolio_publico(), generada desde content.yml.
const fixture = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../tests/fixtures/portfolio_publico.json", import.meta.url)),
    "utf8",
  ),
);

const cargarServicio = async (cliente: unknown) => {
  vi.resetModules();
  vi.doMock("../lib/supabase", () => ({ supabase: cliente, supabaseConfigurado: cliente !== null }));
  return import("./dataService");
};

const clienteConRpc = (resultado: () => Promise<unknown>) => {
  const rpc = vi.fn(resultado);
  return { cliente: { rpc }, rpc };
};

describe("normalizarPerfilRemoto", () => {
  it("normaliza el fixture de la RPC a la forma de content.yml", () => {
    const perfil = normalizarPerfilRemoto(fixture);

    expect(perfil?.identity?.name).toBe("Facundo Guarnier");
    expect(perfil?.projects).toHaveLength(fixture.projects.length);
    expect(perfil?.experience).toHaveLength(fixture.experience.length);
    expect(perfil?.stack?.groups?.map((g) => g.category)).toEqual(
      fixture.stack.groups.map((g: { category: string }) => g.category),
    );
    expect(perfil?.social).toEqual({
      github: fixture.social.github,
      linkedin: fixture.social.linkedin,
    });
  });

  it("devuelve null si no hay objeto, ⊥ hay nombre o el nombre es vacío", () => {
    expect(normalizarPerfilRemoto(null)).toBeNull();
    expect(normalizarPerfilRemoto("texto")).toBeNull();
    expect(normalizarPerfilRemoto({})).toBeNull();
    expect(normalizarPerfilRemoto({ identity: { name: "   " } })).toBeNull();
    expect(normalizarPerfilRemoto({ identity: { name: "Ana" } })).not.toBeNull();
  });

  describe("foto de perfil", () => {
    const conAvatar = (avatar_url: unknown) =>
      normalizarPerfilRemoto({ identity: { name: "Ana", avatar_url } })?.identity?.avatar_url;

    it("sin avatar (foto oculta en /admin) queda sin foto: placeholder de la UI", () => {
      expect(conAvatar(undefined)).toBeUndefined();
      expect(conAvatar(null)).toBeUndefined();
      expect(conAvatar("   ")).toBeUndefined();
    });

    it("ruta relativa a assets que existe en public/assets ⇒ /assets", () => {
      expect(conAvatar("assets/profile.jpg")).toBe("/assets/profile.jpg");
      expect(conAvatar("/assets/profile.jpg")).toBe("/assets/profile.jpg");
    });

    it("ruta que no existe en este sitio ⇒ foto de respaldo", () => {
      expect(conAvatar("assets/no-existe.jpg")).toBe(AVATAR_POR_DEFECTO);
      expect(conAvatar("otra/carpeta/foto.jpg")).toBe(AVATAR_POR_DEFECTO);
      expect(conAvatar("javascript:alert(1)")).toBe(AVATAR_POR_DEFECTO);
    });

    it("data: URL del editor y URLs https se mantienen tal cual", () => {
      const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
      expect(conAvatar(dataUrl)).toBe(dataUrl);
      expect(conAvatar("https://cdn.example.com/foto.jpg")).toBe("https://cdn.example.com/foto.jpg");
    });
  });

  describe("resolverImagen", () => {
    it("solo resuelve archivos locales que existen", () => {
      expect(resolverImagen("assets/mapa_argentina.png")).toBe("/assets/mapa_argentina.png");
      expect(resolverImagen("assets/fantasma.png")).toBeUndefined();
      expect(resolverImagen("")).toBeUndefined();
      expect(resolverImagen(42)).toBeUndefined();
    });
  });

  it("rellena títulos de sección que el RPC no trae", () => {
    const perfil = normalizarPerfilRemoto({ identity: { name: "Ana" } });

    expect(perfil?.stack?.title).toBe("Arsenal");
    expect(perfil?.strengths?.title).toBe("Fortalezas");
    expect(perfil?.languages?.title).toBe("Idiomas");
    expect(perfil?.interests?.title).toBe("Más allá del código");
    expect(perfil?.strengths?.items).toEqual([]);
    expect(perfil?.projects).toEqual([]);
    expect(perfil?.experience).toEqual([]);
  });

  it("no inventa textos personales: hero y about quedan sin datos si ⊥ vienen", () => {
    const perfil = normalizarPerfilRemoto({ identity: { name: "Ana" } });

    expect(perfil?.hero).toBeUndefined();
    expect(perfil?.about_card).toBeUndefined();
  });

  it("usa el fondo del mapa propio del sitio, nunca uno del perfil remoto", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      location: { city: "Córdoba", country: "Argentina", background_image: "https://evil.example/x.png" },
    });

    expect(perfil?.location).toEqual({
      city: "Córdoba",
      country: "Argentina",
      background_image: FONDO_MAPA_POR_DEFECTO,
    });
  });

  it("sin ubicación (oculta en /admin) no inventa ciudad", () => {
    const perfil = normalizarPerfilRemoto({ identity: { name: "Ana" } });

    expect(perfil?.location?.city).toBeUndefined();
    expect(perfil?.location?.country).toBeUndefined();
    expect(perfil?.location?.background_image).toBe(FONDO_MAPA_POR_DEFECTO);
  });

  it("descarta grupos de stack sin tecnologías y pone categoría por defecto", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      stack: {
        groups: [
          { category: "Vacío", technologies: [] },
          { technologies: [{ name: "Python", icon: "code" }, { name: "  " }] },
          { category: "Sin nombre", technologies: [{ icon: "code" }] },
        ],
      },
    });

    expect(perfil?.stack?.groups).toEqual([
      { category: "Otros", technologies: [{ name: "Python", icon: "code" }] },
    ]);
  });

  it("proyectos: tamaño inválido ⇒ undefined (BentoGrid usa small); en mayúsculas se normaliza", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      projects: [
        { id: "a", title: "A", size: "gigante" },
        { id: "b", title: "B", size: "LARGE" },
        { id: "c", title: "C" },
      ],
    });

    expect(perfil?.projects?.map((p) => p.size)).toEqual([undefined, "large", undefined]);
  });

  it("proyectos sin imagen ⇒ sin image_url (tarjeta con degradado); sin tags ⇒ []", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      projects: [{ id: "a", title: "A", link: "#" }],
    });

    expect(perfil?.projects?.[0].image_url).toBeUndefined();
    expect(perfil?.projects?.[0].tags).toEqual([]);
    expect(perfil?.projects?.[0].link).toBe("#");
  });

  it("experiencia sin technologies ⇒ [], y se descartan entradas vacías", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      experience: [null, { id: "work-1", type: "work", role: "Dev" }],
    });

    expect(perfil?.experience).toEqual([
      { id: "work-1", type: "work", role: "Dev", technologies: [] },
    ]);
  });

  it("social: solo quedan URLs con contenido", () => {
    const perfil = normalizarPerfilRemoto({
      identity: { name: "Ana" },
      social: { github: "https://github.com/ana", linkedin: "", twitter: null },
    });

    expect(perfil?.social).toEqual({ github: "https://github.com/ana" });
  });

  it("cada archivo de ARCHIVOS_LOCALES existe de verdad en public/assets", () => {
    for (const archivo of ARCHIVOS_LOCALES) {
      const ruta = fileURLToPath(new URL(`../../public/assets/${archivo}`, import.meta.url));
      expect(existsSync(ruta), archivo).toBe(true);
    }
  });
});

describe("dataService: elección de origen", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.doUnmock("../lib/supabase");
  });

  it("sin variables de entorno (cliente null) ⇒ content.yml, sin llamar a nada", async () => {
    const servicio = await cargarServicio(null);

    const home = await servicio.getHomeContent();
    expect(home?.hero?.title).toBe(contentYml.hero.title);
    expect((await servicio.getProjects()).length).toBe(contentYml.projects.length);
  });

  it("error de la RPC ⇒ content.yml y aviso en consola", async () => {
    const { cliente, rpc } = clienteConRpc(async () => ({
      data: null,
      error: { message: "boom" },
    }));
    const servicio = await cargarServicio(cliente);

    const home = await servicio.getHomeContent();

    expect(rpc).toHaveBeenCalledWith("portfolio_publico");
    expect(home?.hero?.title).toBe(contentYml.hero.title);
    expect(warn).toHaveBeenCalled();
  });

  it("la RPC lanza una excepción ⇒ content.yml", async () => {
    const { cliente } = clienteConRpc(async () => {
      throw new Error("red caída");
    });
    const servicio = await cargarServicio(cliente);

    expect((await servicio.getExperience()).length).toBe(contentYml.experience.length);
  });

  it("resultado vacío (⊥ hay perfil publicado) ⇒ content.yml", async () => {
    const { cliente } = clienteConRpc(async () => ({ data: null, error: null }));
    const servicio = await cargarServicio(cliente);

    expect((await servicio.getHomeContent())?.identity?.name).toBe(contentYml.identity.name);
  });

  it("resultado sin identity.name ⇒ content.yml", async () => {
    const { cliente } = clienteConRpc(async () => ({
      data: { projects: [{ id: "x", title: "Solo" }] },
      error: null,
    }));
    const servicio = await cargarServicio(cliente);

    expect((await servicio.getProjects()).map((p) => p.id)).toEqual(
      contentYml.projects.map((p) => p.id),
    );
  });

  it("resultado válido ⇒ datos remotos normalizados, una sola llamada para todos los getters", async () => {
    const { cliente, rpc } = clienteConRpc(async () => ({ data: fixture, error: null }));
    const servicio = await cargarServicio(cliente);

    const home = await servicio.getHomeContent();
    const proyectos = await servicio.getProjects();
    const experiencia = await servicio.getExperience();
    const perfil = await servicio.getProfile();

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(home?.identity?.name).toBe(fixture.identity.name);
    expect(proyectos.map((p) => p.id)).toEqual(
      fixture.projects.map((p: { id: string }) => p.id),
    );
    expect(experiencia.map((e) => e.id)).toEqual(
      fixture.experience.map((e: { id: string }) => e.id),
    );
    expect(perfil?.github_url).toBe(fixture.social.github);
    expect(perfil?.location).toBe("Mendoza, Argentina");
  });
});
