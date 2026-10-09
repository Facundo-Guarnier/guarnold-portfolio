/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Esquema de la base. Default `cv-formatter` (ver `src/lib/supabase.ts`). */
  readonly VITE_SUPABASE_SCHEMA?: string;
  /** Guarnold ID local para probar el modo central. `''` lo apaga. */
  readonly VITE_CUENTA_URL?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BRAND_URL?: string;
  readonly VITE_REPO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.yml" {
  const content: Record<string, unknown>;
  export default content;
}

declare module "*.yaml" {
  const content: Record<string, unknown>;
  export default content;
}
