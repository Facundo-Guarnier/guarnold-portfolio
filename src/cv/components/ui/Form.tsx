
import React from 'react';

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1.5 tracking-wider">
    {children}
  </label>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-600 hover:border-neutral-300 dark:hover:border-gray-600 ${className}`}
    {...props}
  />
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all placeholder:text-neutral-300 dark:placeholder:text-gray-600 hover:border-neutral-300 dark:hover:border-gray-600 min-h-[100px] resize-y ${className}`}
    {...props}
  />
);

export const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
    {icon}
    {children}
  </h2>
);
