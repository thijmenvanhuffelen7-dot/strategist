'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, X, Clipboard } from 'lucide-react'
import { verwijderCroScreenshot, voegCroScreenshotToe, zetCroScreenshotLabel } from '@/lib/cro-actions'
import { MAX_CRO_SCREENSHOTS, SCREENSHOT_LABELS } from '@/lib/builder-types'
import { controleerBestand } from '@/lib/media'
import { uploadBestand } from '../swipe/upload'
import { isTypingTarget } from '@/lib/shortcuts'

export interface ScreenshotWeergave {
  ref: string
  type: string
  label: string
  link: string | null
}

/** Screenshots bij een CRO-check: slepen, kiezen of plakken (Ctrl/Cmd+V). */
export function CroScreenshots({ croId, screenshots, blob }: { croId: string; screenshots: ScreenshotWeergave[]; blob: boolean }) {
  const router = useRouter()
  const invoer = useRef<HTMLInputElement>(null)
  const [bezig, setBezig] = useState<number | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [groot, setGroot] = useState<string | null>(null)
  const vol = screenshots.length >= MAX_CRO_SCREENSHOTS

  const standaardLabel = () => {
    const gebruikt = screenshots.map((s) => s.label)
    return !gebruikt.includes('desktop') ? 'desktop' : !gebruikt.includes('mobiel') ? 'mobiel' : 'overig'
  }

  const voegToe = async (bestanden: File[]) => {
    setFout(null)
    const afbeeldingen = bestanden.filter((f) => f.type.startsWith('image/'))
    if (!afbeeldingen.length) return setFout('Alleen afbeeldingen (png, jpg, webp, gif).')
    const ruimte = MAX_CRO_SCREENSHOTS - screenshots.length
    if (ruimte <= 0) return setFout(`Maximaal ${MAX_CRO_SCREENSHOTS} screenshots. Verwijder er eerst één.`)
    let label = standaardLabel()
    try {
      for (const f of afbeeldingen.slice(0, ruimte)) {
        const ongeldig = controleerBestand(f.type, f.size)
        if (ongeldig) throw new Error(ongeldig)
        setBezig(0)
        const bestand = f.name ? f : new File([f], `screenshot-${Date.now()}.png`, { type: f.type })
        const res = await uploadBestand(bestand, blob, setBezig, 'cro')
        await voegCroScreenshotToe(croId, res.ref, res.type, label)
        label = label === 'desktop' ? 'mobiel' : 'overig'
      }
      router.refresh()
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setBezig(null)
      if (invoer.current) invoer.current.value = ''
    }
  }

  // Plakken met Ctrl/Cmd+V, behalve als je in een tekstvak typt.
  const voegToeRef = useRef(voegToe)
  useEffect(() => {
    voegToeRef.current = voegToe
  })
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target)) return
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      void voegToeRef.current(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  return (
    <section className="card mb-5 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium">Screenshots</h2>
        <span className="text-xs text-zinc-500">
          {screenshots.length}/{MAX_CRO_SCREENSHOTS} · laat de AI ook het ontwerp beoordelen
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400">
          <Clipboard className="size-3" /> Plakken met <span className="kbd">Ctrl</span>+<span className="kbd">V</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {screenshots.map((s) => (
          <figure key={s.ref} className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={() => setGroot(s.link)} className="block w-full" aria-label={`Screenshot ${s.label} vergroten`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- privé-media via ondertekende links */}
              <img src={s.link ?? ''} alt={`Screenshot ${s.label}`} className="aspect-[4/5] w-full bg-zinc-100 object-cover object-top dark:bg-zinc-800" />
            </button>
            <figcaption className="flex items-center gap-1 border-t border-zinc-200 p-1.5 dark:border-zinc-800">
              <select
                aria-label="Soort screenshot"
                className="w-full rounded bg-transparent px-1 py-0.5 text-xs"
                defaultValue={s.label}
                onChange={async (e) => {
                  await zetCroScreenshotLabel(croId, s.ref, e.target.value)
                  router.refresh()
                }}
              >
                {SCREENSHOT_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </figcaption>
            <button
              type="button"
              aria-label="Screenshot verwijderen"
              onClick={async () => {
                await verwijderCroScreenshot(croId, s.ref)
                router.refresh()
              }}
              className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-zinc-600 shadow hover:text-red-600 dark:bg-zinc-900/90 dark:text-zinc-300"
            >
              <X className="size-3.5" />
            </button>
          </figure>
        ))}
        {!vol && (
          <button
            type="button"
            onClick={() => invoer.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              void voegToe([...e.dataTransfer.files])
            }}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 p-3 text-center text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <ImagePlus className="size-5" />
            {bezig !== null ? `Uploaden… ${bezig}%` : 'Sleep, klik of plak een screenshot'}
          </button>
        )}
      </div>
      <input ref={invoer} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={(e) => voegToe([...(e.target.files ?? [])])} />
      {fout && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fout}</p>}
      {screenshots.length > 0 && <p className="mt-2 text-xs text-zinc-500">Nieuwe of andere screenshots? Klik daarna op “Opnieuw beoordelen”.</p>}

      {groot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setGroot(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- privé-media via ondertekende links */}
          <img src={groot} alt="Screenshot vergroot" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </section>
  )
}
