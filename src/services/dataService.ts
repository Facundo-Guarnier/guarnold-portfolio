import content from "../data/content.yml";
import type { Experience, HomeContent, Profile, Project } from "../types";

interface ContentDatabase {
  identity?: HomeContent["identity"];
  hero?: HomeContent["hero"];
  about_card?: HomeContent["about_card"];
  location?: HomeContent["location"];
  stack?: HomeContent["stack"];
  strengths?: HomeContent["strengths"];
  languages?: HomeContent["languages"];
  social?: HomeContent["social"];
  experience?: Experience[];
  projects?: Project[];
}

const db = (content ?? {}) as ContentDatabase;

export const getHomeContent = async (): Promise<HomeContent | null> => {
  return {
    identity: db.identity,
    hero: db.hero,
    about_card: db.about_card,
    location: db.location,
    stack: db.stack,
    strengths: db.strengths,
    languages: db.languages,
    social: db.social,
  };
};

export const getProfile = async (): Promise<Profile | null> => {
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
  return (db.experience ?? []).filter(Boolean);
};

export const getProjects = async (): Promise<Project[]> => {
  return (db.projects ?? []).filter(Boolean);
};
