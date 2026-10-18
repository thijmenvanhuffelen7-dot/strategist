'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History } from 'lucide-react'
import { herstelVersie } from '@/lib/builder-actions'
import type { AiVersie } from '@/lib/builder-types'
import { Button } from '../ui'
import { useConfirm } from '../ConfirmDialog'

const fmt = (d: Date) => d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Lijst met eerdere AI-versies, met de mogelijkheid er één terug te zetten. */
export function Versies({ versies, uitleg }: { versies: AiVersie[]; uitleg: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const confirm = useConfirm()
  if (versies.length < 1) return null

  const terug = async (v: AiVersie) => {
    if (!(await confirm({ title: 'Deze versie terugzetten?', message: uitleg, confirmLabel: 'Terugzetten' }))) return
    startTransition(async () => {
      await herstelVersie(v.id)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <Button size="sm" variant="ghost" icon={<History className="size-3.5" />} onClick={() => setOpen((o) => !o)} loading={pending}>
        Versies ({versies.length})
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {versies.map((v, i) => (
              <li key={v.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="flex-1">
                  <span className="block font-medium text-zinc-700 dark:text-zinc-200">
                    {fmt(v.aangemaakt_op)} {i === 0 && <span className="font-normal text-zinc-400">(laatste)</span>}
                  </span>
                  <span className="text-zinc-400">
                    {v.model ?? 'onbekend model'} · {v.tokens.toLocaleString('nl-NL')} tokens
                  </span>
                </span>
                <Button size="sm" onClick={() => terug(v)}>
                  Terugzetten
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
