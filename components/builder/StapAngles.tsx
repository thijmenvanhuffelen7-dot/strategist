'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Sparkles, ArrowRight, Plus, Pencil, Check } from 'lucide-react'
import { selecteerAngle, updateAngle, verwijderAngle, voegAngleToe } from '@/lib/builder-actions'
import { ANGLE_TYPES, type AiVersie, type AngleData, type ReviewResultaat } from '@/lib/builder-types'
import { slaDirectOp, useServerState, useUitgesteld } from '@/lib/use-server-state'
import { AutoTextarea } from '../AutoTextarea'
import { Button, EmptyState, ErrorBox, Pill } from '../ui'
import { useConfirm } from '../ConfirmDialog'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { Versies } from '../ai/Versies'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { GeenKey } from './StapOnderzoek'
import { VerwijderKnop } from './onderdelen'

const MAX = 5

export function scoreKleur(s: number | null) {
  if (s == null) return 'gray' as const
  return s >= 8 ? ('green' as const) : s >= 6 ? ('blue' as const) : s >= 4 ? ('amber' as const) : ('red' as const)
}

export function StapAngles({
  projectId,
  onderzoekGoedgekeurd,
  angles: serverAngles,
  versies,
  review,
  ai,
  onVorige,
  onVolgende,
}: {
  projectId: string
  onderzoekGoedgekeurd: boolean
  angles: AngleData[]
  versies: AiVersie[]
  review: { review: ReviewResultaat; aangemaakt_op: Date } | null
  ai: AiInfo
  onVorige: () => void
  onVolgende: () => void
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [angles, setAngles] = useServerState(serverAngles)
  const [fout, setFout] = useState<unknown>(null)
  const [nieuwOpen, setNieuwOpen] = useState(false)
  const opslaan = useUitgesteld((id: string, patch: Partial<AngleData>) => updateAngle(id, patch as Parameters<typeof updateAngle>[1]))
  const geselecteerd = angles.filter((a) => a.geselecteerd).length
  const gesorteerd = [...angles].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const wijzig = (id: string, patch: Partial<AngleData>) => {
    setAngles((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    // Per veld een eigen timer, zodat snelle wijzigingen in verschillende velden niet verloren gaan.
    opslaan(`${id}:${Object.keys(patch).join(',')}`, id, patch)
  }

  const kies = async (a: AngleData) => {
    setFout(null)
    if (!a.geselecteerd && geselecteerd >= MAX) {
      setFout(new Error(`Je kunt maximaal ${MAX} angles selecteren. Haal eerst een vinkje weg.`))
      return
    }
    setAngles((as) => as.map((x) => (x.id === a.id ? { ...x, geselecteerd: !a.geselecteerd } : x)))
    try {
      await slaDirectOp(selecteerAngle(a.id, !a.geselecteerd))
      router.refresh()
    } catch (e) {
      setFout(e)
      router.refresh()
    }
  }

  const verwijder = async (a: AngleData) => {
    if (!(await confirm({ title: `Angle “${a.naam}” verwijderen?`, message: 'Hooks bij deze angle blijven bewaard, maar zonder angle.', confirmLabel: 'Verwijderen', danger: true }))) return
    setAngles((as) => as.filter((x) => x.id !== a.id))
    await slaDirectOp(verwijderAngle(a.id))
  }

  const genereer = async () => {
    const aiAngles = angles.filter((a) => !a.eigen && !a.geselecteerd).length
    if (aiAngles && !(await confirm({ title: 'Nieuwe angles genereren?', message: `${aiAngles} niet-geselecteerde AI-angles worden vervangen. Geselecteerde en eigen angles blijven staan.`, confirmLabel: 'Genereren' })))
      return
    start({ actie: 'angles', projectId })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Stap 2 · Angles</h2>
          <p className="mt-0.5 text-sm text-zinc-500">Kies maximaal {MAX} angles om hooks voor te schrijven. Gesorteerd op score.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Versies versies={versies} uitleg="Niet-geselecteerde AI-angles worden vervangen door de angles uit deze versie. Geselecteerde en eigen angles blijven staan." />
          <Button size="md" icon={<Plus className="size-4" />} onClick={() => setNieuwOpen(true)}>
            Eigen angle
          </Button>
          <Button
            variant={angles.length ? 'secondary' : 'primary'}
            icon={<Sparkles className="size-4" />}
            loading={staat.bezig}
            disabled={!ai.ingesteld || !onderzoekGoedgekeurd}
            title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : !onderzoekGoedgekeurd ? 'Keur eerst het onderzoek goed (stap 1)' : undefined}
            onClick={genereer}
          >
            {angles.length ? 'Nieuwe angles' : 'Genereer angles'}
          </Button>
        </div>
      </div>

      {!onderzoekGoedgekeurd && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          Keur eerst het klantonderzoek goed; dat is de basis voor de angles.
          <Button size="sm" className="ml-auto" onClick={onVorige}>
            Naar stap 1
          </Button>
        </div>
      )}
      {!ai.ingesteld && <GeenKey melding={ai.ontbrekendeKeyMelding} />}
      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />
      {fout != null && <ErrorBox error={fout} />}
      {nieuwOpen && <NieuweAngle projectId={projectId} onKlaar={() => setNieuwOpen(false)} />}

      {angles.length === 0 && !staat.bezig && !nieuwOpen && (
        <EmptyState icon={<Lightbulb />} title="Nog geen angles">
          Genereer 8–10 angles op basis van het onderzoek, of voeg zelf een angle toe.
        </EmptyState>
      )}

      {angles.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              <strong className="font-medium text-zinc-800 dark:text-zinc-200">{geselecteerd}</strong> van {MAX} geselecteerd
            </span>
            <Button variant="primary" size="sm" icon={<ArrowRight className="size-3.5" />} disabled={!geselecteerd} onClick={onVolgende}>
              Door naar hooks
            </Button>
          </div>
          <ul className="space-y-2">
            {gesorteerd.map((a) => (
              <AngleKaart key={a.id} angle={a} onKies={() => kies(a)} onWijzig={(p) => wijzig(a.id, p)} onVerwijder={() => verwijder(a)} />
            ))}
          </ul>
        </>
      )}

      {angles.length > 0 && <Review projectId={projectId} stap="angles" laatste={review} ai={ai} />}
    </div>
  )
}

function AngleKaart({ angle: a, onKies, onWijzig, onVerwijder }: { angle: AngleData; onKies: () => void; onWijzig: (p: Partial<AngleData>) => void; onVerwijder: () => void }) {
  const [bewerken, setBewerken] = useState(false)
  return (
    <li className={`card p-4 transition-colors ${a.geselecteerd ? 'border-accent-500 ring-1 ring-accent-500/30 dark:border-accent-500' : ''}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={a.geselecteerd} onChange={onKies} className="mt-1 size-4 accent-accent-600" aria-label={`Selecteer ${a.naam}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {bewerken ? (
              <input className="input h-8 max-w-sm py-1 font-medium" value={a.naam} onChange={(e) => onWijzig({ naam: e.target.value })} aria-label="Naam" />
            ) : (
              <h3 className="font-medium">{a.naam}</h3>
            )}
            {bewerken ? (
              <select className="input h-8 w-auto py-1 text-xs" value={a.type ?? ''} onChange={(e) => onWijzig({ type: e.target.value })} aria-label="Type">
                {ANGLE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            ) : (
              a.type && <Pill color="violet">{a.type}</Pill>
            )}
            {a.eigen && <Pill>eigen</Pill>}
          </div>
          {bewerken ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Veld label="Kernboodschap" waarde={a.kernboodschap} onChange={(v) => onWijzig({ kernboodschap: v })} />
              <Veld label="Voor wie" waarde={a.doelgroep} onChange={(v) => onWijzig({ doelgroep: v })} />
              <Veld label="Waarom het werkt" waarde={a.onderbouwing} onChange={(v) => onWijzig({ onderbouwing: v })} />
              <Veld label="Risico" waarde={a.risico} onChange={(v) => onWijzig({ risico: v })} />
            </div>
          ) : (
            <div className="mt-1.5 space-y-1.5 text-sm">
              {a.kernboodschap && <p className="text-zinc-800 dark:text-zinc-200">{a.kernboodschap}</p>}
              <dl className="grid gap-x-4 gap-y-1 text-xs text-zinc-500 sm:grid-cols-[auto_1fr]">
                {a.doelgroep && <Rij label="Voor wie">{a.doelgroep}</Rij>}
                {a.onderbouwing && <Rij label="Waarom">{a.onderbouwing}</Rij>}
                {a.risico && <Rij label="Risico">{a.risico}</Rij>}
              </dl>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Score</span>
            <input
              type="number"
              min={1}
              max={10}
              value={a.score ?? ''}
              onChange={(e) => onWijzig({ score: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
              className={`w-12 rounded-md border-0 py-0.5 text-center text-sm font-semibold tabular-nums ring-1 ring-inset focus:ring-2 focus:ring-accent-500 ${
                { green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900', blue: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900', amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900', red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900', gray: 'bg-zinc-50 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700' }[scoreKleur(a.score)]
              }`}
            />
          </label>
          <div className="flex">
            <button onClick={() => setBewerken((b) => !b)} className="rounded p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200" title={bewerken ? 'Klaar' : 'Bewerken'} aria-label={bewerken ? 'Klaar met bewerken' : 'Bewerken'}>
              {bewerken ? <Check className="size-4" /> : <Pencil className="size-4" />}
            </button>
            <VerwijderKnop onClick={onVerwijder} />
          </div>
        </div>
      </div>
    </li>
  )
}

function Rij({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-medium text-zinc-400">{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

function Veld({ label, waarde, onChange }: { label: string; waarde: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <AutoTextarea className="input text-sm" value={waarde ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function NieuweAngle({ projectId, onKlaar }: { projectId: string; onKlaar: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [v, setV] = useState({ naam: '', type: 'pijnpunt', kernboodschap: '', doelgroep: '', onderbouwing: '', risico: '', score: 6 })
  const opslaan = () =>
    startTransition(async () => {
      await voegAngleToe(projectId, v)
      router.refresh()
      onKlaar()
    })
  return (
    <div className="card space-y-3 border-accent-500 p-4">
      <h3 className="text-sm font-semibold">Eigen angle toevoegen</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_90px]">
        <input autoFocus className="input" placeholder="Naam" value={v.naam} onChange={(e) => setV({ ...v, naam: e.target.value })} aria-label="Naam" />
        <select className="input" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} aria-label="Type">
          {ANGLE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input className="input" type="number" min={1} max={10} value={v.score} onChange={(e) => setV({ ...v, score: Number(e.target.value) })} aria-label="Score" />
      </div>
      <AutoTextarea className="input text-sm" placeholder="Kernboodschap (1 zin)" value={v.kernboodschap} onChange={(e) => setV({ ...v, kernboodschap: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-3">
        <AutoTextarea className="input text-sm" placeholder="Voor wie" value={v.doelgroep} onChange={(e) => setV({ ...v, doelgroep: e.target.value })} />
        <AutoTextarea className="input text-sm" placeholder="Waarom het werkt" value={v.onderbouwing} onChange={(e) => setV({ ...v, onderbouwing: e.target.value })} />
        <AutoTextarea className="input text-sm" placeholder="Risico" value={v.risico} onChange={(e) => setV({ ...v, risico: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onKlaar}>
          Annuleren
        </Button>
        <Button size="sm" variant="primary" loading={pending} disabled={!v.naam.trim()} onClick={opslaan}>
          Toevoegen
        </Button>
      </div>
    </div>
  )
}
