import React from "react";
import { cn } from "../utils";

interface CardComponentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  children,
  className,
  style,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-surface backdrop-blur-md",
        "border border-outline/30 shadow-md",
        "rounded-[1rem]",
        onClick &&
          "cursor-pointer hover:bg-surface-variant/80 hover:border-outline/50 active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </div>
  );
};
