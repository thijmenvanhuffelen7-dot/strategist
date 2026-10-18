'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lokale kopie van serverdata die je direct kunt bewerken.
 * Verandert de serverversie (bijv. na een AI-actie), dan wordt de lokale kopie vervangen.
 * Geef bij voorkeur een `serverVersie` mee (zoals bijgewerkt_op); anders telt de inhoud zelf als versie.
 */
export function useServerState<T>(serverWaarde: T, serverVersie?: string) {
  const versie = serverVersie ?? JSON.stringify(serverWaarde)
  const [state, setState] = useState(serverWaarde)
  const [gezien, setGezien] = useState(versie)
  if (gezien !== versie) {
    setGezien(versie)
    setState(serverWaarde)
  }
  return [state, setState] as const
}

// Alle openstaande en lopende opslagacties, zodat we kunnen wachten tot alles is opgeslagen (bijv. vóór een stapwissel).
const openstaand = new Set<() => void>()
const lopend = new Set<Promise<unknown>>()

function voerUit(p: Promise<unknown> | void) {
  if (!p) return
  lopend.add(p)
  void p.finally(() => lopend.delete(p))
}

/** Slaat openstaande wijzigingen direct op en wacht tot alle opslagacties klaar zijn. */
export async function wachtOpOpslaan() {
  openstaand.forEach((flush) => flush())
  await Promise.allSettled([...lopend])
}

/**
 * Roept `opslaan` aan na `ms` zonder nieuwe wijzigingen (automatisch opslaan tijdens typen).
 * Verlaat je de pagina eerder, dan wordt wat nog openstaat meteen opgeslagen.
 */
export function useUitgesteld<A extends unknown[]>(opslaan: (...args: A) => Promise<unknown> | void, ms = 600) {
  const open = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; flush: () => void }>())
  const fn = useRef(opslaan)
  useEffect(() => {
    fn.current = opslaan
  })
  useEffect(() => {
    const o = open.current
    return () => {
      o.forEach(({ flush }) => flush())
    }
  }, [])
  return useCallback(
    (sleutel: string, ...args: A) => {
      const o = open.current
      const bestaand = o.get(sleutel)
      if (bestaand) {
        clearTimeout(bestaand.timer)
        openstaand.delete(bestaand.flush)
      }
      const flush = () => {
        clearTimeout(timer)
        o.delete(sleutel)
        openstaand.delete(flush)
        voerUit(fn.current(...args))
      }
      const timer = setTimeout(flush, ms)
      o.set(sleutel, { timer, flush })
      openstaand.add(flush)
    },
    [ms],
  )
}

/** Voor directe opslagacties (zonder vertraging) die ook meetellen in wachtOpOpslaan. */
export function slaDirectOp<T>(p: Promise<T>): Promise<T> {
  voerUit(p)
  return p
}
