// De AI-acties van de Brief Builder. Elke actie bouwt context, vraagt de AI, slaat het resultaat op
// in de database en bewaart de ruwe uitvoer met tijdstempel en tokens (tabel ai_outputs) voor versiebeheer.
import { randomUUID } from 'node:crypto'
import { prisma } from '../db'
import { toProject } from '../data'
import { toAngle, toBrief, toHook, toResearch, tokensVandaag } from '../data-builder'
import type { ReviewStap } from '../builder-types'
import { getSysteemprompt } from '../prompts'
import type { Prisma } from '@/app/generated/prisma/client'
import { angleContext, briefContext, hookContext, projectContext, researchContext } from './context'
import type { Emit } from './events'
import { AiFout } from './provider'
import { tokenBudget, vraagJson } from './run'
import {
  anglesSchema,
  anglesVoorbeeld,
  briefSchema,
  briefVoorbeeld,
  hooksSchema,
  hooksVoorbeeld,
  onderzoekSchema,
  onderzoekVoorbeeld,
  reviewSchema,
  reviewVoorbeeld,
  type BriefOutput,
  type OnderzoekOutput,
} from './schemas'
import { schatTokens, splitsKlantdata } from './tokens'

type Verbruik = { input: number; output: number }
const json = (v: unknown) => v as Prisma.InputJsonValue

async function bewaarOutput(functie: string, projectId: string | null, refId: string | null, output: unknown, verbruik: Verbruik, model: string, emit: Emit) {
  await prisma.aiOutput.create({
    data: { functie, project_id: projectId, ref_id: refId, output: json(output), model, input_tokens: verbruik.input, output_tokens: verbruik.output },
  })
  emit({ type: 'verbruik', input: verbruik.input, output: verbruik.output, vandaag: await tokensVandaag() })
}

async function laadProject(projectId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId }, include: { research: true } })
  if (!p) throw new AiFout('Project niet gevonden.', false)
  return { project: toProject(p), research: p.research ? toResearch(p.research) : null }
}

function vereisOnderzoek<T>(research: T | null): T {
  if (!research) throw new AiFout('Doe eerst het klantonderzoek (stap 1).', false)
  return research
}

// ---------------------------------------------------------------------------
// Stap 1 – Klantonderzoek
// ---------------------------------------------------------------------------

/** Zet AI-uitvoer van het onderzoek om naar opgeslagen items (met id en ster). */
export async function slaOnderzoekOp(projectId: string, o: OnderzoekOutput) {
  const item = (tekst: string) => ({ id: randomUUID(), tekst, ster: false })
  const data = {
    pijnpunten: json(o.pijnpunten.map((p) => ({ id: randomUUID(), ...p, ster: false }))),
    verlangens: json(o.verlangens.filter(Boolean).map(item)),
    bezwaren: json(o.bezwaren.map((b) => ({ id: randomUUID(), ...b, ster: false }))),
    aha_momenten: json(o.aha_momenten.filter(Boolean).map(item)),
    klanttaal: json(o.klanttaal.filter(Boolean).map(item)),
    bewustzijnsniveau: json(o.bewustzijnsniveau),
    goedgekeurd: false,
  }
  await prisma.research.upsert({ where: { project_id: projectId }, create: { project_id: projectId, ...data }, update: data })
}

export async function onderzoek(projectId: string, emit: Emit, signal?: AbortSignal) {
  const { project } = await laadProject(projectId)
  const klantdata = project.klantdata?.trim()
  if (!klantdata) throw new AiFout('Dit project heeft nog geen klantdata. Plak eerst reviews of comments bij het project.', false)

  const systeem = await getSysteemprompt('onderzoek')
  const basis = projectContext(project, { landingspagina: true })
  const vast = schatTokens(systeem + basis + JSON.stringify(onderzoekVoorbeeld)) + 150
  const maxUit = 4000
  const verbruik: Verbruik = { input: 0, output: 0 }
  let model = ''

  let resultaat: OnderzoekOutput
  if (schatTokens(klantdata) <= tokenBudget() - maxUit - vast) {
    emit({ type: 'status', bericht: 'Klantdata analyseren…' })
    const r = await vraagJson({ systeem, gebruiker: `${basis}\n\n# Ruwe klantdata\n${klantdata}`, schema: onderzoekSchema, voorbeeld: onderzoekVoorbeeld, maxTokens: maxUit, emit, signal })
    resultaat = r.data
    verbruik.input += r.verbruik.input
    verbruik.output += r.verbruik.output
    model = r.model
  } else {
    // Te veel klantdata voor één verzoek: per stuk analyseren en daarna samenvoegen.
    const maxUitDeel = 2500
    const stukken = splitsKlantdata(klantdata, tokenBudget() - maxUitDeel - vast)
    const delen: OnderzoekOutput[] = []
    for (const [i, stuk] of stukken.entries()) {
      emit({ type: 'status', bericht: `Veel klantdata: deel ${i + 1} van ${stukken.length} analyseren…` })
      const r = await vraagJson({
        systeem,
        gebruiker: `${basis}\n\n# Ruwe klantdata (deel ${i + 1} van ${stukken.length})\n${stuk}\n\nGeef voor dit deel maximaal 6 pijnpunten en 15 klanttaal-items.`,
        schema: onderzoekSchema,
        voorbeeld: onderzoekVoorbeeld,
        maxTokens: maxUitDeel,
        emit,
        signal,
      })
      delen.push(r.data)
      verbruik.input += r.verbruik.input
      verbruik.output += r.verbruik.output
      model = r.model
    }
    emit({ type: 'status', bericht: `${stukken.length} deelanalyses samenvoegen…` })
    const r = await vraagJson({
      systeem: await getSysteemprompt('onderzoek_samenvoegen'),
      gebruiker: `${projectContext(project)}\n\n# Deelanalyses\n${delen.map((d, i) => `## Deel ${i + 1}\n${JSON.stringify(d)}`).join('\n\n')}`,
      schema: onderzoekSchema,
      voorbeeld: onderzoekVoorbeeld,
      maxTokens: maxUit,
      emit,
      signal,
    })
    resultaat = r.data
    verbruik.input += r.verbruik.input
    verbruik.output += r.verbruik.output
  }

  await slaOnderzoekOp(projectId, resultaat)
  await bewaarOutput('onderzoek', projectId, null, resultaat, verbruik, model, emit)
}

// ---------------------------------------------------------------------------
// Stap 2 – Angles
// ---------------------------------------------------------------------------

/** Vervangt de AI-angles (eigen en geselecteerde angles blijven staan). */
export async function slaAnglesOp(projectId: string, angles: { naam: string; type: string; kernboodschap: string; doelgroep: string; onderbouwing: string; risico: string; score: number }[]) {
  await prisma.$transaction([
    prisma.angle.deleteMany({ where: { project_id: projectId, eigen: false, geselecteerd: false } }),
    prisma.angle.createMany({ data: angles.map((a) => ({ ...a, project_id: projectId })) }),
  ])
}

export async function genereerAngles(projectId: string, emit: Emit, signal?: AbortSignal) {
  const { project, research } = await laadProject(projectId)
  const r = vereisOnderzoek(research)
  const blijven = await prisma.angle.findMany({ where: { project_id: projectId, OR: [{ eigen: true }, { geselecteerd: true }] } })
  emit({ type: 'status', bericht: 'Angles bedenken…' })
  const res = await vraagJson({
    systeem: await getSysteemprompt('angles'),
    gebruiker: [
      projectContext(project),
      researchContext(r, { quotes: 2 }),
      blijven.length ? `# Bestaande angles (niet herhalen)\n${blijven.map((a) => `- ${a.naam} (${a.type})`).join('\n')}` : '',
    ].join('\n\n'),
    schema: anglesSchema,
    voorbeeld: anglesVoorbeeld,
    maxTokens: 3500,
    emit,
    signal,
  })
  await slaAnglesOp(projectId, res.data.angles)
  await bewaarOutput('angles', projectId, null, res.data, res.verbruik, res.model, emit)
}

// ---------------------------------------------------------------------------
// Stap 3 – Hooks
// ---------------------------------------------------------------------------

export async function genereerHooks(projectId: string, angleId: string, emit: Emit, signal?: AbortSignal) {
  const { project, research } = await laadProject(projectId)
  const r = vereisOnderzoek(research)
  const angle = await prisma.angle.findFirst({ where: { id: angleId, project_id: projectId } })
  if (!angle) throw new AiFout('Angle niet gevonden.', false)
  const bestaand = await prisma.hook.findMany({ where: { angle_id: angleId }, select: { gesproken: true } })
  emit({ type: 'status', bericht: `Hooks schrijven voor “${angle.naam}”…` })
  const res = await vraagJson({
    systeem: await getSysteemprompt('hooks'),
    gebruiker: [
      projectContext(project),
      angleContext(toAngle(angle)),
      `# Klanttaal-bank\n${r.klanttaal.map((k) => `"${k.tekst}"`).join(', ')}`,
      `# Belangrijkste pijnpunten\n${r.pijnpunten.slice(0, 4).map((p) => `- ${p.omschrijving}${p.quotes[0] ? ` ("${p.quotes[0]}")` : ''}`).join('\n')}`,
      bestaand.length ? `# Bestaande hooks (niet herhalen)\n${bestaand.map((h) => `- ${h.gesproken}`).join('\n')}` : '',
    ].join('\n\n'),
    schema: hooksSchema,
    voorbeeld: hooksVoorbeeld,
    maxTokens: 1800,
    emit,
    signal,
  })
  await prisma.hook.createMany({ data: res.data.hooks.map((h) => ({ ...h, project_id: projectId, angle_id: angleId })) })
  await bewaarOutput('hooks', projectId, angleId, res.data, res.verbruik, res.model, emit)
}

// ---------------------------------------------------------------------------
// Stap 4 – Creative brief
// ---------------------------------------------------------------------------

export function briefOutputNaarInhoud(o: BriefOutput) {
  const { titel, ...rest } = o
  return { titel, inhoud: { ...rest, script: rest.script.map((s) => ({ id: randomUUID(), ...s })) } }
}

/** Nieuwe brief (zonder briefId) of bestaande brief opnieuw genereren (met briefId). Geeft het brief-id terug. */
export async function genereerBrief(
  params: { projectId: string; angleId: string; hookId: string; briefId?: string },
  emit: Emit,
  signal?: AbortSignal,
): Promise<{ briefId: string }> {
  const { project, research } = await laadProject(params.projectId)
  const r = vereisOnderzoek(research)
  const [angle, hook] = await Promise.all([
    prisma.angle.findFirst({ where: { id: params.angleId, project_id: params.projectId } }),
    prisma.hook.findFirst({ where: { id: params.hookId, project_id: params.projectId } }),
  ])
  if (!angle || !hook) throw new AiFout('Kies een angle en een hook.', false)
  emit({ type: 'status', bericht: 'Brief schrijven…' })
  const res = await vraagJson({
    systeem: await getSysteemprompt('brief'),
    gebruiker: [projectContext(project, { drempels: true }), researchContext(r), angleContext(toAngle(angle)), hookContext(toHook(hook))].join('\n\n'),
    schema: briefSchema,
    voorbeeld: briefVoorbeeld,
    maxTokens: 4500,
    emit,
    signal,
  })
  const { titel, inhoud } = briefOutputNaarInhoud(res.data)
  const brief = params.briefId
    ? await prisma.brief.update({ where: { id: params.briefId }, data: { titel, inhoud: json(inhoud), angle_id: angle.id, hook_id: hook.id } })
    : await prisma.brief.create({ data: { project_id: params.projectId, angle_id: angle.id, hook_id: hook.id, titel, inhoud: json(inhoud) } })
  await bewaarOutput('brief', params.projectId, brief.id, res.data, res.verbruik, res.model, emit)
  return { briefId: brief.id }
}

// ---------------------------------------------------------------------------
// Kritische review
// ---------------------------------------------------------------------------

export async function kritischeReview(params: { projectId?: string; stap: ReviewStap; briefId?: string; croId?: string; swipeId?: string }, emit: Emit, signal?: AbortSignal) {
  if (params.stap === 'cro') return croReview(params.croId, emit, signal)
  if (params.stap === 'swipe') return swipeReview(params.swipeId, emit, signal)
  if (!params.projectId) throw new AiFout('Project ontbreekt.', false)
  const { project, research } = await laadProject(params.projectId)
  let werk: string
  if (params.stap === 'onderzoek') {
    werk = researchContext(vereisOnderzoek(research), { quotes: 3 })
  } else if (params.stap === 'angles') {
    const angles = await prisma.angle.findMany({ where: { project_id: params.projectId }, orderBy: { score: 'desc' } })
    if (!angles.length) throw new AiFout('Er zijn nog geen angles om te beoordelen.', false)
    werk = `# Angles\n${angles.map((a) => `${angleContext(toAngle(a))}\nScore: ${a.score ?? '-'}${a.geselecteerd ? ' (geselecteerd)' : ''}`).join('\n\n')}`
  } else if (params.stap === 'hooks') {
    const angles = await prisma.angle.findMany({ where: { project_id: params.projectId, geselecteerd: true }, include: { hooks: true } })
    const metHooks = angles.filter((a) => a.hooks.length)
    if (!metHooks.length) throw new AiFout('Er zijn nog geen hooks om te beoordelen.', false)
    werk = metHooks.map((a) => `# Angle: ${a.naam}\n${a.hooks.map((h) => `- [${h.type}] "${h.gesproken}" | overlay: ${h.overlay} | shot: ${h.eerste_shot}`).join('\n')}`).join('\n\n')
  } else {
    const b = params.briefId ? await prisma.brief.findFirst({ where: { id: params.briefId, project_id: params.projectId } }) : null
    if (!b) throw new AiFout('Brief niet gevonden.', false)
    const brief = toBrief(b)
    werk = briefContext(brief.titel, brief.inhoud)
  }
  emit({ type: 'status', bericht: 'Creative director leest mee…' })
  const res = await vraagJson({
    systeem: await getSysteemprompt('review'),
    gebruiker: `${projectContext(project)}\n\n# Te beoordelen: ${params.stap}\n${werk}`,
    schema: reviewSchema,
    voorbeeld: reviewVoorbeeld,
    maxTokens: 1800,
    emit,
    signal,
  })
  const refId = params.stap === 'brief' ? params.briefId! : params.stap
  await bewaarOutput('review', params.projectId, refId, res.data, res.verbruik, res.model, emit)
}

/** Review van een CRO-check: beoordeelt het CRO-advies zelf. */
async function croReview(croId: string | undefined, emit: Emit, signal?: AbortSignal) {
  const check = croId ? await prisma.croCheck.findUnique({ where: { id: croId }, include: { project: true } }) : null
  if (!check?.analyse) throw new AiFout('Er is nog geen CRO-advies om te beoordelen.', false)
  emit({ type: 'status', bericht: 'Creative director leest mee…' })
  const res = await vraagJson({
    systeem: await getSysteemprompt('review'),
    gebruiker: `${check.project ? projectContext(toProject(check.project)) : ''}\n\n# Te beoordelen: CRO-advies voor ${check.url ?? check.titel}\n${JSON.stringify(check.analyse)}\n\n# Paginatekst (begin)\n${check.pagina_tekst.slice(0, 2500)}`,
    schema: reviewSchema,
    voorbeeld: reviewVoorbeeld,
    maxTokens: 1800,
    emit,
    signal,
  })
  await bewaarOutput('review', check.project_id, check.id, res.data, res.verbruik, res.model, emit)
}

/** Review van een swipe-analyse. */
async function swipeReview(swipeId: string | undefined, emit: Emit, signal?: AbortSignal) {
  const item = swipeId ? await prisma.swipeItem.findUnique({ where: { id: swipeId } }) : null
  if (!item?.analyse) throw new AiFout('Er is nog geen analyse om te beoordelen.', false)
  emit({ type: 'status', bericht: 'Creative director leest mee…' })
  const res = await vraagJson({
    systeem: await getSysteemprompt('review'),
    gebruiker: `# Te beoordelen: analyse van een swipe-ad ("${item.titel}")\n${JSON.stringify(item.analyse)}\n\n# Transcript van de ad\n${(item.transcript ?? '(geen)').slice(0, 2500)}`,
    schema: reviewSchema,
    voorbeeld: reviewVoorbeeld,
    maxTokens: 1800,
    emit,
    signal,
  })
  const projectId = (item.analyse as { project?: { id: string } | null }).project?.id ?? null
  await bewaarOutput('review', projectId, item.id, res.data, res.verbruik, res.model, emit)
}
