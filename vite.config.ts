// In vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    base: isProduction ? '/ai-career-frontend-9e871/' : '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});