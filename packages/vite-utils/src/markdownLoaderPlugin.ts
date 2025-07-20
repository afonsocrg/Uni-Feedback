import type { Plugin } from 'vite'

export function markdownLoaderPlugin(): Plugin {
  return {
    name: 'markdown-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.md')) {
        return {
          code: `export default ${JSON.stringify(code)}`,
          map: null
        }
      }
    }
  }
}
