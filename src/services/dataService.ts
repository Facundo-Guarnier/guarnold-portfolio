import content from "../data/content.yml";
import { supabase } from "../lib/supabase";
import type { Experience, HomeContent, Profile, Project } from "../types";

export interface ContentDatabase {
  identity?: HomeContent["identity"];
  hero?: HomeContent["hero"];
  about_card?: HomeContent["about_card"];
  location?: HomeContent["location"];
  stack?: HomeContent["stack"];
  strengths?: HomeContent["strengths"];
  languages?: HomeContent["languages"];
  interests?: HomeContent["interests"];
  social?: HomeContent["social"];
  experience?: Experience[];
  projects?: Project[];
}

const dbLocal = (content ?? {}) as ContentDatabase;

/**
 * Archivos de `public/assets/`. Lista a mano porque el navegador ⊥ puede listar `public/`; un test
 * verifica que cada entrada exista de verdad. Sirve para resolver rutas relativas que llegan del CV.
 */
export const ARCHIVOS_LOCALES = [
  "profile.jpg",
  "mapa_argentina.png",
  "g_icon.png",
  "guarnold_firma.png",
] as const;

/** Foto de respaldo: cuando el CV trae una ruta que ⊥ existe en este sitio. */
export const AVATAR_POR_DEFECTO = "/assets/profile.jpg";
export const FONDO_MAPA_POR_DEFECTO = "/assets/mapa_argentina.png";

/** Títulos de sección: el RPC los trae solo si el owner los escribió en cv-formatter. */
export const TITULOS_POR_DEFECTO = {
  stack: "Arsenal",
  strengths: "Fortalezas",
  languages: "Idiomas",
  interests: "Más allá del código",
} as const;

const TAMANOS_VALIDOS = ["small", "medium", "large", "tall"];

type Dato = Record<string, unknown>;

const objeto = (valor: unknown): Dato =>
  valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Dato)
    : {};

/** Sección presente (objeto con alguna clave) o `undefined`. */
const seccion = (valor: unknown): Dato | undefined => {
  const datos = objeto(valor);
  return Object.keys(datos).length ? datos : undefined;
};

/** Texto sin espacios sobrantes, o `undefined` si ⊥ es un string con contenido. */
const texto = (valor: unknown): string | undefined => {
  if (typeof valor !== "string") return undefined;
  return valor.trim() || undefined;
};

const lista = <T>(
  valor: unknown,
  mapear: (item: unknown) => T | undefined,
): T[] =>
  Array.isArray(valor)
    ? valor.map(mapear).filter((item): item is T => item !== undefined)
    : [];

const listaDeTextos = (valor: unknown): string[] => lista(valor, texto);

const normalizarTecnologia = (valor: unknown) => {
  const tecnologia = objeto(valor);
  const name = texto(tecnologia.name);
  return name ? { name, icon: texto(tecnologia.icon) } : undefined;
};

/**
 * Imagen de un ítem remoto:
 * - `data:image/...` y URLs http(s) (Storage de Supabase, Unsplash...) ⇒ tal cual.
 * - Ruta `assets/...` (con o sin `/` inicial) ⇒ `/assets/...`, SOLO si el archivo existe.
 * - Cualquier otra cosa ⇒ `undefined`.
 */
export const resolverImagen = (
  url: unknown,
  archivosLocales: readonly string[] = ARCHIVOS_LOCALES,
): string | undefined => {
  const valor = texto(url);
  if (!valor) return undefined;
  if (/^data:image\//i.test(valor) || /^https?:\/\//i.test(valor)) return valor;

  const ruta = valor.replace(/^\/+/, "");
  const prefijo = "assets/";
  if (
    ruta.startsWith(prefijo) &&
    archivosLocales.includes(ruta.slice(prefijo.length))
  ) {
    return `/${ruta}`;
  }
  return undefined;
};

/**
 * Foto de perfil. Sin `avatar_url` ⇒ `undefined`: el owner ocultó la foto (`mostrar.portfolio.foto`)
 * y la UI muestra su placeholder. Con una ruta que ⊥ existe ⇒ la foto de respaldo.
 */
const resolverAvatar = (
  url: unknown,
  archivosLocales: readonly string[],
): string | undefined => {
  if (!texto(url)) return undefined;
  return resolverImagen(url, archivosLocales) ?? AVATAR_POR_DEFECTO;
};

const normalizarStack = (raw: unknown): HomeContent["stack"] => {
  const stack = objeto(raw);
  const groups = lista(stack.groups, (grupo) => {
    const datos = objeto(grupo);
    const technologies = lista(datos.technologies, normalizarTecnologia);
    // Un grupo sin tecnologías dejaría un título huérfano en la tarjeta.
    if (!technologies.length) return undefined;
    return { category: texto(datos.category) ?? "Otros", technologies };
  });

  return {
    title: texto(stack.title) ?? TITULOS_POR_DEFECTO.stack,
    description: texto(stack.description),
    technologies: lista(stack.technologies, normalizarTecnologia),
    groups,
  };
};

const normalizarLista = (raw: unknown, tituloPorDefecto: string) => {
  const datos = objeto(raw);
  return {
    title: texto(datos.title) ?? tituloPorDefecto,
    items: listaDeTextos(datos.items),
  };
};

const normalizarIntereses = (raw: unknown): HomeContent["interests"] => {
  const datos = objeto(raw);
  return {
    title: texto(datos.title) ?? TITULOS_POR_DEFECTO.interests,
    items: lista(datos.items, (interes) => {
      const datosInteres = objeto(interes);
      const name = texto(datosInteres.name);
      return name ? { name, icon: texto(datosInteres.icon) } : undefined;
    }),
  };
};

const normalizarSocial = (raw: unknown): HomeContent["social"] =>
  Object.fromEntries(
    Object.entries(objeto(raw))
      .map(([red, url]) => [red, texto(url)] as const)
      .filter(([, url]) => url !== undefined),
  );

const normalizarExperiencia = (raw: unknown): Experience | undefined => {
  const item = seccion(raw);
  if (!item) return undefined;
  return { ...item, technologies: listaDeTextos(item.technologies) } as Experience;
};

const normalizarProyecto = (
  raw: unknown,
  archivosLocales: readonly string[],
): Project | undefined => {
  const proyecto = seccion(raw);
  if (!proyecto) return undefined;
  const tamano = texto(proyecto.size)?.toLowerCase();

  return {
    ...proyecto,
    id: texto(proyecto.id),
    title: texto(proyecto.title),
    description: texto(proyecto.description),
    link: texto(proyecto.link),
    github_url: texto(proyecto.github_url),
    tags: listaDeTextos(proyecto.tags),
    // BentoGrid ya cae en "small" si ⊥ reconoce el valor; acá ⊥ dejamos pasar basura.
    size: tamano && TAMANOS_VALIDOS.includes(tamano) ? tamano : undefined,
    status: texto(proyecto.status),
    icon: texto(proyecto.icon),
    // Sin imagen, la tarjeta muestra su degradado: es el diseño previsto, ⊥ una imagen inventada.
    image_url: resolverImagen(proyecto.image_url, archivosLocales),
  } as Project;
};

/**
 * Normaliza el jsonb de `"cv-formatter".portfolio_publico()` para que los componentes reciban la
 * misma forma que `content.yml`. Pura (sin red ni `window`) y exportada para testearla.
 *
 * Devuelve `null` si ⊥ hay nombre: sin identidad ⊥ hay perfil que mostrar y se usa el respaldo.
 * ⊥ rellena textos personales (hero, about, descripciones): si el owner los borró, se ven vacíos.
 * Solo rellena lo de diseño: títulos de sección, foto de respaldo y fondo del mapa.
 */
export const normalizarPerfilRemoto = (
  raw: unknown,
  archivosLocales: readonly string[] = ARCHIVOS_LOCALES,
): ContentDatabase | null => {
  const remoto = objeto(raw);
  const identity = objeto(remoto.identity);
  if (!texto(identity.name)) return null;

  const hero = seccion(remoto.hero);
  const aboutCard = seccion(remoto.about_card);
  const location = seccion(remoto.location);

  return {
    identity: {
      ...identity,
      name: texto(identity.name),
      avatar_url: resolverAvatar(identity.avatar_url, archivosLocales),
    } as HomeContent["identity"],
    hero: hero && {
      title: texto(hero.title),
      subtitle: texto(hero.subtitle),
      description: texto(hero.description),
    },
    about_card: aboutCard && {
      title: texto(aboutCard.title),
      role: texto(aboutCard.role),
      description: texto(aboutCard.description),
    },
    location: {
      city: texto(location?.city),
      country: texto(location?.country),
      background_image: FONDO_MAPA_POR_DEFECTO,
    },
    stack: normalizarStack(remoto.stack),
    strengths: normalizarLista(remoto.strengths, TITULOS_POR_DEFECTO.strengths),
    languages: normalizarLista(remoto.languages, TITULOS_POR_DEFECTO.languages),
    interests: normalizarIntereses(remoto.interests),
    social: normalizarSocial(remoto.social),
    experience: lista(remoto.experience, normalizarExperiencia),
    projects: lista(remoto.projects, (proyecto) =>
      normalizarProyecto(proyecto, archivosLocales),
    ),
  };
};

/**
 * La fuente de verdad es Supabase (lo que se edita en cv-formatter, con el interruptor «Portfolio»
 * de cada ítem). `content.yml` queda de RESPALDO: se usa si no hay variables de entorno, si la
 * llamada falla, o si la base todavía ⊥ tiene el perfil cargado (⊥ se mezclan: o una o la otra).
 */
const cargarRemoto = async (): Promise<ContentDatabase | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("portfolio_publico");
    if (error) throw error;
    const perfil = normalizarPerfilRemoto(data);
    if (!perfil) {
      console.warn("[portfolio] Supabase ⊥ tiene perfil publicado, uso content.yml");
    }
    return perfil;
  } catch (err) {
    console.warn("[portfolio] ⊥ se pudo leer Supabase, uso content.yml:", err);
    return null;
  }
};

let enCurso: Promise<ContentDatabase> | null = null;
const cargarDb = (): Promise<ContentDatabase> => {
  enCurso ??= cargarRemoto().then((remoto) => remoto ?? dbLocal);
  return enCurso;
};

export const getHomeContent = async (): Promise<HomeContent | null> => {
  const db = await cargarDb();
  return {
    identity: db.identity,
    hero: db.hero,
    about_card: db.about_card,
    location: db.location,
    stack: db.stack,
    strengths: db.strengths,
    languages: db.languages,
    interests: db.interests,
    social: db.social,
  };
};

export const getProfile = async (): Promise<Profile | null> => {
  const db = await cargarDb();
  return {
    name: db.identity?.name,
    role: db.about_card?.role ?? db.identity?.professional_title,
    bio: db.about_card?.description,
    avatar_url: db.identity?.avatar_url,
    location: [db.location?.city, db.location?.country]
      .filter(Boolean)
      .join(", "),
    location_background_image: db.location?.background_image,
    github_url: db.social?.github,
    linkedin_url: db.social?.linkedin,
  };
};

export const getExperience = async (): Promise<Experience[]> => {
  const db = await cargarDb();
  return (db.experience ?? []).filter(Boolean);
};

export const getProjects = async (): Promise<Project[]> => {
  const db = await cargarDb();
  return (db.projects ?? []).filter(Boolean);
};
