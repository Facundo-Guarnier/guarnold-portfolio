import type {
  CVData,
  Educacion,
  Experiencia,
  LinkObj,
  PerfilItem,
  PortfolioTextos,
  Proyecto,
  Skill,
  TipoPerfilItem,
} from '@/cv/types/cv';
import { calcularPeriodo } from '@/cv/lib/visibilidad';

/**
 * Importa el `content.yml` del portfolio (`guarnold-portfolio/src/data/content.yml`) al estado del
 * editor. Función PURA: ⊥ toca Supabase ni el DOM. El que la llama aplica el resultado en memoria y
 * el owner lo revisa y lo guarda con el botón «Guardar» de siempre.
 *
 * ## Regla de fusión
 *
 * - Lo que el YAML trae con valor, pisa. El portfolio es la fuente que se está migrando.
 * - Los ítems se buscan en el CV: si existen (mismo nombre, normalizado), se actualizan y se marcan
 *   `enPortfolio`. Si no, se agregan con `enCv: false`: el owner decide si también van al CV.
 * - Los campos que solo el CV conoce (puesto, descripción larga, ...) se conservan si ya tienen valor.
 * - Lo que ⊥ tiene destino en la base queda en `avisos`, ⊥ se descarta en silencio.
 *
 * 🔗 Mapeo completo y motivos: docs en el encabezado de `supabase/migrations/20261008180000_*.sql`.
 */

export interface OpcionesImportacion {
  /** Id temporal para los ítems nuevos (`temp_…`, así el guardado los inserta). Inyectable en tests. */
  nuevoId?: () => string;
}

export interface ResumenImportacion {
  /** Campos de identidad/ubicación que cambiaron. */
  identidad: string[];
  /** Textos del portfolio (hero, about, títulos de sección) que cambiaron. */
  textosPortfolio: number;
  skills: { nuevas: number; actualizadas: number };
  perfil: { nuevos: number; actualizados: number };
  links: { nuevos: number; actualizados: number };
  experiencia: { nuevas: number; actualizadas: number };
  educacion: { nuevas: number; actualizadas: number };
  proyectos: { nuevos: number; actualizados: number };
  /** Cosas que el YAML trae y la base no tiene dónde guardar, o datos que no se pudieron usar. */
  avisos: string[];
}

export interface ResultadoImportacion {
  data: CVData;
  resumen: ResumenImportacion;
}

export class ErrorImportacion extends Error {}

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

const objeto = (v: unknown): Record<string, unknown> | undefined =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Texto recortado, o `undefined` si ⊥ hay nada útil. */
const texto = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
};

const mes = (v: unknown): string | undefined => {
  const t = texto(v);
  return t && RE_MES.test(t) ? t : undefined;
};

/**
 * Clave de comparación: sin paréntesis («Merovingian Data (Híbrido)» → «merovingian data»), sin
 * tildes, minúsculas, espacios colapsados. Es lo que hace que «Español (Nativo)» case con «Español».
 */
export const normalizarNombre = (s: string): string =>
  s
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const generarIdTemporal = (): string =>
  `temp_portfolio_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** Compara antes/después: `true` si el objeto cambió. Así el resumen cuenta solo lo que cambió de verdad. */
function aplicar<T extends object>(destino: T, cambios: Partial<T>): boolean {
  const antes = JSON.stringify(destino);
  Object.assign(destino, cambios);
  return JSON.stringify(destino) !== antes;
}

/** Valor del portfolio si viene; si ⊥, el que ya había. */
const siVino = <T>(nuevo: T | undefined, previo: T): T => (nuevo === undefined ? previo : nuevo);

const LABELS_SOCIAL: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

const esUrlUtil = (u: string | undefined): u is string => !!u && /^https?:\/\//i.test(u);

export function importarPortfolio(
  actual: CVData,
  yml: unknown,
  opciones: OpcionesImportacion = {},
): ResultadoImportacion {
  const raiz = objeto(yml);
  if (!raiz) {
    throw new ErrorImportacion('El archivo no es un content.yml válido: la raíz tiene que ser un objeto YAML.');
  }

  const nuevoId = opciones.nuevoId ?? generarIdTemporal;
  // Copia profunda: el estado anterior ⊥ se toca (el hook lo compara para saber si hay cambios).
  const data: CVData = structuredClone(actual);
  const avisos: string[] = [];
  const resumen: ResumenImportacion = {
    identidad: [],
    textosPortfolio: 0,
    skills: { nuevas: 0, actualizadas: 0 },
    perfil: { nuevos: 0, actualizados: 0 },
    links: { nuevos: 0, actualizados: 0 },
    experiencia: { nuevas: 0, actualizadas: 0 },
    educacion: { nuevas: 0, actualizadas: 0 },
    proyectos: { nuevos: 0, actualizados: 0 },
    avisos,
  };

  // --- Identidad y ubicación -------------------------------------------------
  const identity = objeto(raiz.identity);
  const personal = data.personal;
  if (identity) {
    const avatar = texto(identity.avatar_url);
    const cambios: Array<[string, boolean]> = [
      ['nombre', aplicar(personal, { nombre: siVino(texto(identity.name), personal.nombre) })],
      ['apodo', aplicar(personal, { apodo: siVino(texto(identity.nickname), personal.apodo ?? '') })],
      ['título', aplicar(personal, { titulo: siVino(texto(identity.professional_title), personal.titulo) })],
      ['foto', aplicar(personal, { foto: siVino(avatar, personal.foto ?? '') })],
    ];
    resumen.identidad.push(...cambios.filter(([, c]) => c).map(([n]) => n));
    // La foto `/assets/…` vive en este mismo sitio (CV y portfolio son una app): se ve en el CV sin aviso.
  }

  const location = objeto(raiz.location);
  if (location) {
    const ciudad = texto(location.city);
    const pais = texto(location.country);
    const cambios: Array<[string, boolean]> = [
      ['ciudad', aplicar(personal, { ciudad: siVino(ciudad, personal.ciudad ?? '') })],
      ['país', aplicar(personal, { pais: siVino(pais, personal.pais ?? '') })],
    ];
    // «ubicacion» es el texto que usa el CV; si el owner ⊥ lo cargó, sale de ciudad y país.
    if (!personal.ubicacion && (ciudad || pais)) {
      aplicar(personal, { ubicacion: [ciudad, pais].filter(Boolean).join(', ') });
      cambios.push(['ubicación', true]);
    }
    resumen.identidad.push(...cambios.filter(([, c]) => c).map(([n]) => n));
    if (location.background_image !== undefined) {
      avisos.push('location.background_image no tiene destino en el CV: se omite (es una imagen del portfolio).');
    }
  }

  // --- Textos del portfolio (hero, about, títulos) ----------------------------
  // Cada bloque: solo los campos que el YAML trae; el resto queda como estaba.
  const textos = (clave: keyof PortfolioTextos, campos: string[], origen: unknown) => {
    const o = objeto(origen);
    if (!o) return;
    const previo = (data.portfolio[clave] ?? {}) as Record<string, string | undefined>;
    const nuevo: Record<string, string | undefined> = { ...previo };
    for (const c of campos) {
      const v = texto(o[c]);
      if (v !== undefined) nuevo[c] = v;
    }
    const cambiados = campos.filter((c) => nuevo[c] !== previo[c]).length;
    if (cambiados > 0) {
      resumen.textosPortfolio += cambiados;
      (data.portfolio as Record<string, unknown>)[clave] = nuevo;
    }
  };
  textos('hero', ['title', 'subtitle', 'description'], raiz.hero);
  textos('about_card', ['title', 'role', 'description'], raiz.about_card);
  const stack = objeto(raiz.stack);
  textos('stack', ['title', 'description'], stack);
  textos('strengths', ['title'], objeto(raiz.strengths));
  textos('languages', ['title'], objeto(raiz.languages));
  textos('interests', ['title'], objeto(raiz.interests));

  // --- Stack → habilidades ----------------------------------------------------
  const skills: Skill[] = data.skills;
  const importarTecnologia = (t: unknown, categoria: string | undefined) => {
    const o = objeto(t);
    const nombre = texto(o?.name) ?? texto(t);
    if (!nombre) return;
    const icono = texto(o?.icon);
    const existente = skills.find((s) => normalizarNombre(s.nombre) === normalizarNombre(nombre));
    if (existente) {
      const cambio = aplicar(existente, {
        enPortfolio: true,
        ...(categoria !== undefined ? { categoria } : {}),
        ...(icono !== undefined ? { icono } : {}),
      });
      if (cambio) resumen.skills.actualizadas++;
    } else {
      skills.push({
        id: nuevoId(),
        nombre,
        nivel: 0,
        categoria,
        icono,
        enCv: false,
        enPortfolio: true,
      });
      resumen.skills.nuevas++;
    }
  };
  if (stack) {
    for (const grupo of lista(stack.groups)) {
      const g = objeto(grupo);
      if (!g) continue;
      const categoria = texto(g.category);
      for (const t of lista(g.technologies)) importarTecnologia(t, categoria);
    }
    // El YAML del portfolio ⊥ usa esta forma, pero el tipo la admite: sin categoría.
    for (const t of lista(stack.technologies)) importarTecnologia(t, undefined);
  }

  // --- Idiomas, fortalezas e intereses → perfil_items -------------------------
  const perfil: PerfilItem[] = data.perfilItems;
  const importarItem = (tipo: TipoPerfilItem, nombre: string, icono?: string) => {
    const existente = perfil.find((i) => i.tipo === tipo && normalizarNombre(i.texto) === normalizarNombre(nombre));
    if (existente) {
      const cambio = aplicar(existente, {
        enPortfolio: true,
        ...(icono !== undefined ? { icono } : {}),
      });
      if (cambio) resumen.perfil.actualizados++;
    } else {
      perfil.push({ id: nuevoId(), tipo, texto: nombre, icono, enCv: false, enPortfolio: true });
      resumen.perfil.nuevos++;
    }
  };
  for (const [clave, tipo] of [
    ['strengths', 'fortaleza'],
    ['languages', 'idioma'],
  ] as const) {
    for (const v of lista(objeto(raiz[clave])?.items)) {
      const nombre = texto(v);
      if (nombre) importarItem(tipo, nombre);
    }
  }
  for (const v of lista(objeto(raiz.interests)?.items)) {
    const o = objeto(v);
    const nombre = texto(o?.name) ?? texto(v);
    if (nombre) importarItem('interes', nombre, texto(o?.icon));
  }

  // --- Redes sociales → links ---------------------------------------------------
  const social = objeto(raiz.social);
  const links: LinkObj[] = personal.links;
  for (const [plataforma, valor] of Object.entries(social ?? {})) {
    const url = texto(valor);
    const clave = plataforma.toLowerCase();
    if (!url) continue;
    const existente = links.find((l) => (l.platform ?? '').toLowerCase() === clave);
    if (existente) {
      if (existente.url && existente.url !== url) {
        avisos.push(`${plataforma}: el CV tiene «${existente.url}»; se conservó esa URL y no «${url}».`);
      }
      const cambio = aplicar(existente, {
        enPortfolio: true,
        ...(!existente.url ? { url } : {}),
      });
      if (cambio) resumen.links.actualizados++;
    } else {
      links.push({
        id: nuevoId(),
        label: LABELS_SOCIAL[clave] ?? plataforma.charAt(0).toUpperCase() + plataforma.slice(1),
        url,
        platform: clave,
        enCv: false,
        enPortfolio: true,
      });
      resumen.links.nuevos++;
    }
  }

  // --- Experiencia y educación --------------------------------------------------
  const experiencias: Experiencia[] = data.experiencia;
  const educaciones: Educacion[] = data.educacion;

  for (const entrada of lista(raiz.experience)) {
    const o = objeto(entrada);
    if (!o) continue;
    const id = texto(o.id) ?? '(sin id)';
    const tipo = texto(o.type) ?? 'work';
    const inicio = mes(o.start_date);
    const fin = mes(o.end_date);
    const descripcion = texto(o.description);
    const estado = texto(o.status);
    const tecnologias = lista(o.technologies).map(texto).filter((t): t is string => !!t);
    // Sin `is_completed` se asume en curso: es el caso que el portfolio ⊥ marca como terminado.
    const enCurso = o.is_completed !== true;

    if (texto(o.start_date) && !inicio) avisos.push(`${id}: start_date «${o.start_date}» no es YYYY-MM; no se importó la fecha.`);
    if (texto(o.end_date) && !fin) avisos.push(`${id}: end_date «${o.end_date}» no es YYYY-MM; no se importó la fecha.`);

    const fechas = { fechaInicio: inicio ?? '', fechaFin: enCurso ? '' : fin ?? '', enCurso };

    if (tipo === 'education') {
      const institucion = texto(o.institution);
      if (!institucion) {
        avisos.push(`${id}: education sin institution; se omite.`);
        continue;
      }
      const titulo = texto(o.title) ?? '';
      const existente = educaciones.find((e) => normalizarNombre(e.institucion) === normalizarNombre(institucion));
      if (existente) {
        const cambio = aplicar(existente, {
          ...fechas,
          enPortfolio: true,
          ...(descripcion ? { descripcionCorta: descripcion } : {}),
          ...(!existente.titulo && titulo ? { titulo } : {}),
          ...(!existente.descripcion && descripcion ? { descripcion } : {}),
          ...(!existente.tecnologias?.length && tecnologias.length ? { tecnologias } : {}),
          ...(!existente.estado && estado ? { estado } : {}),
        });
        aplicar(existente, { periodo: calcularPeriodo(existente) });
        if (cambio) resumen.educacion.actualizadas++;
      } else {
        educaciones.push({
          id: nuevoId(),
          institucion,
          titulo,
          periodo: calcularPeriodo({ periodo: '', ...fechas }),
          descripcion: descripcion ?? '',
          descripcionCorta: descripcion,
          tecnologias,
          estado: estado ?? '',
          ...fechas,
          enCv: false,
          enPortfolio: true,
        });
        resumen.educacion.nuevas++;
      }
      continue;
    }

    if (tipo !== 'work') {
      avisos.push(`${id}: type «${tipo}» desconocido; se omite.`);
      continue;
    }
    const empresa = texto(o.company);
    if (!empresa) {
      avisos.push(`${id}: work sin company; se omite.`);
      continue;
    }
    const puesto = texto(o.role) ?? '';
    const existente = experiencias.find((e) => normalizarNombre(e.empresa) === normalizarNombre(empresa));
    if (existente) {
      const cambio = aplicar(existente, {
        ...fechas,
        enPortfolio: true,
        ...(descripcion ? { descripcionCorta: descripcion } : {}),
        ...(!existente.puesto && puesto ? { puesto } : {}),
        ...(!existente.descripcion && descripcion ? { descripcion } : {}),
        ...(!existente.tecnologias?.length && tecnologias.length ? { tecnologias } : {}),
        ...(!existente.estado && estado ? { estado } : {}),
      });
      aplicar(existente, { periodo: calcularPeriodo(existente) });
      if (cambio) resumen.experiencia.actualizadas++;
    } else {
      experiencias.push({
        id: nuevoId(),
        empresa,
        puesto,
        periodo: calcularPeriodo({ periodo: '', ...fechas }),
        descripcion: descripcion ?? '',
        descripcionCorta: descripcion,
        tecnologias,
        estado: estado ?? '',
        ...fechas,
        enCv: false,
        enPortfolio: true,
      });
      resumen.experiencia.nuevas++;
    }
  }

  // --- Proyectos ----------------------------------------------------------------
  const proyectos: Proyecto[] = data.proyectos;
  for (const entrada of lista(raiz.projects)) {
    const o = objeto(entrada);
    if (!o) continue;
    const slug = texto(o.id);
    const nombre = texto(o.title) ?? slug;
    if (!nombre) {
      avisos.push('Un proyecto no tiene id ni title; se omite.');
      continue;
    }
    const descripcion = texto(o.description);
    // `link: "#"` es el placeholder del portfolio para «sin enlace»: ⊥ es una URL.
    const link = esUrlUtil(texto(o.link)) ? texto(o.link) : undefined;
    const github = esUrlUtil(texto(o.github_url)) ? texto(o.github_url) : undefined;
    const tags = lista(o.tags).map(texto).filter((t): t is string => !!t);
    const tamano = texto(o.size);
    const estado = texto(o.status);
    const icono = texto(o.icon);
    const imagenUrl = texto(o.image_url);

    const existente =
      (slug ? proyectos.find((p) => p.slug === slug) : undefined) ??
      proyectos.find((p) => normalizarNombre(p.nombre) === normalizarNombre(nombre));

    if (existente) {
      const cambio = aplicar(existente, {
        enPortfolio: true,
        ...(!existente.slug && slug ? { slug } : {}),
        ...(descripcion ? { descripcionCorta: descripcion } : {}),
        ...(!existente.descripcion && descripcion ? { descripcion } : {}),
        ...(!existente.url && link ? { url: link } : {}),
        ...(!existente.githubUrl && github ? { githubUrl: github } : {}),
        ...(tags.length ? { tags } : {}),
        ...(!existente.tecnologias && tags.length ? { tecnologias: tags.join(', ') } : {}),
        ...(tamano ? { tamano } : {}),
        ...(estado ? { estado } : {}),
        ...(icono ? { icono } : {}),
        ...(imagenUrl ? { imagenUrl } : {}),
      });
      if (cambio) resumen.proyectos.actualizados++;
    } else {
      proyectos.push({
        id: nuevoId(),
        nombre,
        descripcion: descripcion ?? '',
        descripcionCorta: descripcion,
        tecnologias: tags.join(', '),
        url: link,
        slug,
        githubUrl: github,
        tags,
        tamano,
        estado,
        icono,
        imagenUrl,
        enCv: false,
        enPortfolio: true,
      });
      resumen.proyectos.nuevos++;
    }
  }

  return { data, resumen };
}

/** Líneas legibles para mostrar al owner. ⊥ incluye las secciones sin cambios. */
export function lineasResumen(r: ResumenImportacion): string[] {
  const out: string[] = [];
  const cuenta = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  if (r.identidad.length) out.push(`Datos personales: ${r.identidad.join(', ')}.`);
  if (r.textosPortfolio) out.push(cuenta(r.textosPortfolio, 'texto del portfolio actualizado', 'textos del portfolio actualizados') + '.');
  const par = (nombre: string, s: { nuevas?: number; nuevos?: number; actualizadas?: number; actualizados?: number }) => {
    const n = s.nuevas ?? s.nuevos ?? 0;
    const a = s.actualizadas ?? s.actualizados ?? 0;
    if (n || a) out.push(`${nombre}: ${n} nuevos, ${a} actualizados.`);
  };
  par('Habilidades', r.skills);
  par('Idiomas, fortalezas e intereses', r.perfil);
  par('Redes', r.links);
  par('Experiencia', r.experiencia);
  par('Educación', r.educacion);
  par('Proyectos', r.proyectos);
  if (out.length === 0) out.push('No había nada nuevo para importar.');
  return out;
}
