import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к корневому .env файлу
const rootEnvPath = path.resolve(__dirname, '../');

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные из корневого .env файла
  loadEnv(mode, rootEnvPath, '');
  
  return {
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envDir: rootEnvPath, // Указываем директорию с .env файлом
    server: {
      // Разрешаем хосты ngrok для тестирования OAuth
      allowedHosts: [
        'yl.com.ru',
        'www.yl.com.ru',
        '127.0.0.1',
        'localhost'
      ]
    }
  }
})
