import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin a fixed port so the origin (and therefore localStorage) stays stable
    // across dev-server restarts. strictPort fails loudly instead of silently
    // falling back to another port, which would make saved data "disappear".
    port: 5173,
    strictPort: true,
  },
})
