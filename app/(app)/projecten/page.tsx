import { Suspense } from 'react'
import { getProjects } from '@/lib/data'
import { PageHeader, Spinner } from '@/components/ui'
import { NewProjectButton, ProjectsList } from '@/components/projects/ProjectsList'

export default function ProjectenPage() {
  return (
    <>
      <PageHeader
        title="Projecten"
        description="Eén project per merk of product. Onderzoek, angles, briefs en tests hangen aan een project."
        actions={<NewProjectButton />}
      />
      <Suspense fallback={<Spinner />}>
        <Lijst />
      </Suspense>
    </>
  )
}

async function Lijst() {
  return <ProjectsList projects={await getProjects()} />
}
