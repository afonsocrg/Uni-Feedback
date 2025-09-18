import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { plugin as markdown, Mode } from 'vite-plugin-markdown'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: './server/app.ts'
        }
      : undefined
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
    markdown({ mode: [Mode.MARKDOWN] })
  ],
  resolve: {
    alias: {
      // Ensure we use the correct React Router v7 packages
      'react-router-dom': 'react-router'
    }
  }
}))
