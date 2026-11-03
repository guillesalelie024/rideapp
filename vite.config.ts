/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            { name: 'ionicons', test: /node_modules[\\/]ionicons[\\/]/, entriesAware: true, priority: 20 },
            { name: 'ionic', test: /node_modules[\\/](@ionic|@stencil)[\\/]/, priority: 10, maxSize: 300_000 },
            { name: 'vue', test: /node_modules[\\/](@vue|vue|vue-router)[\\/]/, entriesAware: true, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
