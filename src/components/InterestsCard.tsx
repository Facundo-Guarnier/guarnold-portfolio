import React, { useMemo } from "react";
import {
  House,
  Gamepad2,
  TrendingUp,
  Cpu,
  Zap,
  Hammer,
  Sparkles,
} from "lucide-react";
import { CardComponent } from "./CardComponent";
import { cn } from "../utils";
import type { InterestItem } from "../types";

interface InterestsCardProps {
  title?: string;
  items?: InterestItem[];
  className?: string;
}

const iconMap: Record<
  string,
  React.FC<{ size?: number; className?: string }>
> = {
  house: House,
  gamepad2: Gamepad2,
  trendingup: TrendingUp,
  cpu: Cpu,
  zap: Zap,
  hammer: Hammer,
};

const InterestsCard: React.FC<InterestsCardProps> = ({
  title = "Más allá del código",
  items = [],
  className,
}) => {
  const safeItems = useMemo(() => {
    if (!items.length) return [];

    return items.map((item, index) => {
      const itemName = item?.name?.trim() || `Interés ${index + 1}`;
      const normalizedIcon = item?.icon?.toLowerCase().trim() || "sparkles";
      const Icon = iconMap[normalizedIcon] ?? Sparkles;

      return {
        name: itemName,
        Icon,
      };
    });
  }, [items]);

  return (
    <CardComponent className={cn("p-6 hover:-translate-y-1", className)}>
      <h3 className="mb-4 text-lg font-bold text-on-surface">{title}</h3>

      {safeItems.length ? (
        <div className="grid grid-cols-2 gap-3">
          {safeItems.map((interest) => (
            <div
              key={interest.name}
              className="flex items-center gap-2 px-3 py-2 transition-colors rounded-xl bg-surface/70 hover:bg-surface-variant/80"
            >
              <interest.Icon size={15} className="text-primary shrink-0" />
              <span className="text-sm truncate text-on-surface-variant">
                {interest.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">
          Próximamente compartiré más intereses personales.
        </p>
      )}
    </CardComponent>
  );
};

export default InterestsCard;
