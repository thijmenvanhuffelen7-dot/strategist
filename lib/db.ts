// Alleen op de server gebruiken (server components, server actions, API routes).
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/app/generated/prisma/client'

const url = process.env.DATABASE_URL ?? 'file:./prisma/strategist.db'

// Tijdens `next dev` wordt code steeds opnieuw geladen; hergebruik dan één verbinding.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
