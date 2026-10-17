import { Link, useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, FileText, Bookmark, Sparkles, FlaskConical } from 'lucide-react'
import { useLoadSampleProject, useProjects } from '../lib/projects'
import { useProfile } from '../lib/profile'
import { Button, EmptyState, PageHeader, Pill } from '../components/ui'

export function Dashboard() {
  const { data: projects = [], isLoading } = useProjects()
  const { data: profile } = useProfile()
  const sample = useLoadSampleProject()
  const navigate = useNavigate()

  const loadSample = async () => {
    const p = await sample.mutateAsync()
    navigate(`/projecten/${p.id}`)
  }

  return (
    <>
      <PageHeader
        title={`Welkom${profile?.naam ? `, ${profile.naam}` : ''}`}
        description="Je werkplek voor klantonderzoek, angles, hooks, briefs en tests."
        actions={
          <>
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/projecten/nieuw')}>
              Nieuw project
            </Button>
            <Button icon={<FileText className="size-4" />} onClick={() => navigate('/briefs')}>
              Nieuwe brief
            </Button>
            <Button icon={<Bookmark className="size-4" />} onClick={() => navigate('/swipe')}>
              Ad toevoegen
            </Button>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Actieve projecten" value={isLoading ? '…' : projects.length} icon={<FolderKanban />} />
        <Stat label="Briefs" value="—" icon={<FileText />} hint="fase 2" />
        <Stat label="Lopende tests" value="—" icon={<FlaskConical />} hint="fase 4" />
        <Stat label="Swipe-items" value="—" icon={<Bookmark />} hint="fase 3" />
      </div>

      {!isLoading && projects.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Klaar om te beginnen"
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
          Maak je eerste project aan, of laad het voorbeeldproject “Slaapwel” (gewogen deken van €129, met 20 verzonnen reviews) om de app te verkennen.
        </EmptyState>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Recente projecten</h2>
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projecten/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <FolderKanban className="size-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.naam}</span>
                {p.is_voorbeeld && <Pill color="violet">Voorbeeld</Pill>}
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {new Date(p.bijgewerkt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function Stat({ label, value, icon, hint }: { label: string; value: string | number; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-zinc-400 [&>svg]:size-4">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
    </div>
  )
}
