import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  mode: process.env.CI ? 'ci' : 'development',
  server: {
    port: 8000,
    proxy: {
      '/api': 'http://localhost:8080/'
    }
  },
  build: {
    target: 'esnext',
    outDir: '../server/build/resources/main/static',
    emptyOutDir: true
  }
})
