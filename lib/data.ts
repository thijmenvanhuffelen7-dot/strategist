// Data ophalen voor server components. Elke functie roept eerst connection() aan:
// zo weet Next.js dat de data bij elk verzoek vers uit de database komt
// (anders wordt hij bij `npm run build` vastgezet). Gebruik ze binnen <Suspense>.
import { connection } from 'next/server'
import { prisma } from './db'
import { STANDAARD_DREMPELS, type Concurrent, type Doel, type Drempels, type Platform, type Profiel, type Project } from './types'
import type { Project as ProjectRow } from '@/app/generated/prisma/client'

export function toProject(row: ProjectRow): Project {
  return {
    ...row,
    platforms: (row.platforms as Platform[] | null) ?? [],
    doel: row.doel as Doel | null,
    concurrenten: (row.concurrenten as unknown as Concurrent[] | null) ?? [],
    drempels: (row.drempels as Drempels | null) ?? {},
  }
}

export async function getProjects(): Promise<Project[]> {
  await connection()
  const rows = await prisma.project.findMany({ orderBy: { bijgewerkt_op: 'desc' } })
  return rows.map(toProject)
}

export async function getProject(id: string): Promise<Project | null> {
  await connection()
  const row = await prisma.project.findUnique({ where: { id } })
  return row ? toProject(row) : null
}

export async function getProfiel(): Promise<Profiel> {
  await connection()
  const row = await prisma.profiel.findUnique({ where: { id: 1 } })
  return {
    naam: row?.naam ?? null,
    standaard_taal: row?.standaard_taal ?? 'Nederlands',
    standaard_platform: row?.standaard_platform ?? 'Meta',
    drempels: { ...STANDAARD_DREMPELS, ...((row?.drempels as Drempels | null) ?? {}) },
    tag_lijsten: (row?.tag_lijsten as Record<string, string[]> | null) ?? {},
  }
}
