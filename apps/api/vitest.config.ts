import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false // Run test files sequentially to avoid database conflicts
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
})
