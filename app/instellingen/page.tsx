import { Suspense } from 'react'
import { getProfiel } from '@/lib/data'
import { PageHeader, Spinner } from '@/components/ui'
import { SettingsForm } from '@/components/SettingsForm'

export default function InstellingenPage() {
  return (
    <>
      <PageHeader title="Instellingen" description="Drempelwaarden, tag-lijsten, AI-prompts en data-export volgen in fase 5." />
      <Suspense fallback={<Spinner />}>
        <Formulier />
      </Suspense>
    </>
  )
}

async function Formulier() {
  const p = await getProfiel()
  return <SettingsForm initial={{ naam: p.naam ?? '', standaard_taal: p.standaard_taal, standaard_platform: p.standaard_platform }} />
}
