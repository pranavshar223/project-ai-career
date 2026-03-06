import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    // ✅ Proxy all /api requests to your backend
    proxy: {
      '/api': {
        target: 'https://my-backend-service-995199928922.asia-south1.run.app',
        changeOrigin: true,
        secure: true,
      }
    }
  },
});