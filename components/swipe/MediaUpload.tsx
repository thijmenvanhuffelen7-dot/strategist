'use client'
import { useRef, useState } from 'react'
import { Upload, Trash2 } from 'lucide-react'
import { Button } from '../ui'
import { Media } from './Media'
import { uploadBestand } from './upload'
import { controleerBestand } from '@/lib/media'

/** Kiezen/vervangen/verwijderen van een screenshot of video, met voortgang. */
export function MediaUpload({
  link,
  type,
  blob,
  onGeupload,
  onVerwijder,
  lokaalBestand,
}: {
  link: string | null
  type: string | null
  blob: boolean
  /** Na uploaden: verwijzing doorgeven. Zonder deze functie wordt alleen het bestand gekozen (zie lokaalBestand). */
  onGeupload?: (ref: string, type: string) => Promise<void>
  onVerwijder?: () => Promise<void>
  /** Voor het nieuw-formulier: het gekozen bestand terugmelden in plaats van direct uploaden. */
  lokaalBestand?: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [voortgang, setVoortgang] = useState<number | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [voorbeeld, setVoorbeeld] = useState<{ link: string; type: string } | null>(null)

  const kies = async (f: File | undefined) => {
    if (!f) return
    setFout(null)
    const ongeldig = controleerBestand(f.type, f.size)
    if (ongeldig) {
      setFout(ongeldig)
      if (ref.current) ref.current.value = ''
      return
    }
    if (lokaalBestand) {
      setVoorbeeld({ link: URL.createObjectURL(f), type: f.type })
      lokaalBestand(f)
      return
    }
    try {
      setVoortgang(0)
      const res = await uploadBestand(f, blob, setVoortgang)
      await onGeupload?.(res.ref, res.type)
    } catch (e) {
      setFout((e as Error).message)
    } finally {
      setVoortgang(null)
      if (ref.current) ref.current.value = ''
    }
  }

  const toon = voorbeeld ?? (link ? { link, type: type ?? '' } : null)
  return (
    <div>
      <div
        className="overflow-hidden rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void kies(e.dataTransfer.files[0])
        }}
      >
        {toon ? (
          <Media link={toon.link} type={toon.type} bediening className="max-h-[70vh] w-full" />
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="flex w-full flex-col items-center gap-2 px-4 py-10 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Upload className="size-6" />
            Sleep een screenshot of video hierheen, of klik om te kiezen
            <span className="text-xs text-zinc-400">png, jpg, webp, gif (max 15 MB) · mp4, mov, webm (max 100 MB)</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => kies(e.target.files?.[0])} />
      {voortgang !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-accent-600 transition-all" style={{ width: `${voortgang}%` }} />
        </div>
      )}
      {fout && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fout}</p>}
      {toon && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" icon={<Upload className="size-3.5" />} loading={voortgang !== null} onClick={() => ref.current?.click()}>
            Vervangen
          </Button>
          {(onVerwijder || lokaalBestand) && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="size-3.5" />}
              onClick={async () => {
                setVoorbeeld(null)
                lokaalBestand?.(null)
                await onVerwijder?.()
              }}
            >
              Verwijderen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
