import { connection } from 'next/server'
import { vereisLogin } from './auth'
import { prisma } from './db'
import { tokensVandaag } from './data-builder'
import type { AiVersie, CroAnalyse, ReviewResultaat } from './builder-types'

export async function getCroChecks() {
  await connection()
  await vereisLogin()
  const rows = await prisma.croCheck.findMany({ orderBy: { aangemaakt_op: 'desc' }, include: { project: { select: { naam: true } } } })
  return rows.map((r) => ({
    id: r.id,
    titel: r.titel,
    url: r.url,
    projectNaam: r.project?.naam ?? null,
    score: (r.analyse as unknown as CroAnalyse | null)?.score ?? null,
    open: (r.analyse as unknown as CroAnalyse | null)?.punten.filter((p) => !p.gedaan).length ?? null,
    aangemaakt_op: r.aangemaakt_op,
  }))
}

export async function getCroCheck(id: string) {
  await connection()
  await vereisLogin()
  const r = await prisma.croCheck.findUnique({ where: { id }, include: { project: { select: { id: true, naam: true, research: { select: { goedgekeurd: true } } } } } })
  if (!r) return null
  const [versieRows, review, vandaag] = await Promise.all([
    prisma.aiOutput.findMany({
      where: { functie: 'cro', ref_id: id },
      orderBy: { aangemaakt_op: 'desc' },
      take: 15,
      select: { id: true, aangemaakt_op: true, model: true, input_tokens: true, output_tokens: true },
    }),
    prisma.aiOutput.findFirst({ where: { functie: 'review', ref_id: id }, orderBy: { aangemaakt_op: 'desc' } }),
    tokensVandaag(),
  ])
  const versies: AiVersie[] = versieRows.map((v) => ({ id: v.id, aangemaakt_op: v.aangemaakt_op, model: v.model, tokens: (v.input_tokens ?? 0) + (v.output_tokens ?? 0) }))
  return {
    check: {
      id: r.id,
      titel: r.titel,
      url: r.url,
      bron: r.bron,
      pagina_tekst: r.pagina_tekst,
      analyse: r.analyse as unknown as CroAnalyse | null,
      project: r.project ? { id: r.project.id, naam: r.project.naam, onderzoek: Boolean(r.project.research) } : null,
      aangemaakt_op: r.aangemaakt_op,
      bijgewerkt_op: r.bijgewerkt_op,
    },
    versies,
    review: review ? { review: review.output as unknown as ReviewResultaat, aangemaakt_op: review.aangemaakt_op } : null,
    tokensVandaag: vandaag,
  }
}
export type CroDetail = NonNullable<Awaited<ReturnType<typeof getCroCheck>>>
