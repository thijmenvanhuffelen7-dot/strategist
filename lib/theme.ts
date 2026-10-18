'use client'
import { useEffect, useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'sos-theme'
const listeners = new Set<() => void>()

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    // localStorage niet beschikbaar
  }
  return 'system'
}

function apply(theme: ThemeChoice) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(theme: ThemeChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // negeren
  }
  apply(theme)
  listeners.forEach((l) => l())
}

/** Huidige themakeuze; op de server altijd 'system' (de echte waarde wordt na het laden ingevuld). */
export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => 'system',
  )
}

/** Volgt de systeeminstelling als het thema op 'system' staat. Eén keer gebruiken, in de layout. */
export function useSystemThemeSync() {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply(read())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
}

/** Inline script dat vóór het tekenen van de pagina het juiste thema zet (voorkomt een witte flits). */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`
