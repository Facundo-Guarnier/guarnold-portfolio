export interface Profile {
  id?: string;
  name?: string;
  role?: string;
  location?: string;
  location_background_image?: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface IdentitySection {
  name?: string;
  nickname?: string;
  professional_title?: string;
  avatar_url?: string;
}

export interface HeroSection {
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface AboutCardSection {
  title?: string;
  role?: string;
  description?: string;
}

export interface LocationSection {
  city?: string;
  country?: string;
  background_image?: string;
}

export interface StackTechnology {
  name?: string;
  icon?: string;
}

export interface StackGroup {
  category?: string;
  technologies?: StackTechnology[];
}

export interface StackSection {
  title?: string;
  description?: string;
  technologies?: StackTechnology[];
  groups?: StackGroup[];
}

export interface ListSection {
  title?: string;
  items?: string[];
}

export interface SocialSection {
  github?: string;
  linkedin?: string;
}

export interface HomeContent {
  identity?: IdentitySection;
  hero?: HeroSection;
  about_card?: AboutCardSection;
  location?: LocationSection;
  stack?: StackSection;
  strengths?: ListSection;
  languages?: ListSection;
  social?: SocialSection;
}

export interface Experience {
  id?: string;
  type?: "work" | "education" | string;
  company?: string;
  institution?: string;
  role?: string;
  title?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  is_completed?: boolean;
  description?: string;
  technologies?: string[];
}

export interface Project {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  link?: string;
  github_url?: string;
  tags?: string[];
  size?: "small" | "medium" | "large" | "tall" | string;
  status?: "live" | "wip" | "demo" | string;
  image?: string;
  image_url?: string;
}
