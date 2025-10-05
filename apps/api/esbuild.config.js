import esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/server.js',
  external: [
    'postgres',
    'better-sqlite3',
    '@whatwg-node/server',
    'chanfana',
    'itty-router',
    'drizzle-orm',
    'dotenv',
    'resend',
    'posthog-node',
    '@oslojs/*',
    'uuid',
    'dayjs'
  ]
}).catch(() => process.exit(1))
