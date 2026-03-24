export interface Profile {
  id?: string;
  name?: string;
  role?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
  github_url?: string;
  linkedin_url?: string;
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
  description?: string;
  technologies?: string[];
}

export interface Project {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  link?: string;
  tags?: string[];
  size?: "small" | "medium" | "large" | "tall" | string;
  status?: "live" | "wip" | "demo" | string;
  image?: string;
  image_url?: string;
}
