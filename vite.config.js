import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { proxy: { '/api': 'http://localhost:8080', '/s/': 'http://localhost:8080', '/logs-ui': 'http://localhost:8111' } },
})
