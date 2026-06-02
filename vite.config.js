import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Use a fixed dev port and HMR settings so the client connects to the
    // correct websocket host/port instead of falling back to a different port
    // (prevents the client-side websocket from trying to connect to 3000 when
    // the server ends up on 3001).
    port: 3001,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 3001
    }
  }
})
