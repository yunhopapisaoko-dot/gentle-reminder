/// <reference types="vite/client" />

// Tipagens para o VitePWA (evita erro TS2307 ao importar 'virtual:pwa-register')
declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (r?: any) => void;
    onRegisterError?: (error: any) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void> | void;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
