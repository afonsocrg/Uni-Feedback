import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  getViteAliasFromTsconfig,
  markdownLoaderPlugin
} from '@uni-feedback/vite-utils'

export default defineConfig({
  server: {
    port: 5174
  },
  plugins: [react(), tailwindcss(), markdownLoaderPlugin()],
  resolve: {
    alias: getViteAliasFromTsconfig('./tsconfig.json', __dirname)
  }
})
