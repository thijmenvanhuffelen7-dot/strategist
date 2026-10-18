'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { maakSwipe, zetMedia } from '@/lib/swipe-actions'
import { Button, ErrorBox, PageHeader } from '../ui'
import { MediaUpload } from './MediaUpload'
import { Sterren } from './Sterren'
import { SwipeVelden, type SwipeWaarden } from './Velden'
import { uploadBestand } from './upload'

const LEEG: SwipeWaarden = { titel: '', merk: '', platform: '', url: '', transcript: '', notities: '', tags: {} }

export function NieuweSwipe({ blob }: { blob: boolean }) {
  const router = useRouter()
  const [v, setV] = useState(LEEG)
  const [beoordeling, setBeoordeling] = useState<number | null>(null)
  const [bestand, setBestand] = useState<File | null>(null)
  const [fout, setFout] = useState<unknown>(null)
  const [voortgang, setVoortgang] = useState<number | null>(null)
  const [bezig, startTransition] = useTransition()

  const opslaan = () =>
    startTransition(async () => {
      setFout(null)
      try {
        // Eerst uploaden (gaat dat mis, dan wordt er niets half opgeslagen).
        const media = bestand ? await uploadBestand(bestand, blob, setVoortgang) : null
        const id = await maakSwipe({ ...v, beoordeling })
        if (media) await zetMedia(id, media.ref, media.type)
        setV(LEEG)
        setBestand(null)
        router.push(`/swipe/${id}`)
      } catch (e) {
        setFout(e)
      } finally {
        setVoortgang(null)
      }
    })

  return (
    <div className="pb-16">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> Terug
      </button>
      <PageHeader title="Ad toevoegen" description="Na het opslaan kun je de AI laten analyseren waarom de ad werkt." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="space-y-3">
          <MediaUpload link={null} type={null} blob={blob} lokaalBestand={setBestand} />
          {voortgang !== null && <p className="text-xs text-zinc-500">Uploaden… {voortgang}%</p>}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            Beoordeling <Sterren waarde={beoordeling} onChange={setBeoordeling} />
          </div>
        </div>
        <div className="space-y-4">
          <SwipeVelden v={v} onChange={(p) => setV((s) => ({ ...s, ...p }))} />
          {fout != null && <ErrorBox error={fout} />}
          <div className="flex justify-end gap-2">
            <Button onClick={() => router.back()}>Annuleren</Button>
            <Button variant="primary" loading={bezig} disabled={!v.titel.trim()} onClick={opslaan}>
              Opslaan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
