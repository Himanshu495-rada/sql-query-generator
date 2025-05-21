/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: "development" | "staging" | "production";
  readonly VITE_OPENAI_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
