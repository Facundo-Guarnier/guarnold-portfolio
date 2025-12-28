import React from 'react';
import { cn } from '../utils';

interface PrimaryButtonComponentProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export const PrimaryButtonComponent: React.FC<PrimaryButtonComponentProps> = ({ 
  children, 
  className, 
  loading, 
  disabled, 
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "px-6 py-3 rounded-full font-bold transition-all duration-300",
        "bg-[#38BDF8] text-[#0F172A] shadow-lg",
        "hover:bg-[#7dd3fc] hover:shadow-[#38BDF8]/20 hover:scale-[1.02]",
        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />
          Cargando...
        </span>
      ) : children}
    </button>
  );
};