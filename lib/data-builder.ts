// Brief Builder-data uit de database, omgezet naar de vormen uit builder-types.
import { connection } from 'next/server'
import { prisma } from './db'
import { toProject } from './data'
import {
  legeBriefInhoud,
  type AiVersie,
  type AngleData,
  type BriefData,
  type BriefInhoud,
  type BriefStatus,
  type HookData,
  type ResearchData,
  type ReviewResultaat,
} from './builder-types'
import type { Angle, Brief, Hook, Research } from '@/app/generated/prisma/client'

export function toResearch(r: Research): ResearchData {
  return {
    pijnpunten: (r.pijnpunten as unknown as ResearchData['pijnpunten']) ?? [],
    verlangens: (r.verlangens as unknown as ResearchData['verlangens']) ?? [],
    bezwaren: (r.bezwaren as unknown as ResearchData['bezwaren']) ?? [],
    aha_momenten: (r.aha_momenten as unknown as ResearchData['aha_momenten']) ?? [],
    klanttaal: (r.klanttaal as unknown as ResearchData['klanttaal']) ?? [],
    bewustzijnsniveau: (r.bewustzijnsniveau as unknown as ResearchData['bewustzijnsniveau']) ?? null,
    goedgekeurd: r.goedgekeurd,
    bijgewerkt_op: r.bijgewerkt_op,
  }
}

export function toAngle(a: Angle): AngleData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { project_id, aangemaakt_op, ...rest } = a
  return rest
}

export function toHook(h: Hook): HookData {
  return { id: h.id, angle_id: h.angle_id, gesproken: h.gesproken, overlay: h.overlay, eerste_shot: h.eerste_shot, type: h.type, ster: h.ster }
}

export function toBrief(b: Brief): BriefData {
  const leeg = legeBriefInhoud()
  const inhoud = (b.inhoud ?? {}) as Partial<BriefInhoud>
  return {
    id: b.id,
    project_id: b.project_id,
    angle_id: b.angle_id,
    hook_id: b.hook_id,
    titel: b.titel,
    status: b.status as BriefStatus,
    aangemaakt_op: b.aangemaakt_op,
    bijgewerkt_op: b.bijgewerkt_op,
    inhoud: {
      ...leeg,
      ...inhoud,
      overzicht: { ...leeg.overzicht, ...inhoud.overzicht },
      doelgroep: { ...leeg.doelgroep, ...inhoud.doelgroep },
      boodschap: { ...leeg.boodschap, ...inhoud.boodschap },
      testvariaties: { ...leeg.testvariaties, ...inhoud.testvariaties },
      richtlijnen: { ...leeg.richtlijnen, ...inhoud.richtlijnen },
    },
  }
}

/** Sortering van angles: hoogste score eerst. */
export const ANGLE_VOLGORDE = [{ score: 'desc' as const }, { aangemaakt_op: 'asc' as const }]

async function versies(functie: string, projectId: string, refId?: string): Promise<AiVersie[]> {
  const rows = await prisma.aiOutput.findMany({
    where: { functie, project_id: projectId, ...(refId ? { ref_id: refId } : {}) },
    orderBy: { aangemaakt_op: 'desc' },
    take: 15,
    select: { id: true, aangemaakt_op: true, model: true, input_tokens: true, output_tokens: true },
  })
  return rows.map((r) => ({ id: r.id, aangemaakt_op: r.aangemaakt_op, model: r.model, tokens: (r.input_tokens ?? 0) + (r.output_tokens ?? 0) }))
}

async function laatsteReview(projectId: string, refId: string): Promise<{ review: ReviewResultaat; aangemaakt_op: Date } | null> {
  const r = await prisma.aiOutput.findFirst({ where: { functie: 'review', project_id: projectId, ref_id: refId }, orderBy: { aangemaakt_op: 'desc' } })
  return r ? { review: r.output as unknown as ReviewResultaat, aangemaakt_op: r.aangemaakt_op } : null
}

/** Tokens die vandaag (sinds middernacht) zijn gebruikt. */
export async function tokensVandaag(): Promise<number> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const s = await prisma.aiOutput.aggregate({ where: { aangemaakt_op: { gte: start } }, _sum: { input_tokens: true, output_tokens: true } })
  return (s._sum.input_tokens ?? 0) + (s._sum.output_tokens ?? 0)
}

export async function getBuilderData(projectId: string) {
  await connection()
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      research: true,
      angles: { orderBy: ANGLE_VOLGORDE },
      hooks: { orderBy: { aangemaakt_op: 'asc' } },
      briefs: { orderBy: { bijgewerkt_op: 'desc' } },
    },
  })
  if (!project) return null
  const [vOnderzoek, vAngles, rOnderzoek, rAngles, rHooks, vandaag] = await Promise.all([
    versies('onderzoek', projectId),
    versies('angles', projectId),
    laatsteReview(projectId, 'onderzoek'),
    laatsteReview(projectId, 'angles'),
    laatsteReview(projectId, 'hooks'),
    tokensVandaag(),
  ])
  return {
    project: toProject(project),
    research: project.research ? toResearch(project.research) : null,
    angles: project.angles.map(toAngle),
    hooks: project.hooks.map(toHook),
    briefs: project.briefs.map(toBrief),
    versies: { onderzoek: vOnderzoek, angles: vAngles },
    reviews: { onderzoek: rOnderzoek, angles: rAngles, hooks: rHooks },
    tokensVandaag: vandaag,
  }
}
export type BuilderData = NonNullable<Awaited<ReturnType<typeof getBuilderData>>>

export async function getBriefDetail(briefId: string) {
  await connection()
  const b = await prisma.brief.findUnique({ where: { id: briefId }, include: { project: true, angle: true, hook: true } })
  if (!b) return null
  const [v, r, vandaag] = await Promise.all([versies('brief', b.project_id, b.id), laatsteReview(b.project_id, b.id), tokensVandaag()])
  return {
    brief: toBrief(b),
    project: toProject(b.project),
    angle: b.angle ? toAngle(b.angle) : null,
    hook: b.hook ? toHook(b.hook) : null,
    versies: v,
    review: r,
    tokensVandaag: vandaag,
  }
}
export type BriefDetail = NonNullable<Awaited<ReturnType<typeof getBriefDetail>>>

/** Alle briefs over alle projecten, voor de Brief Builder-startpagina. */
export async function getBriefsOverzicht() {
  await connection()
  const rows = await prisma.brief.findMany({ orderBy: { bijgewerkt_op: 'desc' }, include: { project: { select: { naam: true } } } })
  return rows.map((b) => ({ ...toBrief(b), projectNaam: b.project.naam }))
}

/** Per project: hoe ver de Brief Builder is (voor de startpagina en de projecttabbladen). */
export async function getBuilderVoortgang() {
  await connection()
  const projects = await prisma.project.findMany({
    orderBy: { bijgewerkt_op: 'desc' },
    select: {
      id: true,
      naam: true,
      is_voorbeeld: true,
      research: { select: { goedgekeurd: true } },
      _count: { select: { angles: true, hooks: true, briefs: true } },
      angles: { where: { geselecteerd: true }, select: { id: true } },
    },
  })
  return projects.map((p) => ({
    id: p.id,
    naam: p.naam,
    is_voorbeeld: p.is_voorbeeld,
    onderzoek: p.research ? (p.research.goedgekeurd ? 'goedgekeurd' : 'concept') : 'leeg',
    angles: p._count.angles,
    geselecteerd: p.angles.length,
    hooks: p._count.hooks,
    briefs: p._count.briefs,
  }))
}
