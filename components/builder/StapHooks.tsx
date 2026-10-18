'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Anchor, Sparkles, ArrowRight, Plus, Star } from 'lucide-react'
import { sterHook, updateHook, verwijderHook, voegHookToe } from '@/lib/builder-actions'
import { HOOK_TYPES, type AngleData, type HookData, type ReviewResultaat } from '@/lib/builder-types'
import { slaDirectOp, useServerState, useUitgesteld } from '@/lib/use-server-state'
import { AutoTextarea } from '../AutoTextarea'
import { Button, EmptyState, Pill } from '../ui'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { GeenKey } from './StapOnderzoek'
import { SterKnop, VerwijderKnop } from './onderdelen'

export const woorden = (s: string | null) => (s ?? '').trim().split(/\s+/).filter(Boolean).length

export function StapHooks({
  projectId,
  angles,
  hooks: serverHooks,
  review,
  ai,
  onVorige,
  onVolgende,
}: {
  projectId: string
  angles: AngleData[]
  hooks: HookData[]
  review: { review: ReviewResultaat; aangemaakt_op: Date } | null
  ai: AiInfo
  onVorige: () => void
  onVolgende: () => void
}) {
  const geselecteerd = angles.filter((a) => a.geselecteerd)
  const [hooks, setHooks] = useServerState(serverHooks)
  const alle = useAiActie()
  const [bezigMet, setBezigMet] = useState<string | null>(null)
  const inBibliotheek = hooks.filter((h) => h.ster).length
  const zonderHooks = geselecteerd.filter((a) => !hooks.some((h) => h.angle_id === a.id))

  const genereerAlle = async () => {
    for (const a of zonderHooks) {
      setBezigMet(a.naam)
      const ok = await alle.start({ actie: 'hooks', projectId, angleId: a.id })
      if (!ok) break
    }
    setBezigMet(null)
  }

  if (!geselecteerd.length)
    return (
      <EmptyState icon={<Anchor />} title="Nog geen angles geselecteerd" actions={<Button onClick={onVorige}>Naar stap 2</Button>}>
        Selecteer in stap 2 één tot vijf angles; daarvoor schrijft de AI hier hooks.
      </EmptyState>
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Stap 3 · Hooks</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            5 hooks per angle. Geef goede hooks een ster: die komen in je hook-bibliotheek
            {inBibliotheek > 0 && (
              <>
                {' '}
                (<Star className="inline size-3 fill-amber-500 text-amber-500" /> {inBibliotheek})
              </>
            )}
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {zonderHooks.length > 0 && (
            <Button variant="primary" icon={<Sparkles className="size-4" />} loading={alle.staat.bezig} disabled={!ai.ingesteld} title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : undefined} onClick={genereerAlle}>
              Hooks voor {zonderHooks.length === geselecteerd.length ? 'alle' : `${zonderHooks.length}`} angles
            </Button>
          )}
          <Button icon={<ArrowRight className="size-4" />} disabled={!hooks.some((h) => geselecteerd.some((a) => a.id === h.angle_id))} onClick={onVolgende}>
            Door naar brief
          </Button>
        </div>
      </div>
      {!ai.ingesteld && <GeenKey melding={ai.ontbrekendeKeyMelding} />}
      {bezigMet && alle.staat.bezig && <p className="text-xs text-zinc-500">Bezig met “{bezigMet}”…</p>}
      <AiStatus staat={alle.staat} onOpnieuw={alle.opnieuw} onStop={alle.stop} onSluit={alle.sluit} dagLimiet={ai.dagLimiet} />

      {geselecteerd.map((a) => (
        <AngleHooks key={a.id} projectId={projectId} angle={a} hooks={hooks.filter((h) => h.angle_id === a.id)} setHooks={setHooks} ai={ai} />
      ))}

      <Review projectId={projectId} stap="hooks" laatste={review} ai={ai} uitgeschakeld={hooks.length ? undefined : 'Nog geen hooks'} />
    </div>
  )
}

function AngleHooks({
  projectId,
  angle,
  hooks,
  setHooks,
  ai,
}: {
  projectId: string
  angle: AngleData
  hooks: HookData[]
  setHooks: (fn: (h: HookData[]) => HookData[]) => void
  ai: AiInfo
}) {
  const router = useRouter()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()
  const opslaan = useUitgesteld((id: string, patch: Partial<HookData>) => updateHook(id, patch as Parameters<typeof updateHook>[1]))

  const wijzig = (id: string, patch: Partial<HookData>) => {
    setHooks((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)))
    opslaan(`${id}:${Object.keys(patch).join(',')}`, id, patch)
  }
  const ster = (h: HookData) => {
    setHooks((hs) => hs.map((x) => (x.id === h.id ? { ...x, ster: !h.ster } : x)))
    void slaDirectOp(sterHook(h.id, !h.ster))
  }
  const verwijder = (h: HookData) => {
    setHooks((hs) => hs.filter((x) => x.id !== h.id))
    void slaDirectOp(verwijderHook(h.id))
  }

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{angle.naam}</h3>
            {angle.type && <Pill color="violet">{angle.type}</Pill>}
          </div>
          {angle.kernboodschap && <p className="mt-0.5 text-sm text-zinc-500">{angle.kernboodschap}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            icon={<Plus className="size-3.5" />}
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await voegHookToe(projectId, angle.id)
                router.refresh()
              })
            }
          >
            Zelf
          </Button>
          <Button size="sm" variant={hooks.length ? 'secondary' : 'primary'} icon={<Sparkles className="size-3.5" />} loading={staat.bezig} disabled={!ai.ingesteld} onClick={() => start({ actie: 'hooks', projectId, angleId: angle.id })}>
            {hooks.length ? 'Meer hooks' : '5 hooks'}
          </Button>
        </div>
      </div>
      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />
      {hooks.length === 0 && !staat.bezig && <p className="text-sm text-zinc-400">Nog geen hooks voor deze angle.</p>}
      <ul className="mt-2 grid gap-3 lg:grid-cols-2">
        {hooks.map((h) => (
          <HookKaart key={h.id} hook={h} onWijzig={(p) => wijzig(h.id, p)} onSter={() => ster(h)} onVerwijder={() => verwijder(h)} />
        ))}
      </ul>
    </section>
  )
}

export function HookKaart({ hook: h, onWijzig, onSter, onVerwijder }: { hook: HookData; onWijzig: (p: Partial<HookData>) => void; onSter: () => void; onVerwijder: () => void }) {
  const n = woorden(h.gesproken)
  return (
    <li className={`rounded-lg border p-3 ${h.ster ? 'border-amber-300 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
      <div className="flex items-start gap-1">
        <div className="flex-1">
          <AutoTextarea
            className="w-full border-0 bg-transparent p-0 text-[15px] leading-snug font-medium focus:ring-0 focus:outline-none"
            placeholder="Gesproken tekst (max 12 woorden)"
            value={h.gesproken ?? ''}
            onChange={(e) => onWijzig({ gesproken: e.target.value })}
            aria-label="Gesproken tekst"
          />
          <span className={`text-[11px] tabular-nums ${n > 12 ? 'font-medium text-red-600' : 'text-zinc-400'}`}>{n}/12 woorden</span>
        </div>
        <SterKnop aan={h.ster} onClick={onSter} label="In hook-bibliotheek" />
        <VerwijderKnop onClick={onVerwijder} />
      </div>
      <div className="mt-2 space-y-1.5 text-sm">
        <label className="flex items-baseline gap-2">
          <span className="w-16 shrink-0 text-xs text-zinc-400">Overlay</span>
          <input className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0.5 focus:border-zinc-300 focus:outline-none dark:focus:border-zinc-600" value={h.overlay ?? ''} onChange={(e) => onWijzig({ overlay: e.target.value })} />
        </label>
        <label className="flex items-baseline gap-2">
          <span className="w-16 shrink-0 text-xs text-zinc-400">1e shot</span>
          <AutoTextarea className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0.5 text-zinc-600 focus:border-zinc-300 focus:outline-none dark:text-zinc-400" value={h.eerste_shot ?? ''} onChange={(e) => onWijzig({ eerste_shot: e.target.value })} />
        </label>
        <label className="flex items-baseline gap-2">
          <span className="w-16 shrink-0 text-xs text-zinc-400">Type</span>
          <select className="rounded border border-zinc-200 bg-transparent px-1.5 py-0.5 text-xs dark:border-zinc-700" value={h.type ?? ''} onChange={(e) => onWijzig({ type: e.target.value })}>
            {HOOK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
    </li>
  )
}
