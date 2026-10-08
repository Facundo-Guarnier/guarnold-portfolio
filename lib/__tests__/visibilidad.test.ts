import { describe, expect, it } from 'vitest';
import { calcularPeriodo, datoVisible, formatearMes, visibleEnCv } from '../visibilidad';
import type { CVData } from '../../types/cv';

const base = (): CVData => ({
  settings: { themeColor: 'neutral', darkMode: false },
  personal: {
    nombre: 'F', titulo: 'T', email: 'a@b.c', telefono: '123', ubicacion: 'Mendoza', resumen: 'R', foto: 'f.jpg',
    links: [
      { id: 'l1', label: 'GitHub', url: 'g', enCv: true, enPortfolio: true },
      { id: 'l2', label: 'X', url: 'x', enCv: false, enPortfolio: true },
    ],
  },
  experiencia: [
    { id: 'e1', puesto: 'Dev', empresa: 'A', periodo: 'texto viejo', descripcion: '', enCv: true, enPortfolio: false },
    { id: 'e2', puesto: 'Dev', empresa: 'B', periodo: '', descripcion: '', enCv: false, enPortfolio: true, fechaInicio: '2024-08', fechaFin: '2025-08' },
    { id: 'e3', puesto: 'Dev', empresa: 'C', periodo: '', descripcion: '', enCv: true, enPortfolio: true, fechaInicio: '2025-09', enCurso: true },
  ],
  educacion: [],
  skills: [
    { id: 's1', nombre: 'Python', nivel: 5, enCv: true, enPortfolio: true },
    { id: 's2', nombre: 'Excel', nivel: 3, enCv: false, enPortfolio: true },
  ],
  proyectos: [],
  perfilItems: [
    { id: 'i1', tipo: 'idioma', texto: 'Inglés', enCv: true, enPortfolio: false },
    { id: 'i2', tipo: 'interes', texto: 'Domótica', enCv: false, enPortfolio: true },
  ],
  mostrar: {},
  portfolio: {},
});

describe('visibleEnCv', () => {
  it('deja solo lo marcado en CV, ⊥ toca el resto del dato', () => {
    const v = visibleEnCv(base());
    expect(v.experiencia.map((e) => e.id)).toEqual(['e1', 'e3']);
    expect(v.skills.map((s) => s.id)).toEqual(['s1']);
    expect(v.perfilItems.map((i) => i.id)).toEqual(['i1']);
    expect(v.personal.links.map((l) => l.id)).toEqual(['l1']);
  });

  it('el CV muestra email y teléfono por default', () => {
    const v = visibleEnCv(base());
    expect(v.personal.email).toBe('a@b.c');
    expect(v.personal.telefono).toBe('123');
  });

  it('mostrar.cv oculta un dato del perfil solo en el CV', () => {
    const d = base();
    d.mostrar = { cv: { telefono: false, foto: false } };
    const v = visibleEnCv(d);
    expect(v.personal.telefono).toBe('');
    expect(v.personal.foto).toBe('');
    expect(d.personal.telefono).toBe('123');
  });

  it('calcula el periodo de las fechas y respeta el texto viejo si no hay fechas', () => {
    const v = visibleEnCv(base());
    expect(v.experiencia[0].periodo).toBe('texto viejo');
    expect(v.experiencia[1].periodo).toBe('Sep 2025 - Actualidad');
  });
});

describe('datoVisible', () => {
  it('defaults: el portfolio ⊥ muestra email ni teléfono (igual que la RPC SQL)', () => {
    expect(datoVisible({}, 'portfolio', 'email')).toBe(false);
    expect(datoVisible({}, 'portfolio', 'telefono')).toBe(false);
    expect(datoVisible({}, 'portfolio', 'foto')).toBe(true);
    expect(datoVisible({}, 'cv', 'email')).toBe(true);
  });

  it('un valor explícito pisa el default', () => {
    expect(datoVisible({ portfolio: { email: true } }, 'portfolio', 'email')).toBe(true);
  });
});

describe('fechas', () => {
  it('formatearMes ignora lo que ⊥ es YYYY-MM', () => {
    expect(formatearMes('2024-08')).toBe('Ago 2024');
    expect(formatearMes('Agosto 2024')).toBe('');
    expect(formatearMes('2024-13')).toBe('');
    expect(formatearMes(undefined)).toBe('');
  });

  it('calcularPeriodo: terminado, en curso y solo inicio', () => {
    expect(calcularPeriodo({ periodo: '', fechaInicio: '2024-08', fechaFin: '2025-08' })).toBe('Ago 2024 - Ago 2025');
    expect(calcularPeriodo({ periodo: '', fechaInicio: '2024-08', enCurso: true })).toBe('Ago 2024 - Actualidad');
    expect(calcularPeriodo({ periodo: '', fechaInicio: '2024-08' })).toBe('Ago 2024');
  });
});
