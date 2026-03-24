import content from "../data/content.yml";
import type { Experience, Profile, Project } from "../types";

interface ContentDatabase {
  profile?: Profile;
  experience?: Experience[];
  projects?: Project[];
}

const db = (content ?? {}) as ContentDatabase;

export const getProfile = async (): Promise<Profile | null> => {
  return db.profile ?? null;
};

export const getExperience = async (): Promise<Experience[]> => {
  return (db.experience ?? []).filter(Boolean);
};

export const getProjects = async (): Promise<Project[]> => {
  return (db.projects ?? []).filter(Boolean);
};
