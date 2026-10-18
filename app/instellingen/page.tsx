import { Suspense } from 'react'
import { getProfiel } from '@/lib/data'
import { prisma } from '@/lib/db'
import { getProvider } from '@/lib/ai'
import { PageHeader, Spinner } from '@/components/ui'
import { SettingsForm } from '@/components/SettingsForm'

export default function InstellingenPage() {
  return (
    <>
      <PageHeader title="Instellingen" description="Drempelwaarden, tag-lijsten, bewerkbare AI-prompts en data-export volgen in fase 5." />
      <Suspense fallback={<Spinner />}>
        <Formulier />
      </Suspense>
    </>
  )
}

async function Formulier() {
  const p = await getProfiel()
  const provider = getProvider()
  const rij = await prisma.profiel.findUnique({ where: { id: 1 }, select: { ai_model: true } })
  return (
    <SettingsForm
      initial={{ naam: p.naam ?? '', standaard_taal: p.standaard_taal, standaard_platform: p.standaard_platform }}
      ai={{
        provider: provider.naam,
        ingesteld: provider.isIngesteld(),
        modellen: provider.modellen,
        gekozen: rij?.ai_model ?? '',
        standaard: process.env.GROQ_MODEL || provider.standaardModel,
      }}
    />
  )
}
