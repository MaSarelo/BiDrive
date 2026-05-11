import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // оставьте http, если бэкенд не на HTTPS
        changeOrigin: true,
        secure: false // критично для localhost с самоподписанным сертификатом
      }
    }
  }
})