'use client'
import { Star } from 'lucide-react'

export function Sterren({ waarde, onChange, klein }: { waarde: number | null; onChange?: (n: number | null) => void; klein?: boolean }) {
  const maat = klein ? 'size-3' : 'size-4'
  return (
    <span className="inline-flex items-center" aria-label={`Beoordeling ${waarde ?? 0} van 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const aan = (waarde ?? 0) >= n
        const ster = <Star className={`${maat} ${aan ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(waarde === n ? null : n)} aria-label={`${n} ster${n > 1 ? 'ren' : ''}`} className="p-0.5">
            {ster}
          </button>
        ) : (
          <span key={n}>{ster}</span>
        )
      })}
    </span>
  )
}
