import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfig from './tsconfig.json'

// Convert paths from tsconfig.json
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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'markdown-loader',
      transform(code, id) {
        if (id.endsWith('.md')) {
          return {
            code: `export default ${JSON.stringify(code)}`,
            map: null
          }
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip'
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'animation-vendor': ['framer-motion'],
          'utils-vendor': ['sonner', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: getAlias()
  }
})
