'use client'
import { useState } from 'react'
import { Gavel, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReviewResultaat, ReviewStap } from '@/lib/builder-types'
import { Button, Pill } from '../ui'
import { AiStatus } from './AiStatus'
import { useAiActie } from './useAiActie'
import type { AiInfo } from './types'

/** Knop "Kritische review" plus de laatste review van deze stap. */
export function Review({
  projectId,
  stap,
  briefId,
  laatste,
  ai,
  uitgeschakeld,
}: {
  projectId: string
  stap: ReviewStap
  briefId?: string
  laatste: { review: ReviewResultaat; aangemaakt_op: Date } | null
  ai: AiInfo
  uitgeschakeld?: string
}) {
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [open, setOpen] = useState(true)

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Gavel className="size-4 text-zinc-400" />
        <h3 className="text-sm font-semibold">Kritische review</h3>
        {laatste && <Pill color={laatste.review.score >= 7 ? 'green' : laatste.review.score >= 5 ? 'amber' : 'red'}>{laatste.review.score}/10</Pill>}
        <div className="ml-auto flex gap-1">
          {laatste && (
            <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} icon={open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}>
              {open ? 'Inklappen' : 'Tonen'}
            </Button>
          )}
          <Button
            size="sm"
            loading={staat.bezig}
            disabled={!ai.ingesteld || Boolean(uitgeschakeld)}
            title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : uitgeschakeld}
            onClick={() => {
              setOpen(true)
              start({ actie: 'review', projectId, stap, briefId })
            }}
          >
            {laatste ? 'Nieuwe review' : 'Vraag review'}
          </Button>
        </div>
      </div>
      {!laatste && !staat.bezig && (
        <p className="mt-2 text-xs text-zinc-500">Een strenge creative director benoemt de zwakste aannames en wat er nog ontbreekt.</p>
      )}
      <div className="mt-3">
        <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />
      </div>
      {laatste && open && !staat.bezig && (
        <div className="mt-2 space-y-3 text-sm">
          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{laatste.review.oordeel}</p>
          <div>
            <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Zwakste aannames</h4>
            <ul className="space-y-2">
              {laatste.review.zwakste_aannames.map((a, i) => (
                <li key={i} className="rounded-md border border-zinc-100 p-2.5 dark:border-zinc-800">
                  <p className="font-medium">{a.punt}</p>
                  {a.waarom && <p className="mt-0.5 text-zinc-500">{a.waarom}</p>}
                  {a.verbetering && <p className="mt-1 text-emerald-700 dark:text-emerald-400">→ {a.verbetering}</p>}
                </li>
              ))}
            </ul>
          </div>
          {laatste.review.ontbrekende_info.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Ontbrekende informatie</h4>
              <ul className="list-disc space-y-0.5 pl-5 text-zinc-600 dark:text-zinc-400">
                {laatste.review.ontbrekende_info.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-zinc-400">{laatste.aangemaakt_op.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}
    </section>
  )
}
