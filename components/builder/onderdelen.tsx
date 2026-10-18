'use client'
import { useState, type ReactNode } from 'react'
import { Star, Trash2, Check, Copy, Plus } from 'lucide-react'

export function SterKnop({ aan, onClick, label = 'Ster' }: { aan: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={aan ? `${label} verwijderen` : label}
      aria-label={label}
      aria-pressed={aan}
      className={`rounded p-1 transition-colors ${aan ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-500 dark:text-zinc-600'}`}
    >
      <Star className="size-4" fill={aan ? 'currentColor' : 'none'} />
    </button>
  )
}

export function VerwijderKnop({ onClick, label = 'Verwijderen' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="rounded p-1 text-zinc-300 transition-colors hover:text-red-500 dark:text-zinc-600">
      <Trash2 className="size-4" />
    </button>
  )
}

/** Tekst die bij een klik naar het klembord wordt gekopieerd. */
export function KopieerChip({ tekst, children, className = '' }: { tekst: string; children?: ReactNode; className?: string }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(tekst)
          setGekopieerd(true)
          setTimeout(() => setGekopieerd(false), 1200)
        } catch {
          // klembord niet beschikbaar
        }
      }}
      title="Klik om te kopiëren"
      className={`group inline-flex items-start gap-1.5 text-left transition-colors ${className}`}
    >
      <span className="flex-1">{children ?? tekst}</span>
      {gekopieerd ? <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" /> : <Copy className="mt-0.5 size-3 shrink-0 opacity-0 group-hover:opacity-60" />}
    </button>
  )
}

export function Kaart({ titel, aantal, uitleg, acties, children }: { titel: string; aantal?: number; uitleg?: string; acties?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">
            {titel} {aantal != null && <span className="font-normal text-zinc-400">({aantal})</span>}
          </h3>
          {uitleg && <p className="mt-0.5 text-xs text-zinc-500">{uitleg}</p>}
        </div>
        {acties}
      </div>
      {children}
    </section>
  )
}

/** Klein invoerveld met "+"-knop om een item toe te voegen. */
export function ToevoegVeld({ placeholder, onToevoegen }: { placeholder: string; onToevoegen: (tekst: string) => void }) {
  const [tekst, setTekst] = useState('')
  const voegToe = () => {
    if (!tekst.trim()) return
    onToevoegen(tekst.trim())
    setTekst('')
  }
  return (
    <div className="mt-2 flex gap-1.5">
      <input
        className="input h-8 py-1 text-xs"
        placeholder={placeholder}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && voegToe()}
      />
      <button onClick={voegToe} disabled={!tekst.trim()} className="rounded-md border border-zinc-200 px-2 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-800" aria-label="Toevoegen">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export const nieuwId = () => crypto.randomUUID()
