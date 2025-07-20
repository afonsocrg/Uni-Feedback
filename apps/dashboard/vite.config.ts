import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getViteAliasFromTsconfig } from '@uni-feedback/vite-utils'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  },
  resolve: {
    alias: getViteAliasFromTsconfig('./tsconfig.json', __dirname)
  }
})
