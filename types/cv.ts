
export interface LinkObj {
  id: string;
  label: string;
  url: string;
  platform?: string; // 'linkedin' | 'github' | 'twitter' | etc.
}

export interface Personal {
  nombre: string;
  titulo: string;
  email: string;
  telefono: string;
  ubicacion: string;
  links: LinkObj[];
  resumen: string;
  foto?: string;
}

export interface Experiencia {
  id: string;
  puesto: string;
  empresa: string;
  periodo: string;
  descripcion: string;
}

export interface Educacion {
  id: string;
  institucion: string;
  titulo: string;
  periodo: string;
  descripcion?: string;
}

export interface Skill {
  id: string;
  nombre: string;
  nivel: number; // 1-5
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tecnologias: string;
  url?: string;
}

export interface CVData {
  personal: Personal;
  experiencia: Experiencia[];
  educacion: Educacion[];
  skills: Skill[];
  proyectos: Proyecto[];
}
