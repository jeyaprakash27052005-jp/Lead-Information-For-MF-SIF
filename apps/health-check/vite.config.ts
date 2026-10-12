import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Builds this portal on its own. The code is shared with the other portals from the main ../../src folder.
export default defineConfig({
  root: import.meta.dirname,
  envDir: path.resolve(import.meta.dirname, '../..'),
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: { fs: { allow: [path.resolve(import.meta.dirname, '../..')] } },
});
