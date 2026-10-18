'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Sparkles, Trash2, Check, Link2, X, Tags } from 'lucide-react'
import { koppelBrief, ontkoppelBrief, updateSwipe, verwijderMediaVan, verwijderSwipe, zetMedia } from '@/lib/swipe-actions'
import { TAG_VELDEN, type SwipeTags } from '@/lib/builder-types'
import type { SwipeDetail } from '@/lib/data-swipe'
import { useServerState, useUitgesteld } from '@/lib/use-server-state'
import { Button, Pill, StatusPill } from '../ui'
import { useConfirm } from '../ConfirmDialog'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { Versies } from '../ai/Versies'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { GeenKey } from '../builder/StapOnderzoek'
import { KopieerChip } from '../builder/onderdelen'
import { MediaUpload } from './MediaUpload'
import { Sterren } from './Sterren'
import { SwipeVelden, type SwipeWaarden } from './Velden'

export function SwipeDetailView({ detail, ai, blob }: { detail: SwipeDetail; ai: AiInfo; blob: boolean }) {
  const { item } = detail
  const router = useRouter()
  const confirm = useConfirm()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()
  const [v, setV] = useServerState<SwipeWaarden>(
    { titel: item.titel, merk: item.merk ?? '', platform: item.platform ?? '', url: item.url ?? '', transcript: item.transcript ?? '', notities: item.notities ?? '', tags: item.tags },
    `${item.id}:${JSON.stringify(item.tags)}`,
  )
  const [beoordeling, setBeoordeling] = useServerState(item.beoordeling)
  const [projectId, setProjectId] = useState(item.analyse?.project?.id ?? '')
  const [screenshot, setScreenshot] = useState(true)
  const [briefKeuze, setBriefKeuze] = useState('')
  const opslaan = useUitgesteld((patch: Partial<SwipeWaarden>) => updateSwipe(item.id, patch))
  const a = item.analyse
  const isAfbeelding = item.media_type?.startsWith('image/')

  const wijzig = (patch: Partial<SwipeWaarden>) => {
    setV((s) => ({ ...s, ...patch }))
    for (const k of Object.keys(patch) as (keyof SwipeWaarden)[]) opslaan(k, { [k]: (patch as Record<string, unknown>)[k] } as Partial<SwipeWaarden>)
  }

  const actie = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn()
      router.refresh()
    })

  const nieuweTags = a ? (TAG_VELDEN.filter(({ key }) => a.tags[key] && a.tags[key] !== v.tags[key]).map(({ key }) => key) as (keyof SwipeTags)[]) : []

  return (
    <div className="pb-16">
      <Link href="/swipe" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> Swipe File
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="space-y-4">
          <MediaUpload
            link={item.media_link}
            type={item.media_type}
            blob={blob}
            onGeupload={async (ref, type) => {
              await zetMedia(item.id, ref, type)
              router.refresh()
            }}
            onVerwijder={async () => {
              if (!(await confirm({ title: 'Media verwijderen?', message: 'Het bestand wordt definitief verwijderd.', confirmLabel: 'Verwijderen', danger: true }))) return
              await verwijderMediaVan(item.id)
              router.refresh()
            }}
          />
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              Beoordeling
              <Sterren
                waarde={beoordeling}
                onChange={(n) => {
                  setBeoordeling(n)
                  void updateSwipe(item.id, { beoordeling: n })
                }}
              />
            </span>
            {v.url && (
              <a href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-600 hover:underline">
                Bekijk ad <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          <section className="card space-y-2 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Link2 className="size-4 text-zinc-400" /> Referentie voor briefs
            </h3>
            {detail.gekoppeld.length === 0 && <p className="text-xs text-zinc-500">Nog niet gekoppeld aan een brief.</p>}
            <ul className="space-y-1">
              {detail.gekoppeld.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-sm">
                  <Link href={`/briefs/${b.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {b.titel} <span className="text-xs text-zinc-400">· {b.projectNaam}</span>
                  </Link>
                  <StatusPill status={b.status} />
                  <button aria-label="Ontkoppelen" className="text-zinc-400 hover:text-red-500" onClick={() => actie(() => ontkoppelBrief(item.id, b.id))}>
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {detail.briefs.length > 0 ? (
              <div className="flex gap-2">
                <select aria-label="Brief kiezen" className="input h-8 py-1 text-xs" value={briefKeuze} onChange={(e) => setBriefKeuze(e.target.value)}>
                  <option value="">Kies een brief…</option>
                  {detail.briefs
                    .filter((b) => !detail.gekoppeld.some((g) => g.id === b.id))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.titel} ({b.projectNaam})
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  disabled={!briefKeuze}
                  loading={pending}
                  onClick={() =>
                    actie(async () => {
                      await koppelBrief(item.id, briefKeuze)
                      setBriefKeuze('')
                    })
                  }
                >
                  Koppelen
                </Button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">Er zijn nog geen briefs.</p>
            )}
          </section>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-3.5" />}
            onClick={async () => {
              if (!(await confirm({ title: `“${v.titel}” verwijderen?`, message: 'De ad, het bestand en de analyse worden verwijderd.', confirmLabel: 'Verwijderen', danger: true }))) return
              startTransition(async () => {
                await verwijderSwipe(item.id)
                router.push('/swipe')
              })
            }}
          >
            Ad verwijderen
          </Button>
        </div>

        <div className="min-w-0 space-y-6">
          <SwipeVelden v={v} onChange={wijzig} />

          <section className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">Analyseer deze ad</h2>
                <p className="mt-0.5 text-sm text-zinc-500">Hook, angle, structuur, emotie, waarom het werkt en ideeën voor je eigen project.</p>
              </div>
              <Versies versies={detail.versies} uitleg="De huidige analyse wordt vervangen door deze versie." />
            </div>
            {!ai.ingesteld && <GeenKey melding={ai.ontbrekendeKeyMelding} />}
            <div className="flex flex-wrap items-center gap-3">
              <select aria-label="Toepassen op project" className="input h-9 w-auto text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Geen project (alleen analyse)</option>
                {detail.projecten.map((p) => (
                  <option key={p.id} value={p.id}>
                    Toepassen op: {p.naam}
                  </option>
                ))}
              </select>
              {isAfbeelding && (
                <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <input type="checkbox" checked={screenshot} onChange={(e) => setScreenshot(e.target.checked)} className="accent-accent-600" />
                  Screenshot meesturen
                </label>
              )}
              <Button
                variant={a ? 'secondary' : 'primary'}
                icon={<Sparkles className="size-4" />}
                loading={staat.bezig}
                disabled={!ai.ingesteld}
                onClick={() => start({ actie: 'swipe', swipeId: item.id, projectId: projectId || undefined, screenshot: isAfbeelding && screenshot })}
              >
                {a ? 'Opnieuw analyseren' : 'Analyseer deze ad'}
              </Button>
            </div>
            <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />

            {a && !staat.bezig && (
              <div className="space-y-4">
                {nieuweTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent-100 bg-accent-50 px-3 py-2 text-sm dark:border-accent-600/30 dark:bg-accent-600/10">
                    <Tags className="size-4 text-accent-600" />
                    <span className="text-zinc-700 dark:text-zinc-300">Tag-suggesties:</span>
                    {nieuweTags.map((k) => (
                      <Pill key={k} color="accent">
                        {a.tags[k]}
                      </Pill>
                    ))}
                    <Button size="sm" variant="primary" className="ml-auto" icon={<Check className="size-3.5" />} onClick={() => wijzig({ tags: { ...v.tags, ...Object.fromEntries(nieuweTags.map((k) => [k, a.tags[k]])) } })}>
                      Overnemen
                    </Button>
                  </div>
                )}
                {a.met_screenshot === false && isAfbeelding && screenshot && <p className="text-xs text-zinc-400">Deze analyse is gemaakt zonder screenshot.</p>}

                <div className="grid gap-3 md:grid-cols-2">
                  <Blok titel="Hook">
                    <KopieerChip tekst={a.hook.gesproken} className="font-medium">
                      “{a.hook.gesproken}”
                    </KopieerChip>
                    <p className="mt-1 text-zinc-500">Beeld: {a.hook.visueel}</p>
                    <div className="mt-1.5">
                      <Pill>{a.hook.type}</Pill>
                    </div>
                  </Blok>
                  <Blok titel="Angle">
                    <p className="font-medium">{a.angle.naam}</p>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{a.angle.kernboodschap}</p>
                    <div className="mt-1.5">
                      <Pill color="violet">{a.angle.type}</Pill>
                    </div>
                  </Blok>
                  <Blok titel="Emotie en pijnpunt">
                    <p>
                      <span className="text-zinc-400">Emotie:</span> {a.emotie}
                    </p>
                    <p className="mt-1">
                      <span className="text-zinc-400">Pijnpunt/verlangen:</span> {a.pijnpunt}
                    </p>
                    <div className="mt-1.5">
                      <Pill color="accent">{a.bewustzijnsniveau}</Pill>
                    </div>
                  </Blok>
                  <Blok titel="Waarom het werkt">
                    <ol className="list-decimal space-y-1 pl-4">
                      {a.redenen.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ol>
                  </Blok>
                </div>

                {a.structuur.length > 0 && (
                  <Blok titel="Structuur">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {a.structuur.map((s, i) => (
                            <tr key={i} className="align-top">
                              <td className="w-20 py-1.5 pr-3 whitespace-nowrap text-zinc-400 tabular-nums">{s.tijd}</td>
                              <td className="w-24 py-1.5 pr-3 font-medium text-accent-700 dark:text-accent-100">{s.fase}</td>
                              <td className="py-1.5">{s.wat}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Blok>
                )}

                {a.toepassingen.length > 0 && (
                  <Blok titel={`Toepassen op ${a.project?.naam ?? 'je project'}`}>
                    <ul className="space-y-2">
                      {a.toepassingen.map((t, i) => (
                        <li key={i}>
                          <p className="font-medium">{t.idee}</p>
                          <p className="text-zinc-600 dark:text-zinc-400">{t.hoe}</p>
                        </li>
                      ))}
                    </ul>
                  </Blok>
                )}

                <Review projectId={a.project?.id} stap="swipe" swipeId={item.id} laatste={detail.review} ai={ai} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Blok({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 text-sm leading-relaxed">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">{titel}</h3>
      {children}
    </section>
  )
}
