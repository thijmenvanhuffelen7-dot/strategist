// AI-actie: "Analyseer deze ad" (Swipe File).
import { prisma } from '../db'
import { toProject } from '../data'
import { toResearch, tokensVandaag } from '../data-builder'
import type { SwipeAnalyse } from '../builder-types'
import { getSysteemprompt } from '../prompts'
import type { Prisma } from '@/app/generated/prisma/client'
import { projectContext, researchContext } from './context'
import type { Emit } from './events'
import { AiFout, RateLimitError } from './provider'
import { vraagJson } from './run'
import { swipeSchema, swipeVoorbeeld, type SwipeOutput } from './schemas'
import { kapAf } from './tokens'
import { afbeeldingVoorAi } from './afbeelding'

const json = (v: unknown) => v as Prisma.InputJsonValue

export function swipeOutputNaarAnalyse(o: SwipeOutput, project: { id: string; naam: string } | null, metScreenshot: boolean): SwipeAnalyse {
  return { ...o, toepassingen: project ? o.toepassingen : [], project, met_screenshot: metScreenshot }
}

export async function analyseerSwipe(params: { swipeId: string; projectId?: string; screenshot?: boolean }, emit: Emit, signal?: AbortSignal) {
  const item = await prisma.swipeItem.findUnique({ where: { id: params.swipeId } })
  if (!item) throw new AiFout('Swipe-item niet gevonden.', false)
  if (!item.transcript?.trim() && !item.notities?.trim() && !(params.screenshot && item.media_type?.startsWith('image/')))
    throw new AiFout('Er is niets om te analyseren. Plak het transcript of een omschrijving van de ad (of upload een screenshot).', false)

  const project = params.projectId ? await prisma.project.findUnique({ where: { id: params.projectId }, include: { research: true } }) : null
  const tags = item.tags as Record<string, string>
  const gebruiker = [
    `# De ad\nTitel: ${item.titel}${item.merk ? `\nMerk: ${item.merk}` : ''}${item.platform ? `\nPlatform: ${item.platform}` : ''}${item.url ? `\nLink: ${item.url}` : ''}`,
    Object.values(tags).some(Boolean) ? `Bestaande tags: ${JSON.stringify(tags)}` : '',
    item.transcript?.trim() ? `# Transcript / script\n${kapAf(item.transcript, 2000)}` : '# Transcript\n(geen transcript)',
    item.notities?.trim() ? `# Notities van de strategist\n${kapAf(item.notities, 400)}` : '',
    project ? `# Toepassen op dit project\n${projectContext(toProject(project))}${project.research ? `\n\n${researchContext(toResearch(project.research))}` : ''}` : '# Project\n(geen project gekozen: geef een lege lijst toepassingen)',
  ]
    .filter(Boolean)
    .join('\n\n')

  const systeem = await getSysteemprompt('swipe')
  const vraag = (afbeelding?: string) => vraagJson({ systeem, gebruiker, schema: swipeSchema, voorbeeld: swipeVoorbeeld, maxTokens: 2500, emit, signal, afbeelding })

  let afbeelding: string | null = null
  if (params.screenshot && item.media_url && item.media_type?.startsWith('image/')) {
    afbeelding = await afbeeldingVoorAi(item.media_url, item.media_type)
    if (!afbeelding) emit({ type: 'status', bericht: 'Screenshot kon niet worden meegestuurd (te groot of niet bereikbaar); analyse op basis van tekst…' })
  }
  emit({ type: 'status', bericht: afbeelding ? 'Ad analyseren (met screenshot)…' : 'Ad analyseren…' })

  let res: Awaited<ReturnType<typeof vraag>>
  let metScreenshot = Boolean(afbeelding)
  try {
    res = await vraag(afbeelding ?? undefined)
  } catch (e) {
    // Lukt het met screenshot niet (model of formaat niet ondersteund), dan zonder screenshot.
    if (!afbeelding || e instanceof RateLimitError || (e as Error).name === 'AbortError') throw e
    console.warn('[swipe] analyse met screenshot mislukt:', (e as Error).message)
    emit({ type: 'status', bericht: 'Analyse met screenshot lukte niet; opnieuw op basis van tekst…' })
    metScreenshot = false
    res = await vraag()
  }

  const projectInfo = project ? { id: project.id, naam: project.naam } : null
  await prisma.swipeItem.update({ where: { id: item.id }, data: { analyse: json(swipeOutputNaarAnalyse(res.data, projectInfo, metScreenshot)) } })
  await prisma.aiOutput.create({
    data: { functie: 'swipe', project_id: project?.id ?? null, ref_id: item.id, output: json({ ...res.data, project: projectInfo, met_screenshot: metScreenshot }), model: res.model, input_tokens: res.verbruik.input, output_tokens: res.verbruik.output },
  })
  emit({ type: 'verbruik', input: res.verbruik.input, output: res.verbruik.output, vandaag: await tokensVandaag() })
}
