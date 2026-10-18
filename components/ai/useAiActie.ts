'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AiEvent } from '@/lib/ai/events'
import type { ReviewStap } from '@/lib/builder-types'
import { wachtOpOpslaan } from '@/lib/use-server-state'

export type AiVerzoek =
  | { actie: 'onderzoek'; projectId: string }
  | { actie: 'angles'; projectId: string }
  | { actie: 'hooks'; projectId: string; angleId: string }
  | { actie: 'brief'; projectId: string; angleId: string; hookId: string; briefId?: string }
  | { actie: 'review'; projectId?: string; stap: ReviewStap; briefId?: string; croId?: string; swipeId?: string }
  | { actie: 'cro'; croId: string }
  | { actie: 'swipe'; swipeId: string; projectId?: string; screenshot?: boolean }

export interface AiStaat {
  bezig: boolean
  status: string | null
  tekst: string
  wachtTot: number | null
  verbruik: { input: number; output: number; vandaag: number } | null
  fout: { bericht: string; opnieuw: boolean } | null
}

const BEGIN: AiStaat = { bezig: false, status: null, tekst: '', wachtTot: null, verbruik: null, fout: null }

/** Start een AI-actie op de server en volgt de stream. Na afloop wordt de pagina ververst. */
export function useAiActie() {
  const [staat, setStaat] = useState<AiStaat>(BEGIN)
  const router = useRouter()
  const laatste = useRef<AiVerzoek | null>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const start = useCallback(
    async (verzoek: AiVerzoek): Promise<unknown | undefined> => {
      laatste.current = verzoek
      abort.current = new AbortController()
      setStaat({ ...BEGIN, bezig: true, status: 'Verbinden…' })
      // De AI leest uit de database: eerst net getypte wijzigingen opslaan.
      await wachtOpOpslaan()
      let resultaat: unknown
      let gelukt = false
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verzoek),
          signal: abort.current.signal,
        })
        if (res.status === 401) {
          setStaat((s) => ({ ...s, bezig: false, fout: { bericht: 'Je bent uitgelogd. Ververs de pagina en log opnieuw in.', opnieuw: false } }))
          return undefined
        }
        if (!res.ok || !res.body) throw new Error(`Server gaf status ${res.status}`)
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        let buffer = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += value
          const regels = buffer.split('\n')
          buffer = regels.pop() ?? ''
          for (const regel of regels) {
            if (!regel.trim()) continue
            const e = JSON.parse(regel) as AiEvent
            setStaat((s) => {
              switch (e.type) {
                case 'status':
                  return { ...s, status: e.bericht, wachtTot: null }
                case 'wacht':
                  return { ...s, wachtTot: Date.now() + e.seconden * 1000 }
                case 'reset':
                  return { ...s, tekst: '', wachtTot: null }
                case 'tekst':
                  return { ...s, tekst: s.tekst + e.tekst, wachtTot: null }
                case 'verbruik':
                  return { ...s, verbruik: { input: (s.verbruik?.input ?? 0) + e.input, output: (s.verbruik?.output ?? 0) + e.output, vandaag: e.vandaag } }
                case 'klaar':
                  return { ...s, bezig: false, status: null, wachtTot: null }
                case 'fout':
                  return { ...s, bezig: false, status: null, wachtTot: null, fout: { bericht: e.bericht, opnieuw: e.opnieuw } }
              }
            })
            if (e.type === 'klaar') {
              resultaat = e.resultaat
              gelukt = true
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError')
          setStaat((s) => ({ ...s, bezig: false, fout: { bericht: 'Geen verbinding met de app-server. Draait `npm run dev` nog?', opnieuw: true } }))
        return undefined
      }
      setStaat((s) => (s.bezig ? { ...s, bezig: false } : s))
      if (gelukt) router.refresh()
      return gelukt ? (resultaat ?? true) : undefined
    },
    [router],
  )

  const opnieuw = useCallback(() => (laatste.current ? start(laatste.current) : Promise.resolve(undefined)), [start])
  const stop = useCallback(() => abort.current?.abort(), [])
  const sluit = useCallback(() => setStaat(BEGIN), [])

  return { staat, start, opnieuw, stop, sluit }
}
