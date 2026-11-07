import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

import { defineConfig, env } from 'prisma/config'

if (existsSync('.env')) {
  loadEnvFile('.env')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
})
