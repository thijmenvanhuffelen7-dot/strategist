// Eén endpoint voor alle AI-acties. Antwoordt met een stream van AiEvents (één JSON-object per regel).
import { z } from 'zod'
import { genereerAngles, genereerBrief, genereerHooks, kritischeReview, onderzoek } from '@/lib/ai/acties'
import { AiFout } from '@/lib/ai/provider'
import type { AiEvent } from '@/lib/ai/events'
import { REVIEW_STAPPEN } from '@/lib/builder-types'

const Verzoek = z.discriminatedUnion('actie', [
  z.object({ actie: z.literal('onderzoek'), projectId: z.string() }),
  z.object({ actie: z.literal('angles'), projectId: z.string() }),
  z.object({ actie: z.literal('hooks'), projectId: z.string(), angleId: z.string() }),
  z.object({ actie: z.literal('brief'), projectId: z.string(), angleId: z.string(), hookId: z.string(), briefId: z.string().optional() }),
  z.object({ actie: z.literal('review'), projectId: z.string(), stap: z.enum(REVIEW_STAPPEN), briefId: z.string().optional() }),
])

export async function POST(req: Request) {
  const parsed = Verzoek.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ fout: 'Ongeldig verzoek' }, { status: 400 })
  const v = parsed.data
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: AiEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`))
        } catch {
          // browser is weg
        }
      }
      try {
        let resultaat: unknown
        if (v.actie === 'onderzoek') await onderzoek(v.projectId, emit, req.signal)
        else if (v.actie === 'angles') await genereerAngles(v.projectId, emit, req.signal)
        else if (v.actie === 'hooks') await genereerHooks(v.projectId, v.angleId, emit, req.signal)
        else if (v.actie === 'brief') resultaat = await genereerBrief(v, emit, req.signal)
        else await kritischeReview(v, emit, req.signal)
        emit({ type: 'klaar', resultaat })
      } catch (err) {
        if (err instanceof AiFout) emit({ type: 'fout', bericht: err.message, opnieuw: err.opnieuwProberen })
        else if (err instanceof Error && err.name === 'AbortError') emit({ type: 'fout', bericht: 'Afgebroken.', opnieuw: true })
        else {
          console.error('[AI]', err)
          emit({ type: 'fout', bericht: 'Er ging iets onverwachts mis. Bekijk de terminal voor details.', opnieuw: true })
        }
      } finally {
        try {
          controller.close()
        } catch {
          // al gesloten
        }
      }
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' } })
}
