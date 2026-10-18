import { Suspense } from 'react'
import { getSwipeItems } from '@/lib/data-swipe'
import { ButtonLink, PageHeader, Spinner } from '@/components/ui'
import { SwipeOverzicht } from '@/components/swipe/SwipeOverzicht'
import { Plus } from 'lucide-react'

export default function SwipePage() {
  return (
    <>
      <PageHeader
        title="Swipe File"
        description="Ads die je als inspiratie bewaart, met analyse van waarom ze werken."
        actions={
          <ButtonLink href="/swipe/nieuw" variant="primary" icon={<Plus className="size-4" />}>
            Ad toevoegen <span className="kbd ml-1 border-white/30 bg-white/10 text-white">N</span>
          </ButtonLink>
        }
      />
      <Suspense fallback={<Spinner />}>
        <Lijst />
      </Suspense>
    </>
  )
}

async function Lijst() {
  return <SwipeOverzicht items={await getSwipeItems()} />
}
