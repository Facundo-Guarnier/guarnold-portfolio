import React from "react";
import { Github, ArrowUpRight } from "lucide-react";
import { CardComponent } from "./CardComponent";

interface GithubProfileCardProps {
  profileUrl?: string;
  avatarUrl?: string;
  username?: string;
  statsLine?: string;
}

const GithubProfileCard: React.FC<GithubProfileCardProps> = ({
  profileUrl,
  avatarUrl = "https://github.com/faguarnier.png",
  username = "@faguarnier",
  statsLine = "15+ Repositorios • 50+ Seguidores",
}) => {
  return (
    <CardComponent className="relative overflow-hidden p-6 md:col-span-2 hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface-variant to-[#24292e]/20" />
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,#58a6ff_0,transparent_45%),radial-gradient(circle_at_80%_30%,#7c3aed_0,transparent_40%)]" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-outline/20 bg-surface flex items-center justify-center shrink-0">
            <img
              src={avatarUrl}
              alt="GitHub Avatar"
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <Github size={24} className="text-on-surface-variant" />
          </div>

          <div className="min-w-0">
            <p className="text-sm text-on-surface-variant">GitHub</p>
            <h4 className="text-lg font-bold text-on-surface truncate">
              {username}
            </h4>
            <p className="text-xs text-on-surface-variant truncate">
              {statsLine}
            </p>
          </div>
        </div>

        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-on-surface/70 hover:text-primary transition-colors border border-outline/20 bg-surface/60 shrink-0"
            aria-label="Abrir perfil de GitHub"
          >
            <ArrowUpRight size={16} />
          </a>
        )}
      </div>
    </CardComponent>
  );
};

export default GithubProfileCard;
