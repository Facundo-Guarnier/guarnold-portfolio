import React from 'react';
import { cn } from '../utils';
import { theme } from '../theme';

interface CardComponentProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  children, 
  className, 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-[rgba(255,255,255,0.05)] backdrop-blur-md",
        "border border-[rgba(255,255,255,0.1)] shadow-xl",
        "rounded-[1rem]",
        onClick && "cursor-pointer hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  );
};