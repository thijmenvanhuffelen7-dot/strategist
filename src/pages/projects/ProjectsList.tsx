import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Sparkles, Search } from 'lucide-react'
import { useLoadSampleProject, useProjects } from '../../lib/projects'
import { useNewShortcut } from '../../lib/shortcuts'
import { doelLabel } from '../../lib/types'
import { countEntries } from '../../lib/klantdata'
import { Button, EmptyState, ErrorBox, PageHeader, Pill, Spinner } from '../../components/ui'

export function ProjectsList() {
  const { data: projects, isLoading, error, refetch } = useProjects()
  const sample = useLoadSampleProject()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useNewShortcut(() => navigate('/projecten/nieuw'))

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    return (projects ?? []).filter((p) => !n || p.naam.toLowerCase().includes(n) || p.omschrijving?.toLowerCase().includes(n))
  }, [projects, q])

  const loadSample = async () => {
    const p = await sample.mutateAsync()
    navigate(`/projecten/${p.id}`)
  }

  return (
    <>
      <PageHeader
        title="Projecten"
        description="Eén project per merk of product. Onderzoek, angles, briefs en tests hangen aan een project."
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/projecten/nieuw')}>
            Nieuw project <span className="kbd ml-1 border-white/30 bg-white/10 text-white">N</span>
          </Button>
        }
      />

      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {sample.error && <div className="mb-4"><ErrorBox error={sample.error} /></div>}

      {projects && projects.length === 0 && (
        <EmptyState
          icon={<FolderKanban />}
          title="Nog geen projecten"
          actions={
            <>
              <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/projecten/nieuw')}>
                Nieuw project
              </Button>
              <Button icon={<Sparkles className="size-4" />} loading={sample.isPending} onClick={loadSample}>
                Laad voorbeeldproject
              </Button>
            </>
          }
        >
          Begin met een merk of product: vul de productinfo in en plak reviews, comments of Reddit-posts als ruwe klantdata.
          Of laad het voorbeeldproject <strong>Slaapwel</strong> (gewogen deken, 20 reviews) om de flow direct uit te proberen.
        </EmptyState>
      )}

      {projects && projects.length > 0 && (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input className="input pl-9" placeholder="Filter projecten…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/projecten/${p.id}`}
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
                  <span>{new Date(p.bijgewerkt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-sm text-zinc-500">Geen projecten gevonden voor “{q}”.</p>}
          {!projects.some((p) => p.is_voorbeeld) && (
            <button onClick={loadSample} disabled={sample.isPending} className="mt-6 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              <Sparkles className="mr-1 inline size-3.5" /> Laad voorbeeldproject (Slaapwel)
            </button>
          )}
        </>
      )}
    </>
  )
}
