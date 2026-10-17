import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui'

type Mode = 'login' | 'register' | 'reset'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        if (error) throw error
        if (!data.session) setInfo('Check je inbox en klik op de bevestigingslink om je account te activeren.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setInfo('Als dit e-mailadres bekend is, ontvang je een link om een nieuw wachtwoord in te stellen.')
      }
    } catch (err) {
      setError(vertaalFout(err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = { login: 'Inloggen', register: 'Account aanmaken', reset: 'Wachtwoord vergeten' }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent-600 text-sm font-bold text-white">S</div>
          <span className="text-lg font-semibold tracking-tight">Strategist OS</span>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6 shadow-sm">
          <h1 className="text-base font-semibold">{titles[mode]}</h1>
          <div>
            <label className="label" htmlFor="email">E-mailadres</label>
            <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== 'reset' && (
            <div>
              <label className="label" htmlFor="password">Wachtwoord</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {info && <p className="text-sm text-emerald-700 dark:text-emerald-400">{info}</p>}
          <Button type="submit" variant="primary" loading={busy} className="w-full">
            {mode === 'login' ? 'Inloggen' : mode === 'register' ? 'Account aanmaken' : 'Stuur resetlink'}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-zinc-500">
          {mode === 'login' ? (
            <>
              <button className="hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => setMode('register')}>Account aanmaken</button>
              <button className="hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => setMode('reset')}>Wachtwoord vergeten?</button>
            </>
          ) : (
            <button className="hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => setMode('login')}>← Terug naar inloggen</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function NewPasswordPage({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(vertaalFout(error.message))
    else onDone()
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6 shadow-sm">
        <h1 className="text-base font-semibold">Nieuw wachtwoord instellen</h1>
        <input type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nieuw wachtwoord" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="primary" loading={busy} className="w-full">Opslaan</Button>
      </form>
    </div>
  )
}

function vertaalFout(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Onjuist e-mailadres of wachtwoord.'
  if (/email not confirmed/i.test(msg)) return 'Bevestig eerst je e-mailadres via de link in je inbox.'
  if (/already registered/i.test(msg)) return 'Er bestaat al een account met dit e-mailadres.'
  if (/at least 6 characters/i.test(msg)) return 'Het wachtwoord moet minimaal 6 tekens zijn.'
  if (/rate limit/i.test(msg)) return 'Te veel pogingen. Wacht even en probeer het opnieuw.'
  return msg
}
