/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_PUBLIC_ORIGIN: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_PUBLISHABLE_KEY?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly AI_API_KEY?: string;
  readonly AI_ENDPOINT?: string;
  readonly AI_MODEL?: string;
  readonly CORS_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    VITE_PUBLIC_ORIGIN?: string;
    AI_API_KEY?: string;
    AI_ENDPOINT?: string;
    AI_MODEL?: string;
    CORS_ORIGIN?: string;
  }
}
