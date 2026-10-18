// Past databasemigraties toe (nieuwe tabellen/velden). Draait automatisch vóór `npm run dev`, `npm start` en de build.
// Zonder database-instelling wordt dit overgeslagen, zodat bijvoorbeeld een build zonder database toch lukt.
import { execSync } from 'node:child_process'

try {
  process.loadEnvFile('.env.local')
} catch {
  // geen .env.local
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL
if (!url) {
  console.log('⚠ Geen DATABASE_URL gevonden: migraties overgeslagen. Zie README → Database.')
} else {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
}
