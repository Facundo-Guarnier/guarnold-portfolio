
/**
 * Dónde se muestra cada ítem. El CV y el portfolio leen la MISMA fila; estas banderas deciden
 * en cuál de los dos aparece (⊥ seguridad: el CV es público). Backend: columnas `en_cv` /
 * `en_portfolio` — ver supabase/migrations/20261008180000_cv_formatter_perfil_compartido.sql.
 */
export interface Visibilidad {
  enCv: boolean;
  enPortfolio: boolean;
}

export interface LinkObj extends Visibilidad {
  id: string;
  label: string;
  url: string;
  platform?: string; // 'linkedin' | 'github' | 'twitter' | etc.
}

/** Qué datos del perfil se ven en cada lado. Ausente = el default de `lib/visibilidad.ts`. */
export type DatoPerfil = 'email' | 'telefono' | 'foto' | 'ubicacion';
export type Mostrar = {
  cv?: Partial<Record<DatoPerfil, boolean>>;
  portfolio?: Partial<Record<DatoPerfil, boolean>>;
};

export interface Personal {
  nombre: string;
  /** Cómo te dicen (el portfolio lo muestra: «También me dicen Guarnold»). */
  apodo?: string;
  titulo: string;
  email: string;
  telefono: string;
  ubicacion: string;
  /** Opcionales: el portfolio los muestra separados; si faltan usa `ubicacion`. */
  ciudad?: string;
  pais?: string;
  links: LinkObj[];
  resumen: string;
  foto?: string;
}

/** Fechas `YYYY-MM`. Si hay `fechaInicio`, `periodo` se calcula al guardar (⊥ se edita a mano). */
export interface Fechas {
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  enCurso?: boolean;
}

export interface Experiencia extends Visibilidad, Fechas {
  id: string;
  puesto: string;
  empresa: string;
  descripcion: string;
  /** Versión corta para el portfolio; si falta usa `descripcion`. */
  descripcionCorta?: string;
  tecnologias?: string[];
  estado?: string;
}

export interface Educacion extends Visibilidad, Fechas {
  id: string;
  institucion: string;
  titulo: string;
  descripcion?: string;
  descripcionCorta?: string;
  tecnologias?: string[];
  /** Texto libre: «Graduado», «En curso». Si falta y `enCurso`, el portfolio dice «En curso». */
  estado?: string;
}

export interface Skill extends Visibilidad {
  id: string;
  nombre: string;
  nivel: number; // 1-5 (solo el CV lo muestra)
  /** El portfolio agrupa su «stack» por categoría. */
  categoria?: string;
  icono?: string;
}

export interface Proyecto extends Visibilidad {
  id: string;
  nombre: string;
  descripcion: string;
  descripcionCorta?: string;
  tecnologias: string;
  url?: string;
  /** Identifica el proyecto entre el CV y el portfolio (ej. 'buckshot-tracker'). Único. */
  slug?: string;
  githubUrl?: string;
  tags?: string[];
  tamano?: string;
  estado?: string;
  icono?: string;
  imagenUrl?: string;
}

export type TipoPerfilItem = 'idioma' | 'fortaleza' | 'interes';

/** Idiomas, fortalezas e intereses. */
export interface PerfilItem extends Visibilidad {
  id: string;
  tipo: TipoPerfilItem;
  texto: string;
  icono?: string;
}

/** Textos propios del portfolio (hero, about, títulos de sección). Columna `profiles.portfolio`. */
export interface PortfolioTextos {
  hero?: { title?: string; subtitle?: string; description?: string };
  about_card?: { title?: string; role?: string; description?: string };
  stack?: { title?: string; description?: string };
  strengths?: { title?: string };
  languages?: { title?: string };
  interests?: { title?: string };
}

export interface CVSettings {
  themeColor: 'neutral' | 'blue' | 'emerald' | 'purple' | 'rose' | 'amber';
  darkMode: boolean;
}

export interface CVData {
  settings: CVSettings;
  personal: Personal;
  experiencia: Experiencia[];
  educacion: Educacion[];
  skills: Skill[];
  proyectos: Proyecto[];
  perfilItems: PerfilItem[];
  mostrar: Mostrar;
  portfolio: PortfolioTextos;
}

/** Lo que el editor manda al agregar un ítem: sin `id` y con la visibilidad opcional (default: solo CV). */
export type Nuevo<T extends Visibilidad> = Omit<T, 'id' | keyof Visibilidad> & Partial<Visibilidad>;
