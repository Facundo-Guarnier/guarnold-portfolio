import type { CVData, DatoPerfil, Mostrar, Visibilidad, Fechas } from '@/types/cv';

/**
 * Defaults de «qué dato del perfil se ve en cada lado». Mismos que usa la RPC `portfolio_publico()`
 * en SQL: si cambian acá, cambian ALLÁ (la migración y su test los fijan).
 */
export const DEFAULT_MOSTRAR: Record<'cv' | 'portfolio', Record<DatoPerfil, boolean>> = {
  cv: { email: true, telefono: true, foto: true, ubicacion: true },
  portfolio: { email: false, telefono: false, foto: true, ubicacion: true },
};

export function datoVisible(mostrar: Mostrar, lado: 'cv' | 'portfolio', dato: DatoPerfil): boolean {
  return mostrar[lado]?.[dato] ?? DEFAULT_MOSTRAR[lado][dato];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** `2024-08` → `Ago 2024`. Cualquier otra cosa → `''`. */
export function formatearMes(ym: string | undefined): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym ?? '');
  return m ? `${MESES[Number(m[2]) - 1]} ${m[1]}` : '';
}

/**
 * El texto que muestra el CV. Con `fechaInicio` se calcula de las fechas (así CV y portfolio ⊥ se
 * contradicen); sin ella queda lo que haya escrito en `periodo` (filas viejas).
 */
export function calcularPeriodo(f: Fechas): string {
  if (!f.fechaInicio) return f.periodo;
  const desde = formatearMes(f.fechaInicio);
  const hasta = f.enCurso ? 'Actualidad' : formatearMes(f.fechaFin);
  return hasta ? `${desde} - ${hasta}` : desde;
}

const enCv = <T extends Visibilidad>(l: T[]): T[] => l.filter((x) => x.enCv);

/**
 * Lo que el CV dibuja: ítems con `enCv` y datos del perfil según `mostrar.cv`. El editor también
 * pasa por acá, así que la vista previa es EXACTAMENTE el CV público.
 */
export function visibleEnCv(data: CVData): CVData {
  const { personal, mostrar } = data;
  const ver = (d: DatoPerfil) => datoVisible(mostrar, 'cv', d);
  return {
    ...data,
    personal: {
      ...personal,
      email: ver('email') ? personal.email : '',
      telefono: ver('telefono') ? personal.telefono : '',
      ubicacion: ver('ubicacion') ? personal.ubicacion : '',
      foto: ver('foto') ? personal.foto : '',
      links: enCv(personal.links),
    },
    experiencia: enCv(data.experiencia).map((e) => ({ ...e, periodo: calcularPeriodo(e) })),
    educacion: enCv(data.educacion).map((e) => ({ ...e, periodo: calcularPeriodo(e) })),
    skills: enCv(data.skills),
    proyectos: enCv(data.proyectos),
    perfilItems: enCv(data.perfilItems),
  };
}
