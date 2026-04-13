import { defineConfig } from 'vite';

/** Statische HTML-Lernpfade (kein Build nötig); Dev-Server für lokales Testen. */
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: '/Wahrscheinlichkeitsrechnung/index.html',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
