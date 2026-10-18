import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBriefDetail } from '@/lib/data-builder'
import { getAiInfo } from '@/lib/ai/info'
import { getReferentieAds, getSwipeKeuzelijst } from '@/lib/data-swipe'
import { Spinner } from '@/components/ui'
import { BriefEditor } from '@/components/brief/BriefEditor'

export default function BriefPage({ params }: PageProps<'/briefs/[id]'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Inhoud params={params} />
    </Suspense>
  )
}

async function Inhoud({ params }: Pick<PageProps<'/briefs/[id]'>, 'params'>) {
  const { id } = await params
  const [detail, ai, referenties, keuzes] = await Promise.all([getBriefDetail(id), getAiInfo(), getReferentieAds(id), getSwipeKeuzelijst()])
  if (!detail) notFound()
  return <BriefEditor key={id} detail={detail} ai={ai} referenties={referenties} swipeKeuzes={keuzes} />
}
