/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_NAME: string;
  // Добавьте другие переменные окружения по мере необходимости
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 