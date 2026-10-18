// Alleen op de server gebruiken (server components, server actions, API routes).
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/app/generated/prisma/client'

function maakClient() {
  // Gepoolde verbinding (Neon via Vercel zet DATABASE_URL; oudere koppelingen POSTGRES_URL).
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('Geen database ingesteld: zet DATABASE_URL in .env.local (lokaal) of koppel een database in Vercel. Zie README.')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 5 }) })
}

// Eén verbinding per serverproces (ook tijdens `next dev`, waar code steeds opnieuw wordt geladen).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function client() {
  globalForPrisma.prisma ??= maakClient()
  return globalForPrisma.prisma
}

// De verbinding wordt pas gemaakt bij het eerste gebruik, zodat `next build` ook zonder database werkt.
export const prisma = new Proxy({} as PrismaClient, {
  get(_doel, eigenschap) {
    const c = client()
    const waarde = Reflect.get(c, eigenschap)
    return typeof waarde === 'function' ? waarde.bind(c) : waarde
  },
})
