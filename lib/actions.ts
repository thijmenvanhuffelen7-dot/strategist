'use server'
// Server actions: opslaan en verwijderen. Worden vanuit de browser aangeroepen, maar draaien op de server.
import { revalidatePath } from 'next/cache'
import { prisma } from './db'
import { vereisLogin } from './auth'
import { toProject } from './data'
import { voorbeeldProject } from './sampleData'
import { STANDAARD_DREMPELS, type ProjectInput } from './types'
import type { Prisma } from '@/app/generated/prisma/client'

const json = (v: unknown) => v as Prisma.InputJsonValue
const tekst = (v: unknown) => (typeof v === 'string' ? v : null)

/** Neemt alleen bekende velden over uit wat de browser instuurt. */
function projectData(v: ProjectInput) {
  return {
    naam: String(v.naam ?? '').trim(),
    omschrijving: tekst(v.omschrijving),
    prijs: tekst(v.prijs),
    url: tekst(v.url),
    landingspagina_tekst: tekst(v.landingspagina_tekst),
    doelgroep: tekst(v.doelgroep),
    platforms: json(Array.isArray(v.platforms) ? v.platforms.filter((p) => typeof p === 'string') : []),
    doel: tekst(v.doel),
    taal: tekst(v.taal) || 'Nederlands',
    concurrenten: json(
      (Array.isArray(v.concurrenten) ? v.concurrenten : [])
        .map((c) => ({ naam: String(c?.naam ?? '').trim(), url: String(c?.url ?? '').trim() }))
        .filter((c) => c.naam || c.url),
    ),
    klantdata: tekst(v.klantdata),
    drempels: json(v.drempels && typeof v.drempels === 'object' ? v.drempels : {}),
    is_voorbeeld: Boolean(v.is_voorbeeld),
  }
}

export async function saveProject(id: string | null, values: ProjectInput): Promise<string> {
  await vereisLogin()
  const data = projectData(values)
  if (!data.naam) throw new Error('Geef het project een naam.')
  const row = id ? await prisma.project.update({ where: { id }, data }) : await prisma.project.create({ data })
  revalidatePath('/', 'layout')
  return row.id
}

export async function deleteProject(id: string) {
  await vereisLogin()
  // Onderzoek, angles, hooks, briefs en tests worden automatisch mee verwijderd (onDelete: Cascade).
  await prisma.project.delete({ where: { id } })
  revalidatePath('/', 'layout')
}

export async function loadSampleProject(): Promise<string> {
  await vereisLogin()
  return saveProject(null, voorbeeldProject)
}

/** Voor het zoekvenster (sneltoets /). */
export async function searchProjects(q: string) {
  await vereisLogin()
  const needle = q.trim().toLowerCase()
  const rows = await prisma.project.findMany({ orderBy: { bijgewerkt_op: 'desc' } })
  return rows
    .map(toProject)
    .filter((p) =>
      !needle || [p.naam, p.omschrijving, p.doelgroep, p.klantdata, p.landingspagina_tekst].some((f) => f?.toLowerCase().includes(needle)),
    )
    .slice(0, 8)
    .map((p) => ({ id: p.id, naam: p.naam, omschrijving: p.omschrijving ?? '' }))
}

export async function saveProfiel(values: { naam: string; standaard_taal: string; standaard_platform: string }) {
  await vereisLogin()
  const profiel = {
    naam: tekst(values.naam),
    standaard_taal: tekst(values.standaard_taal) || 'Nederlands',
    standaard_platform: tekst(values.standaard_platform) || 'Meta',
  }
  await prisma.profiel.upsert({
    where: { id: 1 },
    create: { id: 1, ...profiel, drempels: json(STANDAARD_DREMPELS), tag_lijsten: {} },
    update: profiel,
  })
  revalidatePath('/', 'layout')
}
