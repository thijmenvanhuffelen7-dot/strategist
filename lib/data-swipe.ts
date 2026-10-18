import { connection } from 'next/server'
import { vereisLogin } from './auth'
import { prisma } from './db'
import { tokensVandaag } from './data-builder'
import { mediaLink } from './opslag'
import type { AiVersie, ReviewResultaat, SwipeAnalyse, SwipeItemData, SwipeTags } from './builder-types'
import type { SwipeItem } from '@/app/generated/prisma/client'

async function toSwipe(r: SwipeItem): Promise<SwipeItemData> {
  return {
    id: r.id,
    titel: r.titel,
    merk: r.merk,
    platform: r.platform,
    url: r.url,
    media_url: r.media_url,
    media_type: r.media_type,
    media_link: await mediaLink(r.media_url),
    transcript: r.transcript,
    tags: (r.tags as SwipeTags | null) ?? {},
    analyse: r.analyse as unknown as SwipeAnalyse | null,
    notities: r.notities,
    beoordeling: r.beoordeling,
    aangemaakt_op: r.aangemaakt_op,
  }
}

export async function getSwipeItems(): Promise<SwipeItemData[]> {
  await connection()
  await vereisLogin()
  const rows = await prisma.swipeItem.findMany({ orderBy: { aangemaakt_op: 'desc' } })
  return Promise.all(rows.map(toSwipe))
}

export async function getSwipeAantal(): Promise<number> {
  await connection()
  await vereisLogin()
  return prisma.swipeItem.count()
}

export async function getSwipeItem(id: string) {
  await connection()
  await vereisLogin()
  const r = await prisma.swipeItem.findUnique({ where: { id }, include: { brief_links: { include: { brief: { select: { id: true, titel: true, status: true, project: { select: { naam: true } } } } } } } })
  if (!r) return null
  const [versieRows, review, briefs, projecten, vandaag] = await Promise.all([
    prisma.aiOutput.findMany({ where: { functie: 'swipe', ref_id: id }, orderBy: { aangemaakt_op: 'desc' }, take: 15, select: { id: true, aangemaakt_op: true, model: true, input_tokens: true, output_tokens: true } }),
    prisma.aiOutput.findFirst({ where: { functie: 'review', ref_id: id }, orderBy: { aangemaakt_op: 'desc' } }),
    prisma.brief.findMany({ orderBy: { bijgewerkt_op: 'desc' }, select: { id: true, titel: true, project: { select: { naam: true } } } }),
    prisma.project.findMany({ orderBy: { bijgewerkt_op: 'desc' }, select: { id: true, naam: true } }),
    tokensVandaag(),
  ])
  const versies: AiVersie[] = versieRows.map((v) => ({ id: v.id, aangemaakt_op: v.aangemaakt_op, model: v.model, tokens: (v.input_tokens ?? 0) + (v.output_tokens ?? 0) }))
  return {
    item: await toSwipe(r),
    gekoppeld: r.brief_links.map((l) => ({ id: l.brief.id, titel: l.brief.titel, status: l.brief.status, projectNaam: l.brief.project.naam })),
    briefs: briefs.map((b) => ({ id: b.id, titel: b.titel, projectNaam: b.project.naam })),
    projecten,
    versies,
    review: review ? { review: review.output as unknown as ReviewResultaat, aangemaakt_op: review.aangemaakt_op } : null,
    tokensVandaag: vandaag,
  }
}
export type SwipeDetail = NonNullable<Awaited<ReturnType<typeof getSwipeItem>>>

/** Swipe-items die als referentie aan een brief hangen (voor de brief-editor). */
export async function getReferentieAds(briefId: string) {
  await connection()
  await vereisLogin()
  const links = await prisma.briefSwipeLink.findMany({ where: { brief_id: briefId }, include: { swipe: true } })
  return Promise.all(links.map((l) => toSwipe(l.swipe)))
}

/** Alle swipe-items kort (om te koppelen vanuit de brief-editor). */
export async function getSwipeKeuzelijst() {
  await connection()
  await vereisLogin()
  return prisma.swipeItem.findMany({ orderBy: { aangemaakt_op: 'desc' }, select: { id: true, titel: true, merk: true } })
}
