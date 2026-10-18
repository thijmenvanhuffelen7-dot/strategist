// AI-actie: CRO-check van een opgehaalde of geplakte landingspagina.
import { randomUUID } from 'node:crypto'
import { prisma } from '../db'
import { toProject } from '../data'
import { toResearch, tokensVandaag } from '../data-builder'
import type { CroAnalyse } from '../builder-types'
import { getSysteemprompt } from '../prompts'
import type { Prisma } from '@/app/generated/prisma/client'
import { projectContext, researchContext } from './context'
import type { Emit } from './events'
import { AiFout } from './provider'
import { tokenBudget, vraagJson } from './run'
import { croSchema, croVoorbeeld, type CroOutput } from './schemas'
import { kapAf, schatTokens } from './tokens'

const json = (v: unknown) => v as Prisma.InputJsonValue

export function croOutputNaarAnalyse(o: CroOutput): CroAnalyse {
  return { ...o, punten: o.punten.map((p) => ({ id: randomUUID(), ...p, gedaan: false })) }
}

export async function croCheck(croId: string, emit: Emit, signal?: AbortSignal) {
  const check = await prisma.croCheck.findUnique({ where: { id: croId }, include: { project: { include: { research: true } } } })
  if (!check) throw new AiFout('CRO-check niet gevonden.', false)

  const systeem = await getSysteemprompt('cro')
  const context = check.project
    ? [projectContext(toProject(check.project)), check.project.research ? researchContext(toResearch(check.project.research), { quotes: 1 }) : '# Klantonderzoek\n(nog niet gedaan)'].join('\n\n')
    : '(Geen project gekoppeld: beoordeel de pagina op zichzelf.)'
  const maxUit = 4500
  // De paginatekst krijgt de ruimte die overblijft binnen het limiet.
  const vast = schatTokens(systeem + context + JSON.stringify(croVoorbeeld)) + 200
  const ruimte = tokenBudget() - maxUit - vast
  if (ruimte < 800) throw new AiFout('Te weinig ruimte binnen het tokenlimiet voor deze pagina. Probeer het zonder gekoppeld project.', false)
  const pagina = kapAf(check.pagina_tekst, ruimte)
  if (pagina.length < check.pagina_tekst.length) emit({ type: 'status', bericht: 'Lange pagina: alleen het eerste deel past binnen het limiet…' })
  else emit({ type: 'status', bericht: 'Pagina beoordelen…' })

  const res = await vraagJson({
    systeem,
    gebruiker: `${context}\n\n# Landingspagina${check.url ? ` (${check.url})` : ''}\n${pagina}`,
    schema: croSchema,
    voorbeeld: croVoorbeeld,
    maxTokens: maxUit,
    emit,
    signal,
  })
  await prisma.croCheck.update({ where: { id: croId }, data: { analyse: json(croOutputNaarAnalyse(res.data)) } })
  await prisma.aiOutput.create({
    data: { functie: 'cro', project_id: check.project_id, ref_id: croId, output: json(res.data), model: res.model, input_tokens: res.verbruik.input, output_tokens: res.verbruik.output },
  })
  emit({ type: 'verbruik', input: res.verbruik.input, output: res.verbruik.output, vandaag: await tokensVandaag() })
}
