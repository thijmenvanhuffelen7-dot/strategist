'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, FolderKanban, Search } from 'lucide-react'
import { searchProjects } from '@/lib/actions'

type Result = Awaited<ReturnType<typeof searchProjects>>[number]

/** Globale zoekfunctie (sneltoets "/"). Zoekt in projecten en de swipe file. */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => inputRef.current?.focus(), [])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      const r = await searchProjects(q)
      if (!cancelled) {
        setResults(r)
        setActive(0)
      }
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q])

  const go = (r: Result | undefined) => {
    if (!r) return
    router.push(r.href)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[15vh]" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Search className="size-4 text-zinc-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') go(results[active])
            }}
            placeholder="Zoek in projecten, klantdata, swipe file…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
          <span className="kbd">Esc</span>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-500">Geen resultaten</li>}
          {results.map((r, i) => (
            <li key={`${r.soort}-${r.id}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left ${i === active ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
              >
                {r.soort === 'swipe' ? <Bookmark className="size-4 shrink-0 text-zinc-400" /> : <FolderKanban className="size-4 shrink-0 text-zinc-400" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.naam}</span>
                  {r.omschrijving && <span className="block truncate text-xs text-zinc-500">{r.omschrijving}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
