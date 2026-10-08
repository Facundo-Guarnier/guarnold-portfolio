import content from "../data/content.yml";
import { supabase } from "../lib/supabase";
import type { Experience, HomeContent, Profile, Project } from "../types";

interface ContentDatabase {
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
 * La fuente de verdad es Supabase (lo que se edita en cv-formatter, con el interruptor «Portfolio»
 * de cada ítem). `content.yml` queda de RESPALDO: se usa si no hay variables de entorno, si la
 * llamada falla, o si la base todavía ⊥ tiene el perfil cargado (⊥ se mezclan: o una o la otra).
 */
const cargarRemoto = async (): Promise<ContentDatabase | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("portfolio_publico");
    if (error) throw error;
    const remoto = data as ContentDatabase | null;
    if (!remoto?.identity?.name) return null;
    // La imagen de fondo del mapa es un asset de ESTE sitio, ⊥ un dato del perfil.
    return {
      ...remoto,
      location: {
        background_image: dbLocal.location?.background_image,
        ...remoto.location,
      },
    };
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
