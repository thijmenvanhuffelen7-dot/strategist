'use server'
import { prisma } from './db'
import { vereisLogin } from './auth'
import type { Prisma } from '@/app/generated/prisma/client'
import { MAX_CRO_SCREENSHOTS, SCREENSHOT_LABELS, type CroAnalyse, type CroScreenshot } from './builder-types'
import { verwijderMedia } from './opslag'
import { haalPaginaOp, OphaalFout } from './cro/ophalen'

const json = (v: unknown) => v as Prisma.InputJsonValue
const MAX_GEPLAKT = 60_000

export type NieuweCroResultaat = { id: string } | { fout: string; plakken?: boolean }

/** Maakt een CRO-check: haalt de URL op, of gebruikt geplakte tekst. */
export async function maakCroCheck(invoer: { url?: string; tekst?: string; projectId?: string | null }): Promise<NieuweCroResultaat> {
  await vereisLogin()
  const projectId = invoer.projectId || null
  if (projectId && !(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }))) return { fout: 'Project niet gevonden.' }

  const geplakt = invoer.tekst?.trim()
  if (geplakt) {
    if (geplakt.length < 200) return { fout: 'Plak wat meer tekst van de pagina (minstens een paar alinea’s).' }
    const url = invoer.url?.trim() || null
    const titel = url ? url.replace(/^https?:\/\//, '').slice(0, 80) : geplakt.split('\n')[0].slice(0, 80)
    const c = await prisma.croCheck.create({ data: { project_id: projectId, titel, url, bron: 'geplakt', pagina_tekst: geplakt.slice(0, MAX_GEPLAKT) } })
    return { id: c.id }
  }

  if (!invoer.url?.trim()) return { fout: 'Vul een webadres in of plak de tekst van de pagina.' }
  try {
    const pagina = await haalPaginaOp(invoer.url)
    const c = await prisma.croCheck.create({ data: { project_id: projectId, titel: pagina.titel.slice(0, 120), url: pagina.url, bron: 'url', pagina_tekst: pagina.tekst } })
    return { id: c.id }
  } catch (e) {
    if (e instanceof OphaalFout) return { fout: e.message, plakken: true }
    console.error('[CRO ophalen]', e)
    return { fout: 'De pagina kon niet worden opgehaald. Plak de tekst van de pagina zelf.', plakken: true }
  }
}

/** Bewerkingen aan het advies (punten afvinken, teksten aanpassen). */
export async function updateCroAnalyse(id: string, analyse: CroAnalyse) {
  await vereisLogin()
  await prisma.croCheck.update({ where: { id }, data: { analyse: json(analyse) } })
}

export async function updateCroCheck(id: string, patch: { titel?: string; pagina_tekst?: string; projectId?: string | null }) {
  await vereisLogin()
  const data: Prisma.CroCheckUncheckedUpdateInput = {}
  if (typeof patch.titel === 'string') data.titel = patch.titel.trim() || 'Naamloze CRO-check'
  if (typeof patch.pagina_tekst === 'string') data.pagina_tekst = patch.pagina_tekst.slice(0, MAX_GEPLAKT)
  if (patch.projectId !== undefined) data.project_id = patch.projectId || null
  await prisma.croCheck.update({ where: { id }, data })
}

export async function verwijderCroCheck(id: string) {
  await vereisLogin()
  const c = await prisma.croCheck.delete({ where: { id } })
  for (const s of (c.screenshots as unknown as CroScreenshot[]) ?? []) await verwijderMedia(s.ref)
}

async function screenshotsVan(id: string) {
  const c = await prisma.croCheck.findUniqueOrThrow({ where: { id }, select: { screenshots: true } })
  return ((c.screenshots as unknown as CroScreenshot[]) ?? []).slice()
}

export async function voegCroScreenshotToe(id: string, ref: string, type: string, label: string) {
  await vereisLogin()
  const geldig = /^blob:cro\/[\w.\-() %]+$/.test(ref) || /^lokaal:[0-9a-f-]{36}\.[a-z0-9]{1,5}$/.test(ref)
  if (!geldig || !type.startsWith('image/')) throw new Error('Alleen afbeeldingen zijn toegestaan.')
  const lijst = await screenshotsVan(id)
  if (lijst.length >= MAX_CRO_SCREENSHOTS) {
    await verwijderMedia(ref)
    throw new Error(`Maximaal ${MAX_CRO_SCREENSHOTS} screenshots per check.`)
  }
  lijst.push({ ref, type, label: (SCREENSHOT_LABELS as readonly string[]).includes(label) ? label : 'overig' })
  await prisma.croCheck.update({ where: { id }, data: { screenshots: json(lijst) } })
}

export async function zetCroScreenshotLabel(id: string, ref: string, label: string) {
  await vereisLogin()
  if (!(SCREENSHOT_LABELS as readonly string[]).includes(label)) return
  const lijst = (await screenshotsVan(id)).map((s) => (s.ref === ref ? { ...s, label } : s))
  await prisma.croCheck.update({ where: { id }, data: { screenshots: json(lijst) } })
}

export async function verwijderCroScreenshot(id: string, ref: string) {
  await vereisLogin()
  const lijst = await screenshotsVan(id)
  if (!lijst.some((s) => s.ref === ref)) return
  await prisma.croCheck.update({ where: { id }, data: { screenshots: json(lijst.filter((s) => s.ref !== ref)) } })
  await verwijderMedia(ref)
}
