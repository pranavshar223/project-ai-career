import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    base: isProduction ? '/ai-career-frontend-9e871/' : './',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});