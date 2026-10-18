// AI-actie: CRO-check van een opgehaalde of geplakte landingspagina.
import { randomUUID } from 'node:crypto'
import { prisma } from '../db'
import { toProject } from '../data'
import { toResearch, tokensVandaag } from '../data-builder'
import type { CroAnalyse, CroScreenshot, CroVisueel } from '../builder-types'
import { afbeeldingVoorAi } from './afbeelding'
import { getSysteemprompt } from '../prompts'
import type { Prisma } from '@/app/generated/prisma/client'
import { projectContext, researchContext } from './context'
import type { Emit } from './events'
import { AiFout, RateLimitError } from './provider'
import { tokenBudget, vraagJson } from './run'
import { croSchema, croVisueelSchema, croVisueelVoorbeeld, croVoorbeeld, type CroOutput } from './schemas'
import { kapAf, schatTokens } from './tokens'

const json = (v: unknown) => v as Prisma.InputJsonValue

export function croOutputNaarAnalyse(o: CroOutput, visueel?: CroVisueel[], screenshotsMislukt = false): CroAnalyse {
  return {
    ...o,
    punten: o.punten.map((p) => ({ id: randomUUID(), ...p, gedaan: false })),
    ...(visueel?.length ? { visueel } : {}),
    ...(screenshotsMislukt ? { screenshots_mislukt: true } : {}),
  }
}

/** Stap 1: het beeldmodel beschrijft elke screenshot. Mislukt er één, dan gaan we verder zonder. */
async function bekijkScreenshots(screenshots: CroScreenshot[], verbruik: { input: number; output: number }, emit: Emit, signal?: AbortSignal): Promise<CroVisueel[]> {
  const uit: CroVisueel[] = []
  const systeem = await getSysteemprompt('cro_visueel')
  for (const [i, s] of screenshots.entries()) {
    emit({ type: 'status', bericht: `Screenshot ${i + 1} van ${screenshots.length} bekijken (${s.label})…` })
    const afbeelding = await afbeeldingVoorAi(s.ref, s.type)
    if (!afbeelding) {
      emit({ type: 'status', bericht: `Screenshot ${s.label} kon niet worden meegestuurd (te groot of niet bereikbaar).` })
      continue
    }
    try {
      const r = await vraagJson({ systeem, gebruiker: `Screenshot: ${s.label} (${s.label === 'mobiel' ? 'mobiele weergave' : s.label === 'desktop' ? 'desktopweergave' : 'deel van de pagina'})`, schema: croVisueelSchema, voorbeeld: croVisueelVoorbeeld, maxTokens: 1200, emit, signal, afbeelding })
      uit.push({ label: s.label, ...r.data })
      verbruik.input += r.verbruik.input
      verbruik.output += r.verbruik.output
    } catch (e) {
      if (e instanceof RateLimitError || (e as Error).name === 'AbortError') throw e
      console.warn('[cro] screenshot bekijken mislukt:', (e as Error).message)
      emit({ type: 'status', bericht: `Screenshot ${s.label} kon niet worden bekeken; verder op basis van de rest…` })
    }
  }
  return uit
}

function visueelContext(v: CroVisueel[]) {
  return `# Visuele observaties van screenshots\n${v
    .map(
      (x) =>
        `## screenshot ${x.label}\nBoven de vouw: ${x.boven_de_vouw}\nCTA: ${x.cta}\nHiërarchie: ${x.hierarchie}\nVertrouwen: ${x.vertrouwen}\nLeesbaarheid: ${x.leesbaarheid}\nProblemen:\n${x.problemen.map((p) => `- ${p.probleem} (${p.waar})`).join('\n') || '- geen'}`,
    )
    .join('\n\n')}`
}

export async function croCheck(croId: string, emit: Emit, signal?: AbortSignal) {
  const check = await prisma.croCheck.findUnique({ where: { id: croId }, include: { project: { include: { research: true } } } })
  if (!check) throw new AiFout('CRO-check niet gevonden.', false)

  const verbruik = { input: 0, output: 0 }
  const screenshots = ((check.screenshots as unknown as CroScreenshot[]) ?? []).slice(0, 3)
  const visueel = screenshots.length ? await bekijkScreenshots(screenshots, verbruik, emit, signal) : []
  if (screenshots.length && !visueel.length) emit({ type: 'status', bericht: 'De screenshots konden niet worden bekeken; het advies is alleen op basis van de tekst.' })

  const systeem = await getSysteemprompt('cro')
  const context = [
    check.project
      ? [projectContext(toProject(check.project)), check.project.research ? researchContext(toResearch(check.project.research), { quotes: 1 }) : '# Klantonderzoek\n(nog niet gedaan)'].join('\n\n')
      : '(Geen project gekoppeld: beoordeel de pagina op zichzelf.)',
    visueel.length ? visueelContext(visueel) : '(Geen screenshots: je ziet alleen de tekst.)',
  ].join('\n\n')
  const maxUit = 4500
  // De paginatekst krijgt de ruimte die overblijft binnen het limiet.
  const vast = schatTokens(systeem + context + JSON.stringify(croVoorbeeld)) + 200
  const ruimte = tokenBudget() - maxUit - vast
  if (ruimte < 800) throw new AiFout('Te weinig ruimte binnen het tokenlimiet voor deze pagina. Probeer het zonder gekoppeld project.', false)
  const pagina = kapAf(check.pagina_tekst, ruimte)
  if (pagina.length < check.pagina_tekst.length) emit({ type: 'status', bericht: 'Lange pagina: alleen het eerste deel past binnen het limiet…' })
  else emit({ type: 'status', bericht: visueel.length ? 'Advies schrijven op basis van tekst en screenshots…' : 'Pagina beoordelen…' })

  const res = await vraagJson({
    systeem,
    gebruiker: `${context}\n\n# Landingspagina${check.url ? ` (${check.url})` : ''}\n${pagina}`,
    schema: croSchema,
    voorbeeld: croVoorbeeld,
    maxTokens: maxUit,
    emit,
    signal,
  })
  verbruik.input += res.verbruik.input
  verbruik.output += res.verbruik.output
  await prisma.croCheck.update({ where: { id: croId }, data: { analyse: json(croOutputNaarAnalyse(res.data, visueel, screenshots.length > visueel.length)) } })
  await prisma.aiOutput.create({
    data: { functie: 'cro', project_id: check.project_id, ref_id: croId, output: json({ ...res.data, visueel }), model: res.model, input_tokens: verbruik.input, output_tokens: verbruik.output },
  })
  emit({ type: 'verbruik', input: verbruik.input, output: verbruik.output, vandaag: await tokensVandaag() })
}
