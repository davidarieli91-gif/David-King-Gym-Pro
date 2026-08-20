import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Keep assets at root for GitHub Pages (fitness-crm.html at /David-King-Gym-Pro/)
  base: './',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        crm: resolve(__dirname, 'fitness-crm.html'),
        portal: resolve(__dirname, 'client.html'),
      },
      output: {
        // Keep manifest/icon without hash for stable PWA URLs; others hashed for cache-busting
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name === 'manifest.json' || name.startsWith('icon-')) return 'assets/[name][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Keep large chunks as-is; monolith is intentionally single-file
    chunkSizeWarningLimit: 3000,
  },
  server: {
    port: 5173,
    open: false,
  },
});
