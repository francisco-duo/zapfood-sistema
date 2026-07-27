import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  build: {
    // Separa libs estáveis (mudam raramente) do código da aplicação (muda a
    // cada deploy) — o navegador reaproveita o cache desses chunks entre versões.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@mui") || id.includes("@emotion")) return "mui-vendor"
          if (id.includes("react")) return "react-vendor"
          return undefined
        },
      },
    },
  },
})
