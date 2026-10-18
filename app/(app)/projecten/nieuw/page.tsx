import { Suspense } from 'react'
import { getProfiel } from '@/lib/data'
import { emptyProject } from '@/lib/types'
import { Spinner } from '@/components/ui'
import { ProjectForm } from '@/components/projects/ProjectForm'

export default function NieuwProjectPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Formulier />
    </Suspense>
  )
}

async function Formulier() {
  const profiel = await getProfiel()
  return <ProjectForm id={null} initial={emptyProject(profiel.standaard_taal, profiel.standaard_platform)} standaardDrempels={profiel.drempels} />
}
