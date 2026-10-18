'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Sparkles, Star, FilePlus } from 'lucide-react'
import { maakLegeBrief } from '@/lib/builder-actions'
import type { AngleData, BriefData, HookData } from '@/lib/builder-types'
import { Button, EmptyState, Pill, StatusPill } from '../ui'
import { AiStatus } from '../ai/AiStatus'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { GeenKey } from './StapOnderzoek'

export function StapBrief({
  projectId,
  angles,
  hooks,
  briefs,
  ai,
  onVorige,
}: {
  projectId: string
  angles: AngleData[]
  hooks: HookData[]
  briefs: BriefData[]
  ai: AiInfo
  onVorige: () => void
}) {
  const router = useRouter()
  const kandidaten = angles.filter((a) => hooks.some((h) => h.angle_id === a.id)).sort((a, b) => Number(b.geselecteerd) - Number(a.geselecteerd) || (b.score ?? 0) - (a.score ?? 0))
  const [angleId, setAngleId] = useState<string | null>(kandidaten[0]?.id ?? null)
  const angleHooks = hooks.filter((h) => h.angle_id === angleId).sort((a, b) => Number(b.ster) - Number(a.ster))
  const [hookId, setHookId] = useState<string | null>(null)
  const gekozenHook = angleHooks.find((h) => h.id === hookId) ?? null
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()

  const genereer = async () => {
    if (!angleId || !gekozenHook) return
    const res = (await start({ actie: 'brief', projectId, angleId, hookId: gekozenHook.id })) as { briefId?: string } | undefined
    if (res?.briefId) router.push(`/briefs/${res.briefId}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Stap 4 · Creative brief</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Kies één angle en één hook. De AI schrijft daar een complete brief bij, die je daarna helemaal kunt bewerken.</p>
      </div>
      {!ai.ingesteld && <GeenKey melding={ai.ontbrekendeKeyMelding} />}

      {kandidaten.length === 0 ? (
        <EmptyState icon={<FileText />} title="Nog geen hooks" actions={<Button onClick={onVorige}>Naar stap 3</Button>}>
          Schrijf eerst hooks bij een angle in stap 3.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="card p-3">
            <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">1. Angle</h3>
            <ul className="space-y-1">
              {kandidaten.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => {
                      setAngleId(a.id)
                      setHookId(null)
                    }}
                    className={`w-full rounded-md px-2.5 py-2 text-left text-sm ${a.id === angleId ? 'bg-accent-50 font-medium text-accent-700 dark:bg-accent-600/15 dark:text-accent-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    {a.naam}
                    <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                      {a.type} · score {a.score ?? '–'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-3">
            <h3 className="mb-2 px-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">2. Hook</h3>
            <ul className="space-y-1">
              {angleHooks.map((h) => (
                <li key={h.id}>
                  <label className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 ${h.id === hookId ? 'bg-accent-50 dark:bg-accent-600/15' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                    <input type="radio" name="hook" className="mt-1 accent-accent-600" checked={h.id === hookId} onChange={() => setHookId(h.id)} />
                    <span className="flex-1 text-sm">
                      <span className="font-medium">{h.gesproken || '(leeg)'}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                        {h.ster && <Star className="size-3 fill-amber-500 text-amber-500" />}
                        {h.type && <Pill>{h.type}</Pill>}
                        {h.overlay && <span>overlay: {h.overlay}</span>}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Button
                icon={<FilePlus className="size-4" />}
                loading={pending}
                disabled={!gekozenHook}
                onClick={() =>
                  startTransition(async () => {
                    const id = await maakLegeBrief(projectId, angleId, hookId)
                    router.push(`/briefs/${id}`)
                  })
                }
              >
                Lege brief
              </Button>
              <Button variant="primary" icon={<Sparkles className="size-4" />} loading={staat.bezig} disabled={!ai.ingesteld || !gekozenHook} title={!gekozenHook ? 'Kies eerst een hook' : undefined} onClick={genereer}>
                Genereer brief
              </Button>
            </div>
          </div>
        </div>
      )}
      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />

      {briefs.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Briefs van dit project</h3>
          <BriefLijst briefs={briefs} />
        </section>
      )}
    </div>
  )
}

export function BriefLijst({ briefs, projectNamen }: { briefs: BriefData[]; projectNamen?: Record<string, string> }) {
  return (
    <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
      {briefs.map((b) => (
        <Link key={b.id} href={`/briefs/${b.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
          <FileText className="size-4 shrink-0 text-zinc-400" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{b.titel}</span>
          {projectNamen && <span className="text-xs text-zinc-500">{projectNamen[b.project_id]}</span>}
          <StatusPill status={b.status} />
          <span className="text-xs text-zinc-500">{b.bijgewerkt_op.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
        </Link>
      ))}
    </div>
  )
}
