import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        const distPath = path.resolve(__dirname, 'dist');
        const indexPath = path.join(distPath, 'index.html');
        const notFoundPath = path.join(distPath, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
        }
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});

