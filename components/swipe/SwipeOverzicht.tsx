'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, LayoutGrid, Plus, Rows3, Search, X } from 'lucide-react'
import { TAG_VELDEN, type SwipeItemData } from '@/lib/builder-types'
import { kortDatum } from '@/lib/datum'
import { useNewShortcut } from '@/lib/shortcuts'
import { Button, EmptyState, Pill } from '../ui'
import { Media } from './Media'
import { Sterren } from './Sterren'

type Sortering = 'nieuw' | 'oud' | 'beoordeling'
type TagKey = (typeof TAG_VELDEN)[number]['key']

/** Alle doorzoekbare tekst van een item. */
function zoektekst(i: SwipeItemData) {
  return [i.titel, i.merk, i.platform, i.transcript, i.notities, ...Object.values(i.tags), i.analyse ? JSON.stringify(i.analyse) : ''].join(' ').toLowerCase()
}

export function SwipeOverzicht({ items }: { items: SwipeItemData[] }) {
  const router = useRouter()
  useNewShortcut(() => router.push('/swipe/nieuw'))
  const [q, setQ] = useState('')
  const [weergave, setWeergave] = useState<'grid' | 'tabel'>('grid')
  const [sortering, setSortering] = useState<Sortering>('nieuw')
  const [platform, setPlatform] = useState('')
  const [minSterren, setMinSterren] = useState(0)
  const [tagFilter, setTagFilter] = useState<Partial<Record<TagKey, string>>>({})

  // Filteropties: alleen waarden die echt voorkomen.
  const opties = useMemo(() => {
    const o: Record<string, string[]> = { platform: [...new Set(items.map((i) => i.platform).filter(Boolean) as string[])].sort() }
    for (const { key } of TAG_VELDEN) o[key] = [...new Set(items.map((i) => i.tags[key]).filter(Boolean) as string[])].sort()
    return o
  }, [items])

  const zichtbaar = useMemo(() => {
    const n = q.trim().toLowerCase()
    return items
      .filter((i) => !n || zoektekst(i).includes(n))
      .filter((i) => !platform || i.platform === platform)
      .filter((i) => (i.beoordeling ?? 0) >= minSterren)
      .filter((i) => TAG_VELDEN.every(({ key }) => !tagFilter[key] || i.tags[key] === tagFilter[key]))
      .sort((a, b) =>
        sortering === 'beoordeling'
          ? (b.beoordeling ?? 0) - (a.beoordeling ?? 0) || +b.aangemaakt_op - +a.aangemaakt_op
          : sortering === 'oud'
            ? +a.aangemaakt_op - +b.aangemaakt_op
            : +b.aangemaakt_op - +a.aangemaakt_op,
      )
  }, [items, q, platform, minSterren, tagFilter, sortering])

  const filtersActief = Boolean(q || platform || minSterren || Object.values(tagFilter).some(Boolean))
  const wis = () => {
    setQ('')
    setPlatform('')
    setMinSterren(0)
    setTagFilter({})
  }

  if (items.length === 0)
    return (
      <EmptyState
        icon={<Bookmark />}
        title="Je swipe file is nog leeg"
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => router.push('/swipe/nieuw')}>
            Ad toevoegen
          </Button>
        }
      >
        Bewaar ads die je inspireren: met screenshot of video, transcript en tags. Laat de AI uitleggen waarom ze werken en hoe je ze toepast op je eigen projecten.
      </EmptyState>
    )

  const select = (waarde: string, onChange: (v: string) => void, label: string, lijst: string[]) => (
    <select key={label} aria-label={label} className="input h-8 w-auto py-1 text-xs" value={waarde} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}: alle</option>
      {lijst.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input id="swipe-zoek" className="input pl-9" placeholder="Zoek in titel, transcript, notities, analyse…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label="Sorteren" className="input h-9 w-auto text-sm" value={sortering} onChange={(e) => setSortering(e.target.value as Sortering)}>
            <option value="nieuw">Nieuwste eerst</option>
            <option value="oud">Oudste eerst</option>
            <option value="beoordeling">Hoogste beoordeling</option>
          </select>
          <div className="flex rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800">
            {(
              [
                ['grid', LayoutGrid, 'Grid'],
                ['tabel', Rows3, 'Tabel'],
              ] as const
            ).map(([w, Icon, label]) => (
              <button key={w} onClick={() => setWeergave(w)} aria-label={label} title={label} className={`rounded p-1.5 ${weergave === w ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}>
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {select(platform, setPlatform, 'Platform', opties.platform)}
          {TAG_VELDEN.map(({ key, label }) => select(tagFilter[key] ?? '', (v) => setTagFilter((f) => ({ ...f, [key]: v })), label, opties[key]))}
          <select aria-label="Minimale beoordeling" className="input h-8 w-auto py-1 text-xs" value={minSterren} onChange={(e) => setMinSterren(Number(e.target.value))}>
            <option value={0}>Beoordeling: alle</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}+ sterren
              </option>
            ))}
          </select>
          {filtersActief && (
            <button onClick={wis} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              <X className="size-3" /> Filters wissen
            </button>
          )}
          <span className="ml-auto text-xs text-zinc-500">
            {zichtbaar.length} van {items.length}
          </span>
        </div>
      </div>

      {zichtbaar.length === 0 && <p className="text-sm text-zinc-500">Niets gevonden met deze filters.</p>}

      {weergave === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {zichtbaar.map((i) => (
            <Link key={i.id} href={`/swipe/${i.id}`} className="card group flex flex-col overflow-hidden transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <Media link={i.media_link} type={i.media_type} className="aspect-[4/5] w-full" />
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-medium group-hover:text-accent-600 dark:group-hover:text-accent-500">{i.titel}</h3>
                  {i.analyse && <span title="Geanalyseerd" className="mt-1 size-2 shrink-0 rounded-full bg-accent-500" />}
                </div>
                <p className="text-xs text-zinc-500">
                  {[i.merk, i.platform].filter(Boolean).join(' · ') || '—'}
                </p>
                <Sterren waarde={i.beoordeling} klein />
                <div className="mt-auto flex flex-wrap gap-1 pt-1">
                  {TAG_VELDEN.map(({ key }) => i.tags[key] && <Pill key={key}>{i.tags[key]}</Pill>)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Titel</th>
                <th className="px-3 py-2">Merk</th>
                <th className="px-3 py-2">Platform</th>
                {TAG_VELDEN.map(({ key, label }) => (
                  <th key={key} className="px-3 py-2 whitespace-nowrap">
                    {label}
                  </th>
                ))}
                <th className="px-3 py-2">Beoordeling</th>
                <th className="px-3 py-2">Toegevoegd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {zichtbaar.map((i) => (
                <tr key={i.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40" onClick={() => router.push(`/swipe/${i.id}`)}>
                  <td className="max-w-64 truncate px-3 py-2 font-medium">
                    <Link href={`/swipe/${i.id}`} onClick={(e) => e.stopPropagation()}>
                      {i.titel}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{i.merk ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{i.platform ?? '—'}</td>
                  {TAG_VELDEN.map(({ key }) => (
                    <td key={key} className="px-3 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {i.tags[key] ?? '—'}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <Sterren waarde={i.beoordeling} klein />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-zinc-500">{kortDatum(i.aangemaakt_op)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
