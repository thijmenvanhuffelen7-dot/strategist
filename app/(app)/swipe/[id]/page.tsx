import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getSwipeItem } from '@/lib/data-swipe'
import { getAiInfo } from '@/lib/ai/info'
import { blobActief } from '@/lib/opslag'
import { Spinner } from '@/components/ui'
import { SwipeDetailView } from '@/components/swipe/SwipeDetailView'

export default function SwipeDetailPage({ params }: PageProps<'/swipe/[id]'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Inhoud params={params} />
    </Suspense>
  )
}

async function Inhoud({ params }: Pick<PageProps<'/swipe/[id]'>, 'params'>) {
  const { id } = await params
  const [detail, ai] = await Promise.all([getSwipeItem(id), getAiInfo()])
  if (!detail) notFound()
  return <SwipeDetailView key={id} detail={detail} ai={ai} blob={blobActief()} />
}
