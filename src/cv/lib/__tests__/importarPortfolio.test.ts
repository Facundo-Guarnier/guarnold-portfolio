import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { ErrorImportacion, importarPortfolio, lineasResumen, normalizarNombre } from '../importarPortfolio';
import type { CVData } from '../../types/cv';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(AQUI, '..', '..', '..', '..', 'tests', 'fixtures', 'content.yml');
const yml = () => parse(readFileSync(FIXTURE, 'utf8')) as unknown;

/** IDs temporales deterministas: el test ⊥ depende del reloj. */
const ids = () => {
  let n = 0;
  return () => `temp_test_${++n}`;
};

const vacio = (): CVData => ({
  settings: { themeColor: 'neutral', darkMode: false },
  personal: { nombre: '', titulo: '', email: '', telefono: '', ubicacion: '', links: [], resumen: '' },
  experiencia: [],
  educacion: [],
  skills: [],
  proyectos: [],
  perfilItems: [],
  mostrar: {},
  portfolio: {},
});

const importar = (base: CVData = vacio()) => importarPortfolio(base, yml(), { nuevoId: ids() });

describe('normalizarNombre', () => {
  it('ignora paréntesis, tildes y mayúsculas', () => {
    expect(normalizarNombre('Merovingian Data (Híbrido)')).toBe('merovingian data');
    expect(normalizarNombre('  ESPAÑOL  ')).toBe('espanol');
    expect(normalizarNombre('Español (Nativo)')).toBe('espanol');
  });
});

describe('importarPortfolio: entrada', () => {
  it('rechaza algo que ⊥ es un objeto YAML', () => {
    expect(() => importarPortfolio(vacio(), 'hola')).toThrow(ErrorImportacion);
    expect(() => importarPortfolio(vacio(), ['a'])).toThrow(ErrorImportacion);
    expect(() => importarPortfolio(vacio(), null)).toThrow(ErrorImportacion);
  });

  it('no modifica el estado anterior (el hook lo usa para saber si hay cambios)', () => {
    const base = vacio();
    const antes = JSON.stringify(base);
    importar(base);
    expect(JSON.stringify(base)).toBe(antes);
  });

  it('un YAML vacío no cambia nada', () => {
    const base = vacio();
    const r = importarPortfolio(base, {}, { nuevoId: ids() });
    expect(r.data).toEqual(base);
    expect(lineasResumen(r.resumen)).toEqual(['No había nada nuevo para importar.']);
  });
});

describe('identidad y ubicación', () => {
  it('nombre, apodo, título, foto, ciudad y país', () => {
    const { data, resumen } = importar();
    expect(data.personal).toMatchObject({
      nombre: 'Facundo Guarnier',
      apodo: 'Guarnold',
      titulo: 'Ingeniero en Informática | Desarrollador Fullstack',
      foto: '/assets/profile.jpg',
      ciudad: 'Mendoza',
      pais: 'Argentina',
      ubicacion: 'Mendoza, Argentina',
    });
    expect(resumen.identidad).toEqual(['nombre', 'apodo', 'título', 'foto', 'ciudad', 'país', 'ubicación']);
  });

  it('no pisa una ubicación ya cargada en el CV', () => {
    const base = vacio();
    base.personal.ubicacion = 'Godoy Cruz, Mendoza';
    const { data } = importar(base);
    expect(data.personal.ubicacion).toBe('Godoy Cruz, Mendoza');
    expect(data.personal.ciudad).toBe('Mendoza');
  });

  it('la foto /assets/ ⊥ avisa (CV y portfolio son el mismo sitio) y el fondo del mapa sí', () => {
    const { resumen } = importar();
    expect(resumen.avisos.some((a) => a.includes('/assets/profile.jpg'))).toBe(false);
    expect(resumen.avisos.some((a) => a.includes('background_image'))).toBe(true);
  });
});

describe('textos del portfolio', () => {
  it('hero, about_card y títulos de sección van a profiles.portfolio', () => {
    const { data, resumen } = importar();
    expect(data.portfolio.hero).toEqual({
      title: 'Hola, soy Facundo Guarnier.',
      subtitle: 'También me dicen Guarnold.',
      description:
        'Ingeniero en Informática con foco en el ciclo de vida completo del desarrollo. Me motiva crear tecnología con propósito para mejorar la calidad de vida de las personas.',
    });
    expect(data.portfolio.about_card?.role).toBe('Ingeniero en Informática');
    expect(data.portfolio.stack).toEqual({
      title: 'Arsenal',
      description: 'Stack orientado a construir productos robustos de punta a punta.',
    });
    expect(data.portfolio.strengths).toEqual({ title: 'Fortalezas' });
    expect(data.portfolio.languages).toEqual({ title: 'Idiomas' });
    expect(data.portfolio.interests).toEqual({ title: 'Más allá del código' });
    // hero(3) + about_card(3) + stack(2) + 3 títulos = 11
    expect(resumen.textosPortfolio).toBe(11);
  });

  it('lo que trae el YAML pisa lo que había, y lo que ⊥ trae el YAML se conserva', () => {
    const base = vacio();
    base.portfolio.hero = { title: 'Mi título', subtitle: 'Mi subtítulo', description: '' };
    base.portfolio.stack = { title: 'Mi stack' };
    const { data } = importar(base);
    expect(data.portfolio.hero?.title).toBe('Hola, soy Facundo Guarnier.');
    expect(data.portfolio.hero?.subtitle).toBe('También me dicen Guarnold.');
    expect(data.portfolio.stack?.title).toBe('Arsenal');
  });

  it('un YAML sin hero ⊥ toca el hero que ya estaba', () => {
    const base = vacio();
    base.portfolio.hero = { title: 'Intacto' };
    const r = importarPortfolio(base, { identity: { name: 'X' } }, { nuevoId: ids() });
    expect(r.data.portfolio.hero).toEqual({ title: 'Intacto' });
  });
});

describe('stack → habilidades', () => {
  it('crea una habilidad por tecnología con categoría e ícono, fuera del CV', () => {
    const { data, resumen } = importar();
    expect(data.skills).toHaveLength(12);
    expect(resumen.skills).toEqual({ nuevas: 12, actualizadas: 0 });
    const python = data.skills.find((s) => s.nombre === 'Python');
    expect(python).toMatchObject({ categoria: 'Lenguajes', icono: 'code', enCv: false, enPortfolio: true, nivel: 0 });
    expect(data.skills.find((s) => s.nombre === 'Docker')).toMatchObject({ categoria: 'DevOps', icono: 'box' });
    expect(data.skills.every((s) => s.id.startsWith('temp_test_'))).toBe(true);
  });

  it('una habilidad que ya existe (case-insensitive) se actualiza sin cambiar su nivel ni su CV', () => {
    const base = vacio();
    base.skills = [{ id: 'uuid-1', nombre: 'python', nivel: 5, enCv: true, enPortfolio: false }];
    const { data, resumen } = importar(base);
    expect(data.skills).toHaveLength(12);
    expect(data.skills[0]).toEqual({
      id: 'uuid-1',
      nombre: 'python',
      nivel: 5,
      enCv: true,
      enPortfolio: true,
      categoria: 'Lenguajes',
      icono: 'code',
    });
    expect(resumen.skills).toEqual({ nuevas: 11, actualizadas: 1 });
  });

  it('una habilidad ya marcada para el portfolio ⊥ cuenta como actualizada', () => {
    const base = vacio();
    base.skills = [
      { id: 'uuid-1', nombre: 'Python', nivel: 5, categoria: 'Lenguajes', icono: 'code', enCv: true, enPortfolio: true },
    ];
    const { resumen } = importar(base);
    expect(resumen.skills).toEqual({ nuevas: 11, actualizadas: 0 });
  });
});

describe('idiomas, fortalezas e intereses → perfil_items', () => {
  it('fortalezas: todas nuevas, solo portfolio', () => {
    const { data } = importar();
    const fortalezas = data.perfilItems.filter((i) => i.tipo === 'fortaleza');
    expect(fortalezas.map((i) => i.texto)).toEqual(['Prudencia', 'Perseverancia', 'Curiosidad', 'Adaptabilidad', 'Trabajo en equipo']);
    expect(fortalezas.every((i) => !i.enCv && i.enPortfolio)).toBe(true);
  });

  it('un idioma con paréntesis matchea el que ya está en el CV por su nombre', () => {
    const base = vacio();
    base.perfilItems = [{ id: 'uuid-i', tipo: 'idioma', texto: 'Español', enCv: true, enPortfolio: false }];
    const { data, resumen } = importar(base);
    const idiomas = data.perfilItems.filter((i) => i.tipo === 'idioma');
    expect(idiomas).toEqual([
      { id: 'uuid-i', tipo: 'idioma', texto: 'Español', enCv: true, enPortfolio: true },
      { id: expect.stringMatching(/^temp_test_/), tipo: 'idioma', texto: 'Inglés (B2)', enCv: false, enPortfolio: true },
    ]);
    expect(resumen.perfil.actualizados).toBe(1);
  });

  it('intereses: ícono incluido; un interés existente se marca y toma el ícono', () => {
    const base = vacio();
    base.perfilItems = [{ id: 'uuid-d', tipo: 'interes', texto: 'domótica', enCv: false, enPortfolio: false }];
    const { data } = importar(base);
    const intereses = data.perfilItems.filter((i) => i.tipo === 'interes');
    expect(intereses).toHaveLength(6);
    expect(intereses[0]).toEqual({ id: 'uuid-d', tipo: 'interes', texto: 'domótica', enCv: false, enPortfolio: true, icono: 'House' });
    expect(intereses[1]).toMatchObject({ texto: 'Videojuegos', icono: 'Gamepad2', enPortfolio: true, enCv: false });
  });

  it('una fortaleza que ya existe como idioma ⊥ se confunde: el tipo es parte de la clave', () => {
    const base = vacio();
    base.perfilItems = [{ id: 'x', tipo: 'idioma', texto: 'Curiosidad', enCv: true, enPortfolio: false }];
    const { data } = importar(base);
    expect(data.perfilItems.filter((i) => i.tipo === 'fortaleza' && i.texto === 'Curiosidad')).toHaveLength(1);
  });
});

describe('redes sociales → links', () => {
  it('github nuevo: fuera del CV, en el portfolio, con etiqueta legible', () => {
    const { data, resumen } = importar();
    expect(data.personal.links).toEqual([
      {
        id: expect.stringMatching(/^temp_test_/),
        label: 'GitHub',
        url: 'https://github.com/Facundo-Guarnier',
        platform: 'github',
        enCv: false,
        enPortfolio: true,
      },
      {
        id: expect.stringMatching(/^temp_test_/),
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/in/facundo-guarnier/',
        platform: 'linkedin',
        enCv: false,
        enPortfolio: true,
      },
    ]);
    expect(resumen.links).toEqual({ nuevos: 2, actualizados: 0 });
  });

  it('un link existente con la misma plataforma ⊥ cambia su URL: avisa, y solo marca el portfolio', () => {
    const base = vacio();
    base.personal.links = [
      { id: 'l1', label: 'LinkedIn', url: 'https://linkedin.com/in/otra', platform: 'linkedin', enCv: true, enPortfolio: false },
    ];
    const { data, resumen } = importar(base);
    expect(data.personal.links[0]).toEqual({
      id: 'l1',
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/otra',
      platform: 'linkedin',
      enCv: true,
      enPortfolio: true,
    });
    expect(resumen.links).toEqual({ nuevos: 1, actualizados: 1 });
    expect(resumen.avisos.some((a) => a.startsWith('linkedin: el CV tiene'))).toBe(true);
  });
});

describe('experiencia', () => {
  it('trabajo nuevo: fechas YYYY-MM, en curso si ⊥ is_completed, período calculado', () => {
    const { data } = importar();
    const mero = data.experiencia.find((e) => e.empresa === 'Merovingian Data (Híbrido)');
    expect(mero).toMatchObject({
      puesto: 'Software Developer',
      fechaInicio: '2025-09',
      fechaFin: '',
      enCurso: true,
      estado: 'En curso',
      periodo: 'Sep 2025 - Actualidad',
      descripcion: expect.stringContaining('Desarrollo fullstack'),
      descripcionCorta: mero?.descripcion,
      tecnologias: ['Azure', 'Habilidades blandas', 'Supabase', 'Netlify', 'AI'],
      enCv: false,
      enPortfolio: true,
    });
  });

  it('trabajo terminado: fecha de fin y período cerrado', () => {
    const { data } = importar();
    const tinkin = data.experiencia.find((e) => e.empresa === 'Tinkin (Remoto)');
    expect(tinkin).toMatchObject({
      fechaInicio: '2024-08',
      fechaFin: '2025-08',
      enCurso: false,
      periodo: 'Ago 2024 - Ago 2025',
    });
    // status null en el YAML ⊥ deja el estado vacío.
    expect(tinkin?.estado).toBe('');
  });

  it('un trabajo que ya está en el CV (por empresa) conserva puesto y descripción largos', () => {
    const base = vacio();
    base.experiencia = [
      {
        id: 'uuid-tinkin',
        empresa: 'Tinkin',
        puesto: 'Dev Senior',
        periodo: 'viejo',
        descripcion: 'Descripción larga del CV',
        enCv: true,
        enPortfolio: false,
      },
    ];
    const { data, resumen } = importar(base);
    expect(data.experiencia).toHaveLength(3);
    expect(data.experiencia[0]).toMatchObject({
      id: 'uuid-tinkin',
      puesto: 'Dev Senior',
      descripcion: 'Descripción larga del CV',
      descripcionCorta: 'Desarrollo fullstack en entorno Scrum. Participación en Fideval (Flutter), migración de Mercately a React moderno y Kamina Academy (FastAPI). Dictado de sesiones técnicas internas (Dojos) para compartir buenas prácticas de desarrollo.',
      fechaInicio: '2024-08',
      fechaFin: '2025-08',
      enCurso: false,
      enCv: true,
      enPortfolio: true,
      periodo: 'Ago 2024 - Ago 2025',
      tecnologias: ['Flutter', 'React', 'TypeScript', 'FastAPI', 'Scrum'],
    });
    expect(resumen.experiencia).toEqual({ nuevas: 2, actualizadas: 1 });
  });

  it('una fecha que ⊥ es YYYY-MM se descarta y queda avisada', () => {
    const r = importarPortfolio(
      vacio(),
      { experience: [{ id: 'x', type: 'work', company: 'Acme', role: 'Dev', start_date: 'agosto 2024', is_completed: true }] },
      { nuevoId: ids() },
    );
    expect(r.data.experiencia[0]).toMatchObject({ fechaInicio: '', periodo: '' });
    expect(r.resumen.avisos.some((a) => a.includes('start_date «agosto 2024»'))).toBe(true);
  });

  it('un item sin company o con type desconocido se omite y se avisa', () => {
    const r = importarPortfolio(
      vacio(),
      { experience: [{ id: 'a', type: 'work' }, { id: 'b', type: 'voluntariado', company: 'ONG' }] },
      { nuevoId: ids() },
    );
    expect(r.data.experiencia).toEqual([]);
    expect(r.resumen.avisos).toEqual(['a: work sin company; se omite.', 'b: type «voluntariado» desconocido; se omite.']);
  });
});

describe('educación', () => {
  it('universidad: estado, fechas y tecnologías', () => {
    const { data } = importar();
    expect(data.educacion).toHaveLength(2);
    expect(data.educacion[0]).toMatchObject({
      institucion: 'Universidad de Mendoza',
      titulo: 'Ingeniería en Informática',
      fechaInicio: '2020-03',
      fechaFin: '2025-12',
      enCurso: false,
      estado: 'Graduado',
      periodo: 'Mar 2020 - Dic 2025',
      tecnologias: ['Ingeniería de Software', 'Arquitectura', 'IA'],
      enCv: false,
      enPortfolio: true,
    });
  });

  it('formación en curso sin fin: enCurso y estado del YAML', () => {
    const { data } = importar();
    expect(data.educacion[1]).toMatchObject({
      institucion: 'Formación Continua',
      enCurso: true,
      fechaFin: '',
      estado: 'En curso',
      periodo: 'Ene 2021 - Actualidad',
    });
  });

  it('una institución existente se marca y se completan solo los campos vacíos', () => {
    const base = vacio();
    base.educacion = [
      { id: 'uuid-um', institucion: 'Universidad de Mendoza', titulo: '', periodo: '', enCv: true, enPortfolio: false, descripcion: 'Del CV' },
    ];
    const { data, resumen } = importar(base);
    expect(data.educacion[0]).toMatchObject({
      id: 'uuid-um',
      titulo: 'Ingeniería en Informática',
      descripcion: 'Del CV',
      enCv: true,
      enPortfolio: true,
      fechaInicio: '2020-03',
    });
    expect(resumen.educacion).toEqual({ nuevas: 1, actualizadas: 1 });
  });
});

describe('proyectos', () => {
  it('son 16 proyectos sin comentar en el YAML; todos entran', () => {
    const { data, resumen } = importar();
    expect(data.proyectos).toHaveLength(16);
    expect(resumen.proyectos).toEqual({ nuevos: 16, actualizados: 0 });
  });

  it('mapea los campos del portfolio a los del editor', () => {
    const { data } = importar();
    const bt = data.proyectos.find((p) => p.slug === 'buckshot-tracker');
    expect(bt).toEqual({
      id: expect.stringMatching(/^temp_test_/),
      nombre: 'Buckshot Tracker Pro',
      descripcion: expect.stringContaining('Calculadora de probabilidades'),
      descripcionCorta: expect.stringContaining('Calculadora de probabilidades'),
      tecnologias: 'Game Tool, React, TypeScript, Tailwind CSS',
      url: 'https://buckshot-tracker.guarnold.com.ar/',
      slug: 'buckshot-tracker',
      githubUrl: 'https://github.com/Facundo-Guarnier/buckshot-tracker-pro',
      tags: ['Game Tool', 'React', 'TypeScript', 'Tailwind CSS'],
      tamano: 'large',
      estado: 'live',
      icono: 'Crosshair',
      imagenUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
      enCv: false,
      enPortfolio: true,
    });
  });

  it('link "#" es el placeholder del portfolio: ⊥ queda como URL', () => {
    const { data } = importar();
    const docgen = data.proyectos.find((p) => p.slug === 'docgen-portal');
    expect(docgen?.url).toBeUndefined();
  });

  it('un proyecto con el mismo nombre (sin slug) se matchea y gana el slug', () => {
    const base = vacio();
    base.proyectos = [
      { id: 'uuid-sm', nombre: 'Score Master', descripcion: 'Del CV', tecnologias: 'React', enCv: true, enPortfolio: false },
    ];
    const { data, resumen } = importar(base);
    expect(data.proyectos).toHaveLength(16);
    expect(data.proyectos[0]).toMatchObject({
      id: 'uuid-sm',
      nombre: 'Score Master',
      slug: 'scoremaster',
      descripcion: 'Del CV',
      enCv: true,
      enPortfolio: true,
      url: 'https://scoremaster.guarnold.com.ar/',
    });
    expect(resumen.proyectos).toEqual({ nuevos: 15, actualizados: 1 });
  });

  it('un proyecto con id ⊥ repetido se toma por slug aunque el nombre cambió', () => {
    const base = vacio();
    base.proyectos = [{ id: 'uuid-bt', nombre: 'BT viejo', descripcion: '', tecnologias: '', slug: 'buckshot-tracker', enCv: true, enPortfolio: false }];
    const { data } = importar(base);
    const bt = data.proyectos.filter((p) => p.slug === 'buckshot-tracker');
    expect(bt).toHaveLength(1);
    expect(bt[0]).toMatchObject({ id: 'uuid-bt', enPortfolio: true, tamano: 'large' });
  });
});

describe('idempotencia', () => {
  it('importar dos veces el mismo YAML no duplica nada y el segundo resumen queda en cero', () => {
    const primera = importar();
    const segunda = importarPortfolio(primera.data, yml(), { nuevoId: ids() });
    expect(segunda.data.skills).toHaveLength(12);
    expect(segunda.data.perfilItems).toHaveLength(primera.data.perfilItems.length);
    expect(segunda.data.experiencia).toHaveLength(3);
    expect(segunda.data.educacion).toHaveLength(2);
    expect(segunda.data.proyectos).toHaveLength(16);
    expect(segunda.data.personal.links).toHaveLength(2);
    expect(segunda.resumen.skills).toEqual({ nuevas: 0, actualizadas: 0 });
    expect(segunda.resumen.proyectos).toEqual({ nuevos: 0, actualizados: 0 });
    expect(segunda.resumen.experiencia).toEqual({ nuevas: 0, actualizadas: 0 });
    expect(segunda.resumen.textosPortfolio).toBe(0);
  });
});

describe('lineasResumen', () => {
  it('resume lo que se agregó y actualizó, sin secciones vacías', () => {
    const { resumen } = importar();
    const lineas = lineasResumen(resumen);
    expect(lineas).toContain('Habilidades: 12 nuevos, 0 actualizados.');
    expect(lineas).toContain('Proyectos: 16 nuevos, 0 actualizados.');
    expect(lineas.some((l) => l.startsWith('Datos personales: nombre'))).toBe(true);
    expect(lineas.some((l) => l.includes('Educación: 2 nuevos'))).toBe(true);
  });
});
