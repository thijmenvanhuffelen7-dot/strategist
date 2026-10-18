'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, X } from 'lucide-react'
import { koppelBrief, ontkoppelBrief } from '@/lib/swipe-actions'
import type { SwipeItemData } from '@/lib/builder-types'
import { Button } from '../ui'
import { Media } from '../swipe/Media'

/** Swipe-items die als referentie bij deze brief horen. */
export function ReferentieAds({ briefId, ads, keuzes }: { briefId: string; ads: SwipeItemData[]; keuzes: { id: string; titel: string; merk: string | null }[] }) {
  const router = useRouter()
  const [keuze, setKeuze] = useState('')
  const [pending, startTransition] = useTransition()
  const actie = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  const beschikbaar = keuzes.filter((k) => !ads.some((a) => a.id === k.id))

  return (
    <section className="space-y-3">
      <h2 className="flex items-baseline gap-2 border-b border-zinc-200 pb-2 text-base font-semibold dark:border-zinc-800">
        <Bookmark className="size-4 self-center text-zinc-400" /> Referentie-ads
      </h2>
      {ads.length === 0 && <p className="text-sm text-zinc-500">Koppel ads uit je swipe file als voorbeeld voor de creator of editor.</p>}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ads.map((a) => (
          <div key={a.id} className="card group relative overflow-hidden">
            <Link href={`/swipe/${a.id}`}>
              <Media link={a.media_link} type={a.media_type} className="aspect-[4/5] w-full" />
              <p className="truncate px-2.5 py-2 text-sm font-medium">{a.titel}</p>
            </Link>
            <button
              aria-label="Ontkoppelen"
              onClick={() => actie(() => ontkoppelBrief(a.id, briefId))}
              className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-zinc-600 opacity-0 shadow group-hover:opacity-100 hover:text-red-600 dark:bg-zinc-900/90 dark:text-zinc-300"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      {beschikbaar.length > 0 ? (
        <div className="flex max-w-md gap-2">
          <select aria-label="Ad kiezen" className="input h-8 py-1 text-xs" value={keuze} onChange={(e) => setKeuze(e.target.value)}>
            <option value="">Ad uit swipe file kiezen…</option>
            {beschikbaar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.titel}
                {k.merk ? ` (${k.merk})` : ''}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!keuze}
            loading={pending}
            onClick={() =>
              actie(async () => {
                await koppelBrief(keuze, briefId)
                setKeuze('')
              })
            }
          >
            Koppelen
          </Button>
        </div>
      ) : (
        keuzes.length === 0 && (
          <Link href="/swipe/nieuw" className="text-sm text-accent-600 hover:underline">
            Voeg eerst een ad toe aan je swipe file →
          </Link>
        )
      )}
    </section>
  )
}
