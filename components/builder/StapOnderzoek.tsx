'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Microscope, Sparkles, CheckCircle2, PencilLine, ArrowRight } from 'lucide-react'
import { keurOnderzoekGoed, maakLeegOnderzoek, updateOnderzoek } from '@/lib/builder-actions'
import { BEWUSTZIJNSNIVEAUS, FREQUENTIES, type AiVersie, type ResearchData, type ReviewResultaat, type TekstItem } from '@/lib/builder-types'
import { useServerState, useUitgesteld } from '@/lib/use-server-state'
import { countEntries } from '@/lib/klantdata'
import { AutoTextarea } from '../AutoTextarea'
import { Button, EmptyState, ErrorBox } from '../ui'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { Versies } from '../ai/Versies'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import { Kaart, KopieerChip, nieuwId, SterKnop, ToevoegVeld, VerwijderKnop } from './onderdelen'

type Velden = Omit<ResearchData, 'goedgekeurd' | 'bijgewerkt_op'>

const FREQ_KLASSE = {
  vaak: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900',
  soms: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
  zelden: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
} as const

export function StapOnderzoek({
  projectId,
  klantdata,
  research,
  versies,
  review,
  ai,
  onVolgende,
}: {
  projectId: string
  klantdata: string | null
  research: ResearchData | null
  versies: AiVersie[]
  review: { review: ReviewResultaat; aangemaakt_op: Date } | null
  ai: AiInfo
  onVolgende: () => void
}) {
  const router = useRouter()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()
  const [fout, setFout] = useState<unknown>(null)
  const aantal = countEntries(klantdata)

  const actie = (fn: () => Promise<unknown>, daarna?: () => void) =>
    startTransition(async () => {
      setFout(null)
      try {
        await fn()
        router.refresh()
        daarna?.()
      } catch (e) {
        setFout(e)
      }
    })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Stap 1 · Klantonderzoek</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            De AI analyseert je projectinfo en {aantal} klantdata-items. Daarna kun je alles bewerken, aanvullen en markeren.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Versies versies={versies} uitleg="Het huidige onderzoek (inclusief je eigen bewerkingen) wordt vervangen door deze versie." />
          <Button
            variant={research ? 'secondary' : 'primary'}
            icon={<Sparkles className="size-4" />}
            loading={staat.bezig}
            disabled={!ai.ingesteld || !aantal}
            title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : undefined}
            onClick={() => start({ actie: 'onderzoek', projectId })}
          >
            {research ? 'Opnieuw analyseren' : 'Analyseer klantdata'}
          </Button>
        </div>
      </div>

      {!aantal && (
        <ErrorBox error={new Error('Dit project heeft nog geen klantdata.')} />
      )}
      {!aantal && (
        <p className="-mt-3 text-sm">
          <Link href={`/projecten/${projectId}/bewerken`} className="text-accent-600 hover:underline">
            Plak reviews of comments bij het project →
          </Link>
        </p>
      )}
      {!ai.ingesteld && <GeenKey melding={ai.ontbrekendeKeyMelding} />}

      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />
      {fout != null && <ErrorBox error={fout} />}

      {!research && !staat.bezig && (
        <EmptyState
          icon={<Microscope />}
          title="Nog geen klantonderzoek"
          actions={
            <Button size="sm" icon={<PencilLine className="size-3.5" />} loading={pending} onClick={() => actie(() => maakLeegOnderzoek(projectId))}>
              Zelf invullen
            </Button>
          }
        >
          Klik op “Analyseer klantdata” om pijnpunten, verlangens, bezwaren, aha-momenten, klanttaal en het bewustzijnsniveau te laten bepalen. Of vul het zelf in.
        </EmptyState>
      )}

      {research && (
        <>
          <Goedkeuring
            goedgekeurd={research.goedgekeurd}
            pending={pending}
            onGoedkeuren={() => actie(() => keurOnderzoekGoed(projectId, true), onVolgende)}
            onIntrekken={() => actie(() => keurOnderzoekGoed(projectId, false))}
            onVolgende={onVolgende}
          />
          <OnderzoekBewerker projectId={projectId} research={research} />
          <Review projectId={projectId} stap="onderzoek" laatste={review} ai={ai} />
        </>
      )}
    </div>
  )
}

export function GeenKey({ melding }: { melding: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
      <strong className="font-medium">AI staat nog uit.</strong> {melding}
    </div>
  )
}

function Goedkeuring({ goedgekeurd, pending, onGoedkeuren, onIntrekken, onVolgende }: { goedgekeurd: boolean; pending: boolean; onGoedkeuren: () => void; onIntrekken: () => void; onVolgende: () => void }) {
  return goedgekeurd ? (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <CheckCircle2 className="size-4 text-emerald-600" />
      <span className="text-emerald-800 dark:text-emerald-300">Onderzoek goedgekeurd. Dit wordt meegestuurd bij angles, hooks en briefs.</span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="ghost" onClick={onIntrekken} disabled={pending}>
          Intrekken
        </Button>
        <Button size="sm" variant="primary" icon={<ArrowRight className="size-3.5" />} onClick={onVolgende}>
          Naar angles
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800">
      <span className="text-zinc-600 dark:text-zinc-400">Controleer en bewerk het onderzoek. Klaar? Keur het goed om verder te gaan.</span>
      <Button size="sm" variant="primary" className="ml-auto" icon={<CheckCircle2 className="size-3.5" />} loading={pending} onClick={onGoedkeuren}>
        Goedkeuren en door naar angles
      </Button>
    </div>
  )
}

function OnderzoekBewerker({ projectId, research }: { projectId: string; research: ResearchData }) {
  const [v, setV] = useServerState<Velden>({
    pijnpunten: research.pijnpunten,
    verlangens: research.verlangens,
    bezwaren: research.bezwaren,
    aha_momenten: research.aha_momenten,
    klanttaal: research.klanttaal,
    bewustzijnsniveau: research.bewustzijnsniveau,
  }, research.bijgewerkt_op.toISOString())
  const opslaan = useUitgesteld((patch: Partial<Velden>) => updateOnderzoek(projectId, patch))

  const zet = <K extends keyof Velden>(k: K, waarde: Velden[K]) => {
    setV((s) => ({ ...s, [k]: waarde }))
    opslaan(k, { [k]: waarde } as Partial<Velden>)
  }
  const wijzig = <K extends 'pijnpunten' | 'verlangens' | 'bezwaren' | 'aha_momenten' | 'klanttaal'>(k: K, id: string, patch: Partial<Velden[K][number]>) =>
    zet(k, (v[k] as Velden[K][number][]).map((x) => (x.id === id ? { ...x, ...patch } : x)) as Velden[K])
  const verwijder = <K extends 'pijnpunten' | 'verlangens' | 'bezwaren' | 'aha_momenten' | 'klanttaal'>(k: K, id: string) =>
    zet(k, (v[k] as Velden[K][number][]).filter((x) => x.id !== id) as Velden[K])

  return (
    <div className="space-y-4">
      <Kaart titel="Bewustzijnsniveau" uitleg="Eugene Schwartz: hoe bewust is de doelgroep van het probleem en de oplossing?">
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <select
            id="bewustzijnsniveau"
            className="input"
            value={v.bewustzijnsniveau?.niveau ?? ''}
            onChange={(e) => zet('bewustzijnsniveau', { niveau: e.target.value as (typeof BEWUSTZIJNSNIVEAUS)[number], uitleg: v.bewustzijnsniveau?.uitleg ?? '' })}
          >
            <option value="" disabled>
              Kies…
            </option>
            {BEWUSTZIJNSNIVEAUS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <AutoTextarea
            className="input text-sm leading-relaxed"
            placeholder="Waarom dit niveau?"
            value={v.bewustzijnsniveau?.uitleg ?? ''}
            onChange={(e) => zet('bewustzijnsniveau', { niveau: v.bewustzijnsniveau?.niveau ?? 'problem aware', uitleg: e.target.value })}
          />
        </div>
      </Kaart>

      <Kaart titel="Pijnpunten" aantal={v.pijnpunten.length} uitleg="Klik op een quote om hem te kopiëren.">
        <div className="grid gap-3 lg:grid-cols-2">
          {v.pijnpunten.map((p) => (
            <div key={p.id} className={`rounded-lg border p-3 ${p.ster ? 'border-amber-300 dark:border-amber-800' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className="flex items-start gap-1">
                <AutoTextarea className="w-full border-0 bg-transparent p-0 text-sm font-medium focus:ring-0 focus:outline-none" value={p.omschrijving} onChange={(e) => wijzig('pijnpunten', p.id, { omschrijving: e.target.value })} />
                <SterKnop aan={p.ster} onClick={() => wijzig('pijnpunten', p.id, { ster: !p.ster })} />
                <VerwijderKnop onClick={() => verwijder('pijnpunten', p.id)} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <select
                  aria-label="Frequentie"
                  className={`rounded-full border-0 px-2 py-0.5 font-medium ring-1 ring-inset ${FREQ_KLASSE[p.frequentie]}`}
                  value={p.frequentie}
                  onChange={(e) => wijzig('pijnpunten', p.id, { frequentie: e.target.value as (typeof FREQUENTIES)[number] })}
                >
                  {FREQUENTIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <span className="text-zinc-400">emotie:</span>
                <input aria-label="Emotie" className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0.5 text-xs focus:border-zinc-300 focus:outline-none" value={p.emotie} onChange={(e) => wijzig('pijnpunten', p.id, { emotie: e.target.value })} />
              </div>
              <ul className="mt-2 space-y-1">
                {p.quotes.map((q, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <KopieerChip tekst={q} className="flex-1 rounded border-l-2 border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 italic hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      “{q}”
                    </KopieerChip>
                    <VerwijderKnop label="Quote verwijderen" onClick={() => wijzig('pijnpunten', p.id, { quotes: p.quotes.filter((_, j) => j !== i) })} />
                  </li>
                ))}
              </ul>
              {p.quotes.length < 3 && <ToevoegVeld placeholder="Quote toevoegen" onToevoegen={(t) => wijzig('pijnpunten', p.id, { quotes: [...p.quotes, t] })} />}
            </div>
          ))}
        </div>
        <ToevoegVeld
          placeholder="Nieuw pijnpunt"
          onToevoegen={(t) => zet('pijnpunten', [...v.pijnpunten, { id: nieuwId(), omschrijving: t, frequentie: 'soms', quotes: [], emotie: '', ster: false }])}
        />
      </Kaart>

      <div className="grid gap-4 lg:grid-cols-2">
        <TekstLijst titel="Verlangens / gewenste uitkomst" items={v.verlangens} onChange={(items) => zet('verlangens', items)} />
        <TekstLijst titel="Aha-momenten" items={v.aha_momenten} onChange={(items) => zet('aha_momenten', items)} />
      </div>

      <Kaart titel="Bezwaren" aantal={v.bezwaren.length} uitleg="Per bezwaar: hoe kan een ad het wegnemen?">
        <ul className="space-y-2">
          {v.bezwaren.map((b) => (
            <li key={b.id} className="grid gap-2 rounded-lg border border-zinc-200 p-2.5 sm:grid-cols-[1fr_1fr_auto] dark:border-zinc-800">
              <AutoTextarea className="input text-sm" value={b.bezwaar} onChange={(e) => wijzig('bezwaren', b.id, { bezwaar: e.target.value })} aria-label="Bezwaar" />
              <AutoTextarea className="input text-sm" value={b.wegnemen} placeholder="Hoe een ad dit wegneemt" onChange={(e) => wijzig('bezwaren', b.id, { wegnemen: e.target.value })} aria-label="Wegnemen" />
              <div className="flex sm:flex-col">
                <SterKnop aan={b.ster} onClick={() => wijzig('bezwaren', b.id, { ster: !b.ster })} />
                <VerwijderKnop onClick={() => verwijder('bezwaren', b.id)} />
              </div>
            </li>
          ))}
        </ul>
        <ToevoegVeld placeholder="Nieuw bezwaar" onToevoegen={(t) => zet('bezwaren', [...v.bezwaren, { id: nieuwId(), bezwaar: t, wegnemen: '', ster: false }])} />
      </Kaart>

      <Kaart titel="Klanttaal-bank" aantal={v.klanttaal.length} uitleg="Letterlijke woorden en zinnen van klanten. Klik om te kopiëren.">
        <div className="flex flex-wrap gap-1.5">
          {v.klanttaal.map((k) => (
            <span
              key={k.id}
              className={`inline-flex items-center gap-0.5 rounded-full border py-0.5 pr-1 pl-2.5 text-sm ${k.ster ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}
            >
              <KopieerChip tekst={k.tekst}>“{k.tekst}”</KopieerChip>
              <SterKnop aan={k.ster} onClick={() => wijzig('klanttaal', k.id, { ster: !k.ster })} />
              <VerwijderKnop onClick={() => verwijder('klanttaal', k.id)} />
            </span>
          ))}
        </div>
        <ToevoegVeld placeholder="Woord of zin toevoegen" onToevoegen={(t) => zet('klanttaal', [...v.klanttaal, { id: nieuwId(), tekst: t, ster: false }])} />
      </Kaart>
    </div>
  )
}

function TekstLijst({ titel, items, onChange }: { titel: string; items: TekstItem[]; onChange: (items: TekstItem[]) => void }) {
  return (
    <Kaart titel={titel} aantal={items.length}>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-1">
            <AutoTextarea
              className={`input flex-1 py-1.5 text-sm ${it.ster ? 'border-amber-300 dark:border-amber-800' : ''}`}
              value={it.tekst}
              onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, tekst: e.target.value } : x)))}
            />
            <SterKnop aan={it.ster} onClick={() => onChange(items.map((x) => (x.id === it.id ? { ...x, ster: !x.ster } : x)))} />
            <VerwijderKnop onClick={() => onChange(items.filter((x) => x.id !== it.id))} />
          </li>
        ))}
      </ul>
      <ToevoegVeld placeholder="Toevoegen" onToevoegen={(t) => onChange([...items, { id: nieuwId(), tekst: t, ster: false }])} />
    </Kaart>
  )
}
