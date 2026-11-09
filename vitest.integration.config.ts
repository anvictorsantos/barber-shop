import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

if (!process.env.DATABASE_URL) loadEnvFile('.env')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests.')

const databaseHost = new URL(databaseUrl).hostname
if (databaseHost !== 'localhost' && databaseHost !== '127.0.0.1') {
  throw new Error(
    `Integration tests refuse a non-local DATABASE_URL (host: ${databaseHost}). ` +
      'Set DATABASE_URL to the docker Postgres before running them.',
  )
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    fileParallelism: false,
    testTimeout: 60_000,
    env: {
      EMAIL_ENABLED: 'false',
      WHATSAPP_ENABLED: 'false',
    },
  },
})
