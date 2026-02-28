import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Manually defining the entry point to stop the yellow warning
  optimizeDeps: {
    entries: ['index.html'],
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    // This helps if there are permission issues in Windows/VS Code
    watch: {
      usePolling: true,
    },
  },
});