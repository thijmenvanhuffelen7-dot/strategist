import { Suspense } from 'react'
import Link from 'next/link'
import { ScanSearch } from 'lucide-react'
import { getProjects } from '@/lib/data'
import { getCroChecks } from '@/lib/data-cro'
import { kortDatum } from '@/lib/datum'
import { EmptyState, PageHeader, Pill, Spinner } from '@/components/ui'
import { NieuweCroCheck } from '@/components/cro/NieuweCroCheck'

export default function CroPage({ searchParams }: PageProps<'/cro'>) {
  return (
    <>
      <PageHeader title="CRO-check" description="Laat een landingspagina beoordelen op conversie: concrete verbeterpunten met voorbeeldteksten, quick wins en A/B-testideeën." />
      <Suspense fallback={<Spinner />}>
        <Inhoud searchParams={searchParams} />
      </Suspense>
    </>
  )
}

async function Inhoud({ searchParams }: Pick<PageProps<'/cro'>, 'searchParams'>) {
  const [{ url, project }, projecten, checks] = await Promise.all([searchParams, getProjects(), getCroChecks()])
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <NieuweCroCheck
        projecten={projecten.map((p) => ({ id: p.id, naam: p.naam }))}
        beginUrl={typeof url === 'string' ? url : ''}
        beginProject={typeof project === 'string' ? project : ''}
      />
      <section className="min-w-0">
        <h2 className="mb-3 text-sm font-semibold">Eerdere checks</h2>
        {checks.length === 0 ? (
          <EmptyState icon={<ScanSearch />} title="Nog geen CRO-checks">
            Vul links een webadres in, bijvoorbeeld je productpagina of die van een concurrent.
          </EmptyState>
        ) : (
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
            {checks.map((c) => (
              <Link key={c.id} href={`/cro/${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.titel}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {c.url?.replace(/^https?:\/\//, '') ?? 'geplakte tekst'}
                    {c.projectNaam && ` · ${c.projectNaam}`}
                  </span>
                </span>
                {c.score != null ? <Pill color={c.score >= 7 ? 'green' : c.score >= 5 ? 'amber' : 'red'}>{c.score}/10</Pill> : <Pill>nog niet beoordeeld</Pill>}
                {c.open != null && c.open > 0 && <span className="text-xs text-zinc-500">{c.open} open</span>}
                <span className="text-xs text-zinc-500">{kortDatum(c.aangemaakt_op)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
