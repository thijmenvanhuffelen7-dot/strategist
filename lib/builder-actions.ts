'use server'
// Bewerkingen in de Brief Builder (zonder AI). Tekstwijzigingen worden automatisch opgeslagen;
// de interface houdt zelf de actuele stand bij, dus hier geen revalidatePath (dat zou typen onderbreken).
import { randomUUID } from 'node:crypto'
import { prisma } from './db'
import { vereisLogin } from './auth'
import type { Prisma } from '@/app/generated/prisma/client'
import { BRIEF_STATUSSEN, legeBriefInhoud, type BriefInhoud, type ResearchData } from './builder-types'
import { briefOutputNaarInhoud, slaAnglesOp, slaOnderzoekOp } from './ai/acties'
import { anglesSchema, briefSchema, croSchema, onderzoekSchema } from './ai/schemas'
import { croOutputNaarAnalyse } from './ai/cro'

const json = (v: unknown) => v as Prisma.InputJsonValue
const MAX_GESELECTEERD = 5

// --- Onderzoek ---------------------------------------------------------------

type ResearchPatch = Partial<Pick<ResearchData, 'pijnpunten' | 'verlangens' | 'bezwaren' | 'aha_momenten' | 'klanttaal' | 'bewustzijnsniveau'>>
const RESEARCH_VELDEN = ['pijnpunten', 'verlangens', 'bezwaren', 'aha_momenten', 'klanttaal', 'bewustzijnsniveau'] as const

export async function updateOnderzoek(projectId: string, patch: ResearchPatch) {
  await vereisLogin()
  const data: Record<string, Prisma.InputJsonValue> = {}
  for (const k of RESEARCH_VELDEN) if (k in patch) data[k] = json(patch[k])
  await prisma.research.update({ where: { project_id: projectId }, data })
}

/** Leeg onderzoek om handmatig in te vullen (bijv. zonder AI-key). */
export async function maakLeegOnderzoek(projectId: string) {
  await vereisLogin()
  await prisma.research.upsert({
    where: { project_id: projectId },
    create: { project_id: projectId, pijnpunten: [], verlangens: [], bezwaren: [], aha_momenten: [], klanttaal: [] },
    update: {},
  })
}

export async function keurOnderzoekGoed(projectId: string, goedgekeurd: boolean) {
  await vereisLogin()
  await prisma.research.update({ where: { project_id: projectId }, data: { goedgekeurd } })
}

// --- Angles ------------------------------------------------------------------

type AnglePatch = Partial<{ naam: string; type: string; kernboodschap: string; doelgroep: string; onderbouwing: string; risico: string; score: number }>

function angleVelden(p: AnglePatch) {
  const uit: AnglePatch = {}
  for (const k of ['naam', 'type', 'kernboodschap', 'doelgroep', 'onderbouwing', 'risico'] as const) if (typeof p[k] === 'string') uit[k] = p[k]
  if (p.score != null) uit.score = Math.min(10, Math.max(1, Math.round(Number(p.score)) || 5))
  return uit
}

export async function voegAngleToe(projectId: string, waarden: AnglePatch): Promise<string> {
  await vereisLogin()
  const a = await prisma.angle.create({ data: { project_id: projectId, naam: waarden.naam?.trim() || 'Eigen angle', ...angleVelden(waarden), eigen: true } })
  return a.id
}

export async function updateAngle(id: string, patch: AnglePatch) {
  await vereisLogin()
  await prisma.angle.update({ where: { id }, data: angleVelden(patch) })
}

export async function verwijderAngle(id: string) {
  await vereisLogin()
  await prisma.angle.delete({ where: { id } })
}

export async function selecteerAngle(id: string, geselecteerd: boolean) {
  await vereisLogin()
  const angle = await prisma.angle.findUniqueOrThrow({ where: { id } })
  if (geselecteerd) {
    const aantal = await prisma.angle.count({ where: { project_id: angle.project_id, geselecteerd: true, NOT: { id } } })
    if (aantal >= MAX_GESELECTEERD) throw new Error(`Je kunt maximaal ${MAX_GESELECTEERD} angles selecteren.`)
  }
  await prisma.angle.update({ where: { id }, data: { geselecteerd } })
}

// --- Hooks -------------------------------------------------------------------

type HookPatch = Partial<{ gesproken: string; overlay: string; eerste_shot: string; type: string }>

function hookVelden(p: HookPatch) {
  const uit: HookPatch = {}
  for (const k of ['gesproken', 'overlay', 'eerste_shot', 'type'] as const) if (typeof p[k] === 'string') uit[k] = p[k]
  return uit
}

export async function voegHookToe(projectId: string, angleId: string): Promise<string> {
  await vereisLogin()
  const h = await prisma.hook.create({ data: { project_id: projectId, angle_id: angleId, gesproken: '', type: 'directe aanspreking' } })
  return h.id
}

export async function updateHook(id: string, patch: HookPatch) {
  await vereisLogin()
  await prisma.hook.update({ where: { id }, data: hookVelden(patch) })
}

export async function verwijderHook(id: string) {
  await vereisLogin()
  await prisma.hook.delete({ where: { id } })
}

/** Ster = opgenomen in de hook-bibliotheek. */
export async function sterHook(id: string, ster: boolean) {
  await vereisLogin()
  await prisma.hook.update({ where: { id }, data: { ster } })
}

// --- Briefs ------------------------------------------------------------------

export async function updateBrief(id: string, patch: { titel?: string; inhoud?: BriefInhoud; status?: string }) {
  await vereisLogin()
  const data: Prisma.BriefUpdateInput = {}
  if (typeof patch.titel === 'string') data.titel = patch.titel.trim() || 'Naamloze brief'
  if (patch.inhoud) data.inhoud = json(patch.inhoud)
  if (patch.status && (BRIEF_STATUSSEN as readonly string[]).includes(patch.status)) data.status = patch.status
  await prisma.brief.update({ where: { id }, data })
}

/** Lege brief om zelf in te vullen. De gekozen hook komt alvast in de eerste scriptregel. */
export async function maakLegeBrief(projectId: string, angleId: string | null, hookId: string | null): Promise<string> {
  await vereisLogin()
  const [angle, hook] = await Promise.all([
    angleId ? prisma.angle.findFirst({ where: { id: angleId, project_id: projectId } }) : null,
    hookId ? prisma.hook.findFirst({ where: { id: hookId, project_id: projectId } }) : null,
  ])
  const inhoud = legeBriefInhoud()
  inhoud.overzicht.angle = angle?.naam ?? ''
  if (hook) inhoud.script = [{ id: randomUUID(), tijd: '0–3s', fase: 'hook', beeld: hook.eerste_shot ?? '', gesproken: hook.gesproken ?? '', tekst_op_beeld: hook.overlay ?? '', opmerkingen: '' }]
  const b = await prisma.brief.create({
    data: { project_id: projectId, angle_id: angle?.id ?? null, hook_id: hook?.id ?? null, titel: angle ? `Brief – ${angle.naam}` : 'Naamloze brief', inhoud: json(inhoud) },
  })
  return b.id
}

/** Kopie als variant (status terug naar concept). Geeft het nieuwe id terug. */
export async function dupliceerBrief(id: string): Promise<string> {
  await vereisLogin()
  const b = await prisma.brief.findUniqueOrThrow({ where: { id } })
  const inhoud = b.inhoud as unknown as BriefInhoud
  const kopie = await prisma.brief.create({
    data: {
      project_id: b.project_id,
      angle_id: b.angle_id,
      hook_id: b.hook_id,
      titel: `${b.titel} (variant)`,
      status: 'concept',
      inhoud: json({ ...inhoud, script: (inhoud.script ?? []).map((r) => ({ ...r, id: randomUUID() })) }),
    },
  })
  return kopie.id
}

export async function verwijderBrief(id: string) {
  await vereisLogin()
  await prisma.brief.delete({ where: { id } })
}

// --- Versies -----------------------------------------------------------------

/** Zet een eerdere AI-uitvoer terug (onderzoek, angles, brief of CRO-check). */
export async function herstelVersie(aiOutputId: string) {
  await vereisLogin()
  const v = await prisma.aiOutput.findUniqueOrThrow({ where: { id: aiOutputId } })
  if (v.functie === 'cro' && v.ref_id) {
    await prisma.croCheck.update({ where: { id: v.ref_id }, data: { analyse: json(croOutputNaarAnalyse(croSchema.parse(v.output))) } })
    return
  }
  if (!v.project_id) throw new Error('Deze versie hoort bij geen project.')
  if (v.functie === 'onderzoek') await slaOnderzoekOp(v.project_id, onderzoekSchema.parse(v.output))
  else if (v.functie === 'angles') await slaAnglesOp(v.project_id, anglesSchema.parse(v.output).angles)
  else if (v.functie === 'brief' && v.ref_id) {
    const { titel, inhoud } = briefOutputNaarInhoud(briefSchema.parse(v.output))
    await prisma.brief.update({ where: { id: v.ref_id }, data: { titel, inhoud: json(inhoud) } })
  } else throw new Error('Deze versie kan niet worden teruggezet.')
}

// --- Instellingen ------------------------------------------------------------

export async function bewaarAiModel(model: string) {
  await vereisLogin()
  const ai_model = model.trim() || null
  await prisma.profiel.upsert({ where: { id: 1 }, create: { id: 1, ai_model, drempels: {}, tag_lijsten: {} }, update: { ai_model } })
}
