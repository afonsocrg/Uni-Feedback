import tailwindcss from '@tailwindcss/vite'
import {
  getViteAliasFromTsconfig,
  markdownLoaderPlugin
} from '@uni-feedback/vite-utils'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5174
  },
  plugins: [react(), tailwindcss(), markdownLoaderPlugin()],
  resolve: {
    alias: getViteAliasFromTsconfig('./tsconfig.json', __dirname)
  }
})
