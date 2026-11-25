import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// assetsInlineLimit 0: the omni-boilerplate UI masks SVG icons with CSS url(), which breaks when SVGs are inlined as data URIs.
// fs.strict false: the parent folder name contains a ':' which breaks Vite's file-access allow check (403).
export default defineConfig({
  plugins: [react()],
  // Pages: the prototype (index.html), the demo's intro slideshow (concept.html) and its run sheet (flows.html).
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: 'index.html', concept: 'concept.html', flows: 'flows.html' } },
  },
  server: { fs: { strict: false } },
})
