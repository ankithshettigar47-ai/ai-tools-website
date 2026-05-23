import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})