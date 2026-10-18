import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBuilderData } from '@/lib/data-builder'
import { getProjects } from '@/lib/data'
import { getAiInfo } from '@/lib/ai/info'
import { Spinner } from '@/components/ui'
import { BuilderView } from '@/components/builder/BuilderView'

export default function BuilderPage({ params, searchParams }: PageProps<'/briefs/project/[id]'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Inhoud params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Inhoud({ params, searchParams }: Pick<PageProps<'/briefs/project/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params
  const { stap } = await searchParams
  const [data, ai, projecten] = await Promise.all([getBuilderData(id), getAiInfo(), getProjects()])
  if (!data) notFound()
  const n = Number(stap)
  // Zonder ?stap: begin bij de eerste stap die nog niet af is.
  const beginStap =
    n >= 1 && n <= 4
      ? n
      : !data.research?.goedgekeurd
        ? 1
        : !data.angles.some((a) => a.geselecteerd)
          ? 2
          : !data.hooks.length
            ? 3
            : 4
  return <BuilderView key={id} data={data} ai={ai} beginStap={beginStap} projecten={projecten.map((p) => ({ id: p.id, naam: p.naam }))} />
}
