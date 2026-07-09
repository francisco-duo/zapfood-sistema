/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_TEMPO_PADRAO_PREPARO_MINUTOS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
