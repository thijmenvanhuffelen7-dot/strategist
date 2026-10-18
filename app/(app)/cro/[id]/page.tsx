import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCroCheck } from '@/lib/data-cro'
import { getProjects } from '@/lib/data'
import { getAiInfo } from '@/lib/ai/info'
import { blobActief } from '@/lib/opslag'
import { Spinner } from '@/components/ui'
import { CroView } from '@/components/cro/CroView'

export default function CroDetailPage({ params }: PageProps<'/cro/[id]'>) {
  return (
    <Suspense fallback={<Spinner />}>
      <Inhoud params={params} />
    </Suspense>
  )
}

async function Inhoud({ params }: Pick<PageProps<'/cro/[id]'>, 'params'>) {
  const { id } = await params
  const [detail, ai, projecten] = await Promise.all([getCroCheck(id), getAiInfo(), getProjects()])
  if (!detail) notFound()
  return <CroView key={id} detail={detail} ai={ai} projecten={projecten.map((p) => ({ id: p.id, naam: p.naam }))} blob={blobActief()} />
}
