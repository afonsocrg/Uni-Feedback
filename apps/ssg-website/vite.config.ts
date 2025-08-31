import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfig from './tsconfig.cloudflare.json'

// Convert paths from tsconfig.cloudflare.json
function getAlias() {
  const paths = tsconfig.compilerOptions.paths as Record<string, string[]>
  const alias: Record<string, string> = {}
  for (const pathKey in paths) {
    const target = paths[pathKey][0]
    const key = pathKey.replace('/*', '')
    const value = target.replace('/*', '').replace('./', '').replace('../', '')

    // Handle relative paths
    if (target.startsWith('../')) {
      alias[key] = path.resolve(__dirname, target.replace('/*', ''))
    } else {
      alias[key] = path.resolve(__dirname, value)
    }
  }
  return alias
}

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter()
    // tsconfigPaths(),
  ],
  resolve: {
    alias: getAlias()
  }
})
