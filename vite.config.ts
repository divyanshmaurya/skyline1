import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Prioritize system environment variables, then .env files
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || '';
    const WEB3FORMS_KEY = process.env.VITE_WEB3FORMS_KEY || env.VITE_WEB3FORMS_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.VITE_WEB3FORMS_KEY': JSON.stringify(WEB3FORMS_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
