'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, ScanSearch, Sparkles, Trash2, Zap, FlaskConical, Check, Copy, FileText } from 'lucide-react'
import { updateCroAnalyse, updateCroCheck, verwijderCroCheck } from '@/lib/cro-actions'
import { CRO_CATEGORIEEN, croPrioriteit, NIVEAUS, type CroAnalyse, type CroPunt, type Niveau } from '@/lib/builder-types'
import type { CroDetail } from '@/lib/data-cro'
import { useServerState, useUitgesteld } from '@/lib/use-server-state'
import { AutoTextarea } from '../AutoTextarea'
import { Button, EmptyState, Pill, type PillColor } from '../ui'
import { useConfirm } from '../ConfirmDialog'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { Versies } from '../ai/Versies'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { GeenKey } from '../builder/StapOnderzoek'
import { VerwijderKnop } from '../builder/onderdelen'
import { CroScreenshots, type ScreenshotWeergave } from './CroScreenshots'
import { Eye } from 'lucide-react'

const IMPACT_KLEUR: Record<Niveau, PillColor> = { hoog: 'green', midden: 'blue', laag: 'gray' }
const MOEITE_KLEUR: Record<Niveau, PillColor> = { laag: 'green', midden: 'amber', hoog: 'red' }

export function CroView({ detail, ai, projecten, blob }: { detail: CroDetail; ai: AiInfo; projecten: { id: string; naam: string }[]; blob: boolean }) {
  const { check } = detail
  const router = useRouter()
  const confirm = useConfirm()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()
  const versie = check.bijgewerkt_op.toISOString()
  const [analyse, setAnalyse] = useServerState<CroAnalyse | null>(check.analyse, versie)
  const [paginaTekst, setPaginaTekst] = useServerState(check.pagina_tekst, versie)
  const [filter, setFilter] = useState<string>('alle')
  const [verbergGedaan, setVerbergGedaan] = useState(false)
  const opslaanAnalyse = useUitgesteld((a: CroAnalyse) => updateCroAnalyse(check.id, a))
  const opslaanTekst = useUitgesteld((t: string) => updateCroCheck(check.id, { pagina_tekst: t }))

  const zetAnalyse = (fn: (a: CroAnalyse) => CroAnalyse) => {
    if (!analyse) return
    const nieuw = fn(analyse)
    setAnalyse(nieuw)
    opslaanAnalyse('analyse', nieuw)
  }
  const wijzigPunt = (id: string, patch: Partial<CroPunt>) => zetAnalyse((a) => ({ ...a, punten: a.punten.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))

  const analyseer = async () => {
    if (analyse && !(await confirm({ title: 'Opnieuw beoordelen?', message: 'Het huidige advies (inclusief afgevinkte punten) wordt vervangen. Via “Versies” kun je terug naar een eerdere AI-versie.', confirmLabel: 'Opnieuw beoordelen' })))
      return
    start({ actie: 'cro', croId: check.id })
  }

  const verwijder = async () => {
    if (!(await confirm({ title: 'CRO-check verwijderen?', message: 'Het advies en de opgehaalde tekst worden verwijderd.', confirmLabel: 'Verwijderen', danger: true }))) return
    startTransition(async () => {
      await verwijderCroCheck(check.id)
      router.push('/cro')
    })
  }

  const punten = (analyse?.punten ?? [])
    .filter((p) => filter === 'alle' || p.categorie === filter)
    .filter((p) => !verbergGedaan || !p.gedaan)
    .sort((a, b) => Number(a.gedaan) - Number(b.gedaan) || croPrioriteit(b) - croPrioriteit(a))
  const aantalGedaan = analyse?.punten.filter((p) => p.gedaan).length ?? 0
  const categorieen = CRO_CATEGORIEEN.filter((c) => analyse?.punten.some((p) => p.categorie === c))

  return (
    <div className="pb-16">
      <Link href="/cro" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> CRO-check
      </Link>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{check.titel}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {check.url && (
              <a href={check.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-600 hover:underline">
                {check.url.replace(/^https?:\/\//, '').slice(0, 60)} <ExternalLink className="size-3" />
              </a>
            )}
            <Pill>{check.bron === 'geplakt' ? 'geplakte tekst' : 'opgehaald'}</Pill>
            <select
              aria-label="Project"
              className="input h-7 w-auto py-0.5 text-xs"
              defaultValue={check.project?.id ?? ''}
              onChange={(e) =>
                startTransition(async () => {
                  await updateCroCheck(check.id, { projectId: e.target.value || null })
                  router.refresh()
                })
              }
            >
              <option value="">Geen project</option>
              {projecten.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.naam}
                </option>
              ))}
            </select>
            {check.project && !check.project.onderzoek && (
              <Link href={`/briefs/project/${check.project.id}?stap=1`} className="text-xs text-amber-600 hover:underline">
                Dit project heeft nog geen klantonderzoek →
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-nowrap">
          <Versies versies={detail.versies} uitleg="Het huidige advies (inclusief afgevinkte punten en bewerkingen) wordt vervangen door deze versie." />
          <Button variant="danger" size="md" icon={<Trash2 className="size-4" />} loading={pending} onClick={verwijder}>
            <span className="hidden sm:inline">Verwijderen</span>
          </Button>
          <Button variant={analyse ? 'secondary' : 'primary'} icon={<Sparkles className="size-4" />} loading={staat.bezig} disabled={!ai.ingesteld} title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : undefined} onClick={analyseer}>
            {analyse ? 'Opnieuw beoordelen' : 'Beoordeel pagina'}
          </Button>
        </div>
      </div>

      {!ai.ingesteld && (
        <div className="mb-4">
          <GeenKey melding={ai.ontbrekendeKeyMelding} />
        </div>
      )}

      <CroScreenshots croId={check.id} screenshots={check.screenshots} blob={blob} />

      <details className="card mb-5 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Wat de AI leest <span className="font-normal text-zinc-500">({paginaTekst.length.toLocaleString('nl-NL')} tekens, aan te passen)</span>
        </summary>
        <p className="mt-2 text-xs text-zinc-500">Klopt er iets niet of mist er tekst (bijv. reviews die pas later laden)? Pas het hier aan en beoordeel opnieuw.</p>
        <textarea
          className="input mt-2 min-h-64 font-mono text-xs leading-relaxed"
          value={paginaTekst}
          onChange={(e) => {
            setPaginaTekst(e.target.value)
            opslaanTekst('tekst', e.target.value)
          }}
        />
      </details>

      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />

      {!analyse && !staat.bezig && (
        <EmptyState icon={<ScanSearch />} title="Nog niet beoordeeld">
          Klik op “Beoordeel pagina”. Je krijgt een score, quick wins, verbeterpunten met voorbeeldteksten en A/B-testideeën.
          {check.project ? ' Het klantonderzoek van het project wordt meegenomen.' : ''}
        </EmptyState>
      )}

      {analyse && (
        <div className="mt-2 space-y-6">
          <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-baseline gap-1">
              <span className={`text-4xl font-semibold tabular-nums ${analyse.score >= 7 ? 'text-emerald-600' : analyse.score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>{analyse.score}</span>
              <span className="text-zinc-400">/10</span>
            </div>
            <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{analyse.samenvatting}</p>
          </section>

          {analyse.screenshots_mislukt && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              {analyse.visueel?.length ? 'Niet alle screenshots' : 'De screenshots'} konden niet door de AI worden bekeken; dat deel van het advies is op basis van de tekst. Probeer het later opnieuw, of kies een ander beeldmodel (GROQ_VISIE_MODEL).
            </p>
          )}

          {analyse.quick_wins.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Zap className="size-4 text-amber-500" /> Quick wins
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                {analyse.quick_wins.map((q, i) => (
                  <div key={i} className="card p-4">
                    <p className="text-sm font-medium">{q.titel}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{q.actie}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">
                Verbeterpunten <span className="font-normal text-zinc-400">({aantalGedaan} van {analyse.punten.length} gedaan)</span>
              </h2>
              <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
                <input type="checkbox" checked={verbergGedaan} onChange={(e) => setVerbergGedaan(e.target.checked)} className="accent-accent-600" />
                Verberg gedaan
              </label>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {['alle', ...categorieen].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${filter === c ? 'border-accent-600 bg-accent-600 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'}`}
                >
                  {c === 'alle' ? `Alle (${analyse.punten.length})` : `${c} (${analyse.punten.filter((p) => p.categorie === c).length})`}
                </button>
              ))}
            </div>
            <ul className="space-y-3">
              {punten.map((p) => (
                <PuntKaart key={p.id} punt={p} screenshots={check.screenshots} onWijzig={(patch) => wijzigPunt(p.id, patch)} onVerwijder={() => zetAnalyse((a) => ({ ...a, punten: a.punten.filter((x) => x.id !== p.id) }))} />
              ))}
            </ul>
          </section>

          {analyse.visueel && analyse.visueel.length > 0 && (
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-medium">
                <Eye className="mr-1 inline size-4 text-zinc-400" /> Wat de AI op de screenshots zag
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {analyse.visueel.map((v, i) => (
                  <div key={i} className="space-y-1.5 text-sm">
                    <p className="font-medium">Screenshot {v.label}</p>
                    {(
                      [
                        ['Boven de vouw', v.boven_de_vouw],
                        ['Knop (CTA)', v.cta],
                        ['Hiërarchie', v.hierarchie],
                        ['Vertrouwen', v.vertrouwen],
                        ['Leesbaarheid', v.leesbaarheid],
                      ] as const
                    ).map(([k, t]) => t && (
                      <p key={k}>
                        <span className="text-zinc-400">{k}:</span> {t}
                      </p>
                    ))}
                    {v.problemen.length > 0 && (
                      <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-400">
                        {v.problemen.map((p, j) => (
                          <li key={j}>
                            {p.probleem} {p.waar && <span className="text-zinc-400">({p.waar})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {analyse.testideeen.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="size-4 text-zinc-400" /> A/B-testideeën
              </h2>
              <ul className="card divide-y divide-zinc-100 dark:divide-zinc-800">
                {analyse.testideeen.map((t, i) => (
                  <li key={i} className="px-4 py-3 text-sm">
                    <p className="font-medium">{t.hypothese}</p>
                    <p className="mt-0.5 text-zinc-500">
                      Variant: {t.variant} {t.metric && <>· meten: {t.metric}</>}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-zinc-400">Omzetten naar de Testlog komt in fase 4.</p>
            </section>
          )}

          <Review projectId={check.project?.id} stap="cro" croId={check.id} laatste={detail.review} ai={ai} />
        </div>
      )}

      <p className="mt-8 text-xs text-zinc-400">
        Model: {ai.model} · vandaag {detail.tokensVandaag.toLocaleString('nl-NL')} van ~{ai.dagLimiet.toLocaleString('nl-NL')} tokens gebruikt
      </p>
    </div>
  )
}

function PuntKaart({ punt: p, screenshots, onWijzig, onVerwijder }: { punt: CroPunt; screenshots: ScreenshotWeergave[]; onWijzig: (patch: Partial<CroPunt>) => void; onVerwijder: () => void }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  const [toonScreenshot, setToonScreenshot] = useState(false)
  // Bron "screenshot mobiel" → het screenshot met label "mobiel".
  const bronScreenshot = p.bron && p.bron !== 'tekst' ? screenshots.find((s) => p.bron!.toLowerCase().includes(s.label)) : undefined
  return (
    <li className={`card p-4 transition-opacity ${p.gedaan ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={p.gedaan} onChange={(e) => onWijzig({ gedaan: e.target.checked })} className="mt-1 size-4 accent-emerald-600" aria-label="Gedaan" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill color="violet">{p.categorie}</Pill>
            <NiveauKeuze label="impact" waarde={p.impact} kleur={IMPACT_KLEUR[p.impact]} onChange={(impact) => onWijzig({ impact })} />
            <NiveauKeuze label="moeite" waarde={p.moeite} kleur={MOEITE_KLEUR[p.moeite]} onChange={(moeite) => onWijzig({ moeite })} />
            {p.bron && p.bron !== 'tekst' && (
              <button
                type="button"
                onClick={() => setToonScreenshot((t) => !t)}
                disabled={!bronScreenshot?.link}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200 ring-inset hover:bg-sky-100 disabled:cursor-default dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900"
              >
                <Eye className="size-3" /> {p.bron}
              </button>
            )}
          </div>
          {toonScreenshot && bronScreenshot?.link && (
            // eslint-disable-next-line @next/next/no-img-element -- privé-media via ondertekende links
            <img src={bronScreenshot.link} alt={`Screenshot ${bronScreenshot.label}`} className="max-h-96 rounded-md border border-zinc-200 object-contain object-top dark:border-zinc-800" />
          )}
          <AutoTextarea className={`w-full border-0 bg-transparent p-0 font-medium focus:ring-0 focus:outline-none ${p.gedaan ? 'line-through' : ''}`} value={p.probleem} onChange={(e) => onWijzig({ probleem: e.target.value })} aria-label="Probleem" />
          {p.bewijs && <p className="border-l-2 border-zinc-200 pl-2.5 text-sm text-zinc-500 italic dark:border-zinc-700">{p.bewijs}</p>}
          <div>
            <span className="text-xs font-medium text-zinc-400">Wat te doen</span>
            <AutoTextarea className="w-full rounded border-0 bg-transparent p-0 text-sm leading-relaxed focus:ring-0 focus:outline-none" value={p.aanbeveling} onChange={(e) => onWijzig({ aanbeveling: e.target.value })} aria-label="Aanbeveling" />
          </div>
          {(p.voorbeeldtekst || !p.gedaan) && (
            <div className="rounded-md bg-emerald-50/60 p-2.5 dark:bg-emerald-950/20">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <FileText className="size-3" /> Voorbeeldtekst
                </span>
                <button
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(p.voorbeeldtekst)
                      setGekopieerd(true)
                      setTimeout(() => setGekopieerd(false), 1200)
                    } catch {
                      // klembord niet beschikbaar
                    }
                  }}
                >
                  {gekopieerd ? <Check className="size-3" /> : <Copy className="size-3" />} {gekopieerd ? 'Gekopieerd' : 'Kopiëren'}
                </button>
              </div>
              <AutoTextarea className="w-full border-0 bg-transparent p-0 text-sm leading-relaxed focus:ring-0 focus:outline-none" value={p.voorbeeldtekst} onChange={(e) => onWijzig({ voorbeeldtekst: e.target.value })} aria-label="Voorbeeldtekst" />
            </div>
          )}
        </div>
        <VerwijderKnop onClick={onVerwijder} />
      </div>
    </li>
  )
}

function NiveauKeuze({ label, waarde, kleur, onChange }: { label: string; waarde: Niveau; kleur: PillColor; onChange: (n: Niveau) => void }) {
  const klassen: Record<PillColor, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
    red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900',
    gray: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
    violet: '',
    accent: '',
  }
  return (
    <select aria-label={label} value={waarde} onChange={(e) => onChange(e.target.value as Niveau)} className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${klassen[kleur]}`}>
      {NIVEAUS.map((n) => (
        <option key={n} value={n}>
          {label}: {n}
        </option>
      ))}
    </select>
  )
}
