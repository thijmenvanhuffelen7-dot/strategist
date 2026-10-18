'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft } from 'lucide-react'
import type { BuilderData } from '@/lib/data-builder'
import { wachtOpOpslaan } from '@/lib/use-server-state'
import { Pill } from '../ui'
import type { AiInfo } from '../ai/types'
import { StapOnderzoek } from './StapOnderzoek'
import { StapAngles } from './StapAngles'
import { StapHooks } from './StapHooks'
import { StapBrief } from './StapBrief'

const STAPPEN = ['Klantonderzoek', 'Angles', 'Hooks', 'Brief'] as const

export function BuilderView({ data, ai, beginStap, projecten }: { data: BuilderData; ai: AiInfo; beginStap: number; projecten: { id: string; naam: string }[] }) {
  const router = useRouter()
  const [stap, setStap] = useState(beginStap)
  const { project, research, angles, hooks, briefs } = data
  const geselecteerd = angles.filter((a) => a.geselecteerd)

  const klaar = [
    Boolean(research?.goedgekeurd),
    geselecteerd.length > 0,
    hooks.some((h) => geselecteerd.some((a) => a.id === h.angle_id)),
    briefs.length > 0,
  ]

  const gaNaar = async (n: number) => {
    // Eerst alle wijzigingen opslaan en verse data ophalen, zodat de volgende stap alles ziet.
    await wachtOpOpslaan()
    router.refresh()
    setStap(n)
    window.history.replaceState(null, '', `/briefs/project/${project.id}?stap=${n}`)
    document.querySelector('main')?.scrollTo({ top: 0 })
  }

  return (
    <>
      <Link href="/briefs" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> Brief Builder
      </Link>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-tight">{project.naam}</h1>
          {project.is_voorbeeld && <Pill color="violet">Voorbeeld</Pill>}
          <Pill color="accent">Ads in het {project.taal}</Pill>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select
            aria-label="Ander project"
            className="input h-8 w-auto py-1 text-xs"
            value={project.id}
            onChange={(e) => router.push(`/briefs/project/${e.target.value}`)}
          >
            {projecten.map((p) => (
              <option key={p.id} value={p.id}>
                {p.naam}
              </option>
            ))}
          </select>
          <Link href={`/projecten/${project.id}`} className="text-xs whitespace-nowrap text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Projectinfo →
          </Link>
        </div>
      </div>

      <ol className="mb-6 grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {STAPPEN.map((naam, i) => {
          const n = i + 1
          const actief = stap === n
          return (
            <li key={naam}>
              <button
                onClick={() => gaNaar(n)}
                aria-current={actief ? 'step' : undefined}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                  actief ? 'bg-white font-medium shadow-sm dark:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    klaar[i] ? 'bg-emerald-500 text-white' : actief ? 'bg-accent-600 text-white' : 'bg-zinc-300 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {klaar[i] ? <Check className="size-3" /> : n}
                </span>
                <span className="hidden sm:inline">{naam}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {stap === 1 && (
        <StapOnderzoek
          projectId={project.id}
          klantdata={project.klantdata}
          research={research}
          versies={data.versies.onderzoek}
          review={data.reviews.onderzoek}
          ai={ai}
          onVolgende={() => gaNaar(2)}
        />
      )}
      {stap === 2 && (
        <StapAngles
          projectId={project.id}
          onderzoekGoedgekeurd={Boolean(research?.goedgekeurd)}
          angles={angles}
          versies={data.versies.angles}
          review={data.reviews.angles}
          ai={ai}
          onVorige={() => gaNaar(1)}
          onVolgende={() => gaNaar(3)}
        />
      )}
      {stap === 3 && <StapHooks projectId={project.id} angles={angles} hooks={hooks} review={data.reviews.hooks} ai={ai} onVorige={() => gaNaar(2)} onVolgende={() => gaNaar(4)} />}
      {stap === 4 && <StapBrief projectId={project.id} angles={angles} hooks={hooks} briefs={briefs} ai={ai} onVorige={() => gaNaar(3)} />}

      <p className="mt-8 text-xs text-zinc-400">
        Model: {ai.model} · vandaag {data.tokensVandaag.toLocaleString('nl-NL')} van ~{ai.dagLimiet.toLocaleString('nl-NL')} tokens gebruikt
      </p>
    </>
  )
}
