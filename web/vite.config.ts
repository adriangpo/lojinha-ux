import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // O front chama /api/... e o Vite repassa para a API (sem precisar de CORS).
    proxy: {
      '/api': 'http://localhost:3333',
      // Fotos do MinIO pela mesma origem. O host tem que continuar localhost:5173,
      // senão a assinatura da URL (que inclui o host) não bate.
      '/fotos': { target: 'http://localhost:9000', changeOrigin: false },
    },
  },
})
