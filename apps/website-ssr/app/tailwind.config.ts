import type { Config } from 'tailwindcss'
import uiConfig from '../../../packages/ui/tailwind.config.js'

export default {
  ...uiConfig,
  content: [
    // Scan this app's files
    './**/*.{js,jsx,ts,tsx}',
    // Scan the UI package source files
    '../../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
    // Include any content from UI config
    ...(Array.isArray(uiConfig.content) ? uiConfig.content.map(path => `../../../packages/ui/${path}`) : []),
  ],
} satisfies Config