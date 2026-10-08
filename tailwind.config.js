/** @type {import('tailwindcss').Config} */
export default {
  // Carpetas explícitas: un glob amplio (`./**/*`) recorría también `node_modules`.
  content: ['./index.html', './index.tsx', './src/**/*.{ts,tsx}'],
  // Modo por CLASE: lo usa el CV (`.dark` en su vista previa). El portfolio ⊥ usa variantes `dark:`:
  // su tema oscuro son las variables `--md-sys-*` del ThemeContext, ⊥ la clase en <html>.
  darkMode: 'class',
  theme: {
    extend: {
      // Inter: el CV y el cuerpo del portfolio. Roboto queda de respaldo (el portfolio la cargaba antes).
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      // Tokens de Material You: el ThemeContext del portfolio los escribe como variables CSS en <html>.
      colors: {
        primary: 'var(--md-sys-color-primary)',
        'on-primary': 'var(--md-sys-color-on-primary)',
        'primary-container': 'var(--md-sys-color-primary-container)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',

        secondary: 'var(--md-sys-color-secondary)',
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'secondary-container': 'var(--md-sys-color-secondary-container)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',

        tertiary: 'var(--md-sys-color-tertiary)',
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',

        surface: 'var(--md-sys-color-surface)',
        'on-surface': 'var(--md-sys-color-on-surface)',
        'surface-variant': 'var(--md-sys-color-surface-variant)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',

        background: 'var(--md-sys-color-background)',
        'on-background': 'var(--md-sys-color-on-background)',

        error: 'var(--md-sys-color-error)',
        'on-error': 'var(--md-sys-color-on-error)',

        outline: 'var(--md-sys-color-outline)',
      },
    },
  },
  plugins: [],
};
