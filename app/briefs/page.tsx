import { Suspense } from 'react'
import Link from 'next/link'
import { FileText, FolderKanban, ChevronRight } from 'lucide-react'
import { getBriefsOverzicht, getBuilderVoortgang } from '@/lib/data-builder'
import { EmptyState, PageHeader, Pill, Spinner } from '@/components/ui'
import { BriefLijst } from '@/components/builder/StapBrief'
import { SampleProjectButton } from '@/components/projects/SampleProjectButton'

export default function BriefsPage() {
  return (
    <>
      <PageHeader title="Brief Builder" description="Van klantonderzoek naar creative brief in 4 stappen: onderzoek → angles → hooks → brief." />
      <Suspense fallback={<Spinner />}>
        <Inhoud />
      </Suspense>
    </>
  )
}

async function Inhoud() {
  const [voortgang, briefs] = await Promise.all([getBuilderVoortgang(), getBriefsOverzicht()])
  if (!voortgang.length)
    return (
      <EmptyState icon={<FileText />} title="Eerst een project" actions={<SampleProjectButton />}>
        De Brief Builder werkt per project. Maak een project aan met klantdata, of laad het voorbeeldproject Slaapwel.
      </EmptyState>
    )
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold">Kies een project</h2>
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {voortgang.map((p) => (
            <Link key={p.id} href={`/briefs/project/${p.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <FolderKanban className="size-4 shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.naam}</span>
              {p.is_voorbeeld && <Pill color="violet">Voorbeeld</Pill>}
              <span className="flex flex-wrap gap-1.5">
                <Pill color={p.onderzoek === 'goedgekeurd' ? 'green' : p.onderzoek === 'concept' ? 'amber' : 'gray'}>
                  Onderzoek: {p.onderzoek === 'goedgekeurd' ? 'goedgekeurd' : p.onderzoek === 'concept' ? 'concept' : 'nog niet'}
                </Pill>
                <Pill>{p.geselecteerd}/{p.angles} angles</Pill>
                <Pill>{p.hooks} hooks</Pill>
                <Pill color={p.briefs ? 'blue' : 'gray'}>{p.briefs} briefs</Pill>
              </span>
              <ChevronRight className="size-4 text-zinc-400" />
            </Link>
          ))}
        </div>
      </section>
      {briefs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Alle briefs</h2>
          <BriefLijst briefs={briefs} projectNamen={Object.fromEntries(briefs.map((b) => [b.project_id, b.projectNaam]))} />
        </section>
      )}
    </div>
  )
}
