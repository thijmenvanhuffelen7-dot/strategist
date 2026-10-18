'use client'
import { Microscope, Lightbulb, Anchor, FileText, Star, ArrowRight } from 'lucide-react'
import type { AngleData, BriefData, HookData, ResearchData } from '@/lib/builder-types'
import { ButtonLink, EmptyState, Pill } from '../ui'
import { KopieerChip } from '../builder/onderdelen'
import { BriefLijst } from '../builder/StapBrief'
import { scoreKleur } from '../builder/StapAngles'

const naarBuilder = (projectId: string, stap: number, label: string) => (
  <ButtonLink size="sm" href={`/briefs/project/${projectId}?stap=${stap}`} icon={<ArrowRight className="size-3.5" />}>
    {label}
  </ButtonLink>
)

export function OnderzoekTab({ projectId, research }: { projectId: string; research: ResearchData | null }) {
  if (!research)
    return (
      <EmptyState icon={<Microscope />} title="Nog geen klantonderzoek" actions={naarBuilder(projectId, 1, 'Start in de Brief Builder')}>
        In de Brief Builder (stap 1) analyseert de AI je klantdata: pijnpunten, verlangens, bezwaren, aha-momenten, klanttaal en bewustzijnsniveau.
      </EmptyState>
    )
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill color={research.goedgekeurd ? 'green' : 'amber'} dot>
          {research.goedgekeurd ? 'Goedgekeurd' : 'Concept'}
        </Pill>
        {research.bewustzijnsniveau && <Pill color="accent">{research.bewustzijnsniveau.niveau}</Pill>}
        <span className="ml-auto">{naarBuilder(projectId, 1, 'Bewerken')}</span>
      </div>
      {research.bewustzijnsniveau?.uitleg && <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{research.bewustzijnsniveau.uitleg}</p>}
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Pijnpunten</h3>
        <ul className="grid gap-2 lg:grid-cols-2">
          {research.pijnpunten.map((p) => (
            <li key={p.id} className="card p-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="flex-1 font-medium">{p.omschrijving}</span>
                {p.ster && <Star className="size-3.5 fill-amber-500 text-amber-500" />}
                <Pill color={p.frequentie === 'vaak' ? 'red' : p.frequentie === 'soms' ? 'amber' : 'gray'}>{p.frequentie}</Pill>
              </div>
              {p.quotes.map((q, i) => (
                <KopieerChip key={i} tekst={q} className="mt-1.5 block w-full text-xs text-zinc-500 italic">
                  “{q}”
                </KopieerChip>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Klanttaal-bank</h3>
        <div className="flex flex-wrap gap-1.5">
          {research.klanttaal.map((k) => (
            <KopieerChip key={k.id} tekst={k.tekst} className={`rounded-full border px-2.5 py-0.5 text-sm ${k.ster ? 'border-amber-300' : 'border-zinc-200 dark:border-zinc-700'}`}>
              “{k.tekst}”
            </KopieerChip>
          ))}
        </div>
      </section>
    </div>
  )
}

export function AnglesTab({ projectId, angles }: { projectId: string; angles: AngleData[] }) {
  if (!angles.length)
    return (
      <EmptyState icon={<Lightbulb />} title="Nog geen angles" actions={naarBuilder(projectId, 2, 'Naar stap 2')}>
        Op basis van het goedgekeurde onderzoek genereert de AI 8–10 angles met score en onderbouwing.
      </EmptyState>
    )
  return (
    <div className="space-y-3">
      <div className="flex justify-end">{naarBuilder(projectId, 2, 'Bewerken in Brief Builder')}</div>
      <ul className="card divide-y divide-zinc-100 dark:divide-zinc-800">
        {[...angles]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <Pill color={scoreKleur(a.score)}>{a.score ?? '–'}</Pill>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{a.naam}</span>
                  {a.type && <Pill color="violet">{a.type}</Pill>}
                  {a.geselecteerd && <Pill color="accent">geselecteerd</Pill>}
                </div>
                {a.kernboodschap && <p className="mt-0.5 text-sm text-zinc-500">{a.kernboodschap}</p>}
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}

/** Hook-bibliotheek: hooks met een ster. */
export function HooksTab({ projectId, hooks, angles }: { projectId: string; hooks: HookData[]; angles: AngleData[] }) {
  const bibliotheek = hooks.filter((h) => h.ster)
  const angleNaam = (id: string | null) => angles.find((a) => a.id === id)?.naam ?? 'zonder angle'
  if (!hooks.length)
    return (
      <EmptyState icon={<Anchor />} title="Nog geen hooks" actions={naarBuilder(projectId, 3, 'Naar stap 3')}>
        Per gekozen angle schrijft de AI 5 hooks. Hooks met een ster komen hier in je hook-bibliotheek.
      </EmptyState>
    )
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-500">
          <Star className="inline size-3.5 fill-amber-500 text-amber-500" /> {bibliotheek.length} in de hook-bibliotheek · {hooks.length} hooks in totaal
        </p>
        {naarBuilder(projectId, 3, 'Alle hooks bekijken')}
      </div>
      {bibliotheek.length === 0 ? (
        <p className="text-sm text-zinc-400">Nog geen hooks met een ster. Geef in stap 3 een ster aan je beste hooks.</p>
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {bibliotheek.map((h) => (
            <li key={h.id} className="card p-3">
              <KopieerChip tekst={h.gesproken ?? ''} className="w-full text-[15px] font-medium">
                {h.gesproken}
              </KopieerChip>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                {h.type && <Pill>{h.type}</Pill>}
                <span>{angleNaam(h.angle_id)}</span>
              </div>
              {h.overlay && <p className="mt-1 text-xs text-zinc-500">Overlay: {h.overlay}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BriefsTab({ projectId, briefs }: { projectId: string; briefs: BriefData[] }) {
  if (!briefs.length)
    return (
      <EmptyState icon={<FileText />} title="Nog geen briefs" actions={naarBuilder(projectId, 4, 'Naar stap 4')}>
        Kies in de Brief Builder een angle en hook; de AI schrijft een complete brief met script, testvariaties en succescriteria.
      </EmptyState>
    )
  return <BriefLijst briefs={briefs} />
}
