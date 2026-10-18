import { Suspense } from 'react'
import { connection } from 'next/server'
import { vereisLogin } from '@/lib/auth'
import { blobActief } from '@/lib/opslag'
import { Spinner } from '@/components/ui'
import { NieuweSwipe } from '@/components/swipe/NieuweSwipe'

export default function NieuweSwipePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Formulier />
    </Suspense>
  )
}

async function Formulier() {
  await connection()
  await vereisLogin()
  return <NieuweSwipe blob={blobActief()} />
}
