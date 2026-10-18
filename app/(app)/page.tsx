import { Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import { FolderKanban, FileText, Bookmark, Sparkles, FlaskConical } from 'lucide-react'
import { getBriefTelling, getProfiel, getProjects } from '@/lib/data'
import { EmptyState, PageHeader, Pill, Spinner, STATUS } from '@/components/ui'
import { QuickActions } from '@/components/QuickActions'
import { SampleProjectButton } from '@/components/projects/SampleProjectButton'
import { kortDatum } from '@/lib/datum'

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={
          <Suspense fallback="Welkom">
            <Welkom />
          </Suspense>
        }
        description="Je werkplek voor klantonderzoek, angles, hooks, briefs en tests."
        actions={<QuickActions />}
      />
      <Suspense fallback={<Spinner />}>
        <DashboardInhoud />
      </Suspense>
    </>
  )
}

async function Welkom() {
  const profiel = await getProfiel()
  return <>Welkom{profiel.naam ? `, ${profiel.naam}` : ''}</>
}

async function DashboardInhoud() {
  const [projects, briefs] = await Promise.all([getProjects(), getBriefTelling()])
  const aantalBriefs = Object.values(briefs).reduce((a, b) => a + b, 0)
  const perStatus = Object.entries(briefs)
    .map(([s, n]) => `${n} ${STATUS[s]?.label.toLowerCase() ?? s}`)
    .join(' · ')
  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Actieve projecten" value={projects.length} icon={<FolderKanban />} />
        <Stat label="Briefs" value={aantalBriefs} icon={<FileText />} hint={perStatus || undefined} />
        <Stat label="Lopende tests" value="—" icon={<FlaskConical />} hint="fase 4" />
        <Stat label="Swipe-items" value="—" icon={<Bookmark />} hint="fase 3" />
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<Sparkles />} title="Klaar om te beginnen" actions={<SampleProjectButton />}>
          Maak je eerste project aan, of laad het voorbeeldproject “Slaapwel” (gewogen deken van €129, met 20 verzonnen reviews) om de app te verkennen.
        </EmptyState>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Recente projecten</h2>
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/projecten/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <FolderKanban className="size-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.naam}</span>
                {p.is_voorbeeld && <Pill color="violet">Voorbeeld</Pill>}
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {kortDatum(p.bijgewerkt_op)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function Stat({ label, value, icon, hint }: { label: string; value: string | number; icon: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-zinc-400 [&>svg]:size-4">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
    </div>
  )
}
