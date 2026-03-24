import React, { useEffect, useState } from "react";
import {
  User,
  MapPin,
  Mail,
  Github,
  Linkedin,
  Copy,
  Check,
  Terminal,
  Code2,
  Box,
  Cpu,
} from "lucide-react";
import Hero from "../components/Hero";
import { CardComponent } from "../components/CardComponent";
import { cn } from "../utils";
import { getProfile } from "../services/dataService";
import type { Profile } from "../types";

const Home: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile();
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const email = profile?.email ?? "facundoguarnier@gmail.com";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const skills = [
    { name: "Python", icon: <Terminal size={14} /> },
    { name: "FastAPI", icon: <Cpu size={14} /> },
    { name: "React", icon: <Code2 size={14} /> },
    { name: "TypeScript", icon: <Code2 size={14} /> },
    { name: "Flutter", icon: <Box size={14} /> },
    { name: "Dart", icon: <Box size={14} /> },
    { name: "Docker", icon: <Box size={14} /> },
    { name: "K8s", icon: <Box size={14} /> },
    { name: "SQL", icon: <Terminal size={14} /> },
  ];

  if (loading) {
    return (
      <div className="w-full animate-in fade-in duration-300">
        <section className="relative flex flex-col items-center justify-center text-center py-24 md:py-32 overflow-hidden">
          <div className="space-y-6 max-w-4xl px-4 w-full">
            <div className="mx-auto h-8 w-40 rounded-full bg-surface-variant animate-pulse" />
            <div className="mx-auto h-14 w-full max-w-2xl rounded-2xl bg-surface-variant animate-pulse" />
            <div className="mx-auto h-7 w-full max-w-xl rounded-xl bg-surface-variant animate-pulse" />
            <div className="mx-auto h-5 w-full max-w-2xl rounded-xl bg-surface-variant animate-pulse" />
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 scroll-mt-20">
          <div className="h-10 w-56 rounded-xl bg-surface-variant animate-pulse mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
            <div className="md:col-span-2 md:row-span-2 h-80 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="md:col-span-1 md:row-span-2 h-80 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="h-48 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="h-48 rounded-3xl bg-surface-variant animate-pulse" />
            <div className="h-48 rounded-3xl bg-surface-variant animate-pulse" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Hero Section */}
      <Hero profile={profile} />

      {/* Personal Bento Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 scroll-mt-20">
        <div className="flex items-center justify-between mb-10 border-b border-outline/10 pb-4">
          <h2 className="text-3xl font-bold text-on-surface flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Sobre Mí
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">
          {/* Profile Card (Large) */}
          <CardComponent className="md:col-span-2 md:row-span-2 p-8 flex flex-col justify-center">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-40 h-40 rounded-3xl bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border-2 border-primary/30">
                <User size={80} className="text-primary opacity-50" />
              </div>
              <div className="space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-3xl font-bold text-on-surface">
                    {profile?.name ?? "Facundo Guarnier"}
                  </h2>
                  {profile?.role && (
                    <p className="text-primary font-medium">{profile.role}</p>
                  )}
                </div>
                {profile?.bio && (
                  <p className="text-on-surface-variant leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  {profile?.location && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-variant/50 px-3 py-1 rounded-full border border-outline/10">
                      <MapPin size={16} className="text-primary" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardComponent>

          {/* Tech Stack Card (Medium/Tall) */}
          <CardComponent className="md:col-span-1 md:row-span-2 p-8 space-y-6">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <Terminal size={20} className="text-primary" />
              Arsenal
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold border border-primary/10 transition-transform hover:scale-105"
                >
                  {skill.icon}
                  {skill.name}
                </span>
              ))}
            </div>
          </CardComponent>

          {/* Contact Card (Small) */}
          <CardComponent className="p-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="font-bold text-on-surface">Contacto Directo</h4>
                <p className="text-xs text-on-surface-variant truncate">
                  {email}
                </p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className={cn(
                "mt-4 w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
                copied
                  ? "bg-green-500/20 text-green-500 border border-green-500/30"
                  : "bg-surface-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary border border-outline/10",
              )}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar Email"}
            </button>
          </CardComponent>

          {/* Social Card (Small) */}
          <CardComponent className="p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="font-bold text-on-surface">Redes</h4>
              <p className="text-xs text-on-surface-variant">
                Conectemos en línea.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <a
                href={
                  profile?.linkedin_url ?? "https://linkedin.com/in/faguarnier"
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/20 hover:scale-105 transition-transform"
              >
                <Linkedin size={18} />
                <span className="text-xs font-bold">LinkedIn</span>
              </a>
              <a
                href={profile?.github_url ?? "https://github.com/faguarnier"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-on-surface/10 text-on-surface border border-outline/20 hover:scale-105 transition-transform"
              >
                <Github size={18} />
                <span className="text-xs font-bold">GitHub</span>
              </a>
            </div>
          </CardComponent>

          {/* Location Card (Small) */}
          <CardComponent className="p-0 overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
            <div className="absolute inset-0 bg-surface-variant/30 flex items-center justify-center">
              <div className="w-full h-full opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
            <div className="relative z-20 p-6 h-full flex flex-col justify-end">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg group-hover:animate-bounce">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">
                    {profile?.location?.split(",")[0] ?? "Mendoza"}
                  </h4>
                  {profile?.location && (
                    <p className="text-xs text-on-surface-variant">
                      {profile.location.split(",").slice(1).join(",").trim() ||
                        "Argentina"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardComponent>
        </div>
      </section>
    </div>
  );
};

export default Home;
