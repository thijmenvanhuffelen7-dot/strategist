import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/data'
import { Spinner } from '@/components/ui'
import { ProjectDetail } from '@/components/projects/ProjectDetail'

export default function ProjectPage({ params, searchParams }: PageProps<'/projecten/[id]'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Inhoud params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Inhoud({ params, searchParams }: Pick<PageProps<'/projecten/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params
  const { tab } = await searchParams
  const project = await getProject(id)
  if (!project) notFound()
  // key: bij een ander project begint de pagina opnieuw (o.a. met het juiste tabblad).
  return <ProjectDetail key={project.id} project={project} initialTab={typeof tab === 'string' ? tab : 'overzicht'} />
}
