import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'sos-theme'

const ThemeContext = createContext<{ theme: ThemeChoice; setTheme: (t: ThemeChoice) => void } | null>(null)

function readStored(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    // localStorage niet beschikbaar
  }
  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(readStored)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const root = document.documentElement
    const apply = () => {
      const host = root.getAttribute('data-theme')
      const systemDark = host ? host === 'dark' : mq.matches
      root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemDark))
    }
    apply()
    mq.addEventListener('change', apply)
    const obs = new MutationObserver(apply)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq.removeEventListener('change', apply)
      obs.disconnect()
    }
  }, [theme])

  const setTheme = (t: ThemeChoice) => {
    setThemeState(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      // negeren
    }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme buiten ThemeProvider')
  return ctx
}
