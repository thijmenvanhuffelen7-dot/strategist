'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderKanban, Plus, Search } from 'lucide-react'
import { useNewShortcut } from '@/lib/shortcuts'
import { doelLabel, type Project } from '@/lib/types'
import { countEntries } from '@/lib/klantdata'
import { Button, EmptyState, Pill } from '../ui'
import { SampleProjectButton } from './SampleProjectButton'
import { kortDatum } from '@/lib/datum'

export function NewProjectButton() {
  const router = useRouter()
  useNewShortcut(() => router.push('/projecten/nieuw'))
  return (
    <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => router.push('/projecten/nieuw')}>
      Nieuw project <span className="kbd ml-1 border-white/30 bg-white/10 text-white">N</span>
    </Button>
  )
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    return projects.filter((p) => !n || p.naam.toLowerCase().includes(n) || p.omschrijving?.toLowerCase().includes(n))
  }, [projects, q])

  if (projects.length === 0)
    return (
      <EmptyState
        icon={<FolderKanban />}
        title="Nog geen projecten"
        actions={
          <>
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => router.push('/projecten/nieuw')}>
              Nieuw project
            </Button>
            <SampleProjectButton />
          </>
        }
      >
        Begin met een merk of product: vul de productinfo in en plak reviews, comments of Reddit-posts als ruwe klantdata. Of laad het
        voorbeeldproject <strong>Slaapwel</strong> (gewogen deken, 20 reviews) om de flow direct uit te proberen.
      </EmptyState>
    )

  return (
    <>
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input id="project-filter" className="input pl-9" placeholder="Filter projecten…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/projecten/${p.id}`}
            className="card group flex flex-col p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium group-hover:text-accent-600 dark:group-hover:text-accent-500">{p.naam}</h3>
              {p.is_voorbeeld && <Pill color="violet">Voorbeeld</Pill>}
            </div>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-500 dark:text-zinc-400">{p.omschrijving || 'Geen omschrijving'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.platforms.map((pl) => (
                <Pill key={pl}>{pl}</Pill>
              ))}
              {p.doel && <Pill color="blue">{doelLabel(p.doel)}</Pill>}
            </div>
            <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
              <span>{countEntries(p.klantdata)} klantdata-items</span>
              <span>{kortDatum(p.bijgewerkt_op)}</span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-zinc-500">Geen projecten gevonden voor “{q}”.</p>}
      {!projects.some((p) => p.is_voorbeeld) && (
        <div className="mt-6">
          <SampleProjectButton variant="link" />
        </div>
      )}
    </>
  )
}
