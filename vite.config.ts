import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite is used instead of a meta-framework (Next.js) because this is a single-route
// static site: no SSR, no server runtime, no server-side data fetching. That keeps the
// shipped JS small and the deploy target trivial (any static host or CDN).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    /*
      The 3D viewer chunk is ~900kB (three.js core, which React Three Fiber pulls
      in wholesale for its JSX catalogue and so cannot be meaningfully
      tree-shaken). That is deliberate and isolated: it sits behind a React.lazy
      boundary that is gesture- or viewport-gated, so it never enters the initial
      load. The default 500kB warning would flag it on every build as if it were
      an accident, so the threshold is raised past it — the initial bundle is what
      is actually being guarded here, and it is ~87kB gzipped.
    */
    chunkSizeWarningLimit: 1000,
  },
});
