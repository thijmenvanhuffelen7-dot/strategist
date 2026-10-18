import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProfiel, getProject } from '@/lib/data'
import { toInput } from '@/lib/types'
import { Spinner } from '@/components/ui'
import { ProjectForm } from '@/components/projects/ProjectForm'

export default function BewerkProjectPage({ params }: PageProps<'/projecten/[id]/bewerken'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Formulier params={params} />
    </Suspense>
  )
}

async function Formulier({ params }: Pick<PageProps<'/projecten/[id]/bewerken'>, 'params'>) {
  const { id } = await params
  const [project, profiel] = await Promise.all([getProject(id), getProfiel()])
  if (!project) notFound()
  return <ProjectForm key={project.bijgewerkt_op.toISOString()} id={project.id} initial={toInput(project)} standaardDrempels={profiel.drempels} />
}
