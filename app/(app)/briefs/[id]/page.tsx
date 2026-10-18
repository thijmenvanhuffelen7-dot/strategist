import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getBriefDetail } from '@/lib/data-builder'
import { getAiInfo } from '@/lib/ai/info'
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
  const [detail, ai] = await Promise.all([getBriefDetail(id), getAiInfo()])
  if (!detail) notFound()
  return <BriefEditor key={id} detail={detail} ai={ai} />
}
