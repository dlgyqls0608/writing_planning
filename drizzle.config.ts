import { defineConfig } from 'drizzle-kit'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 수동 로드 (drizzle-kit은 .env.local을 자동으로 읽지 않음)
const envPath = resolve(process.cwd(), '.env.local')
readFileSync(envPath, 'utf-8')
  .split('\n')
  .forEach((line) => {
    const clean = line.trim()
    if (!clean || clean.startsWith('#')) return
    const idx = clean.indexOf('=')
    if (idx === -1) return
    const key = clean.slice(0, idx).trim()
    const val = clean.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  })

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
