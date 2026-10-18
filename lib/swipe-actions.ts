'use server'
import { prisma } from './db'
import { vereisLogin } from './auth'
import type { Prisma } from '@/app/generated/prisma/client'
import { TAG_VELDEN, type SwipeTags } from './builder-types'
import { MEDIA_TYPES } from './media'
import { verwijderMedia } from './opslag'

const json = (v: unknown) => v as Prisma.InputJsonValue
const tekst = (v: unknown) => (typeof v === 'string' ? v : null)

export interface SwipeInvoer {
  titel?: string
  merk?: string | null
  platform?: string | null
  url?: string | null
  transcript?: string | null
  notities?: string | null
  beoordeling?: number | null
  tags?: SwipeTags
}

function velden(v: SwipeInvoer): Prisma.SwipeItemUpdateInput {
  const d: Prisma.SwipeItemUpdateInput = {}
  if (typeof v.titel === 'string') d.titel = v.titel.trim() || 'Naamloze ad'
  for (const k of ['merk', 'platform', 'url', 'transcript', 'notities'] as const) if (k in v) d[k] = tekst(v[k])
  if ('beoordeling' in v) d.beoordeling = v.beoordeling == null ? null : Math.min(5, Math.max(1, Math.round(Number(v.beoordeling)) || 1))
  if (v.tags) {
    const t: SwipeTags = {}
    for (const { key } of TAG_VELDEN) if (typeof v.tags[key] === 'string' && v.tags[key]!.trim()) t[key] = v.tags[key]!.trim()
    d.tags = json(t)
  }
  return d
}

export async function maakSwipe(v: SwipeInvoer): Promise<string> {
  await vereisLogin()
  const d = velden(v)
  const item = await prisma.swipeItem.create({ data: { ...(d as Prisma.SwipeItemCreateInput), titel: (d.titel as string) ?? 'Naamloze ad' } })
  return item.id
}

export async function updateSwipe(id: string, v: SwipeInvoer) {
  await vereisLogin()
  await prisma.swipeItem.update({ where: { id }, data: velden(v) })
}

/** Koppelt een geüpload bestand aan het item (en ruimt het vorige op). */
export async function zetMedia(id: string, ref: string, type: string) {
  await vereisLogin()
  const geldig = /^blob:swipe\/[\w.\-() %]+$/.test(ref) || /^lokaal:[0-9a-f-]{36}\.[a-z0-9]{1,5}$/.test(ref)
  if (!geldig || !(MEDIA_TYPES as readonly string[]).includes(type)) throw new Error('Ongeldig bestand.')
  const oud = await prisma.swipeItem.findUniqueOrThrow({ where: { id }, select: { media_url: true } })
  await prisma.swipeItem.update({ where: { id }, data: { media_url: ref, media_type: type } })
  if (oud.media_url && oud.media_url !== ref) await verwijderMedia(oud.media_url)
}

export async function verwijderMediaVan(id: string) {
  await vereisLogin()
  const oud = await prisma.swipeItem.findUniqueOrThrow({ where: { id }, select: { media_url: true } })
  await prisma.swipeItem.update({ where: { id }, data: { media_url: null, media_type: null } })
  await verwijderMedia(oud.media_url)
}

export async function verwijderSwipe(id: string) {
  await vereisLogin()
  const item = await prisma.swipeItem.delete({ where: { id } })
  await verwijderMedia(item.media_url)
}

export async function koppelBrief(swipeId: string, briefId: string) {
  await vereisLogin()
  await prisma.briefSwipeLink.upsert({ where: { brief_id_swipe_id: { brief_id: briefId, swipe_id: swipeId } }, create: { brief_id: briefId, swipe_id: swipeId }, update: {} })
}

export async function ontkoppelBrief(swipeId: string, briefId: string) {
  await vereisLogin()
  await prisma.briefSwipeLink.deleteMany({ where: { brief_id: briefId, swipe_id: swipeId } })
}
