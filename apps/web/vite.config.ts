import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In the monolith build, Vite runs inside the same environment as the API.
// Map backend env vars to VITE_ equivalents so only one set of env vars is needed.
const envMapping: Record<string, string> = {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  ),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  ),
  'import.meta.env.VITE_COHERE_API_KEY': JSON.stringify(
    process.env.VITE_COHERE_API_KEY || process.env.COHERE_API_KEY || '',
  ),
  'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
    process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
  ),
  'import.meta.env.VITE_GOOGLE_AI_API_KEY': JSON.stringify(
    process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
  ),
  'import.meta.env.VITE_AI_PROVIDER': JSON.stringify(process.env.VITE_AI_PROVIDER || 'cohere'),
  // In production monolith, API is same-origin — no separate URL needed
  'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: envMapping,
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
