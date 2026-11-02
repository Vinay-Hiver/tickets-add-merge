import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// assetsInlineLimit 0: the omni-boilerplate UI masks SVG icons with CSS url(), which breaks when SVGs are inlined as data URIs.
// fs.strict false: the parent folder name contains a ':' which breaks Vite's file-access allow check (403).
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  server: { fs: { strict: false } },
})
