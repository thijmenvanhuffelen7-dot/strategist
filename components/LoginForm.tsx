'use client'
import { useActionState } from 'react'
import { login } from '@/lib/auth-actions'
import { Button } from './ui'

export function LoginForm({ terug, wachtwoordIngesteld }: { terug: string; wachtwoordIngesteld: boolean }) {
  const [staat, actie, bezig] = useActionState(login, null)
  return (
    <form action={actie} className="card space-y-4 p-6 shadow-sm">
      <h1 className="text-base font-semibold">Inloggen</h1>
      {!wachtwoordIngesteld && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          Er is nog geen wachtwoord ingesteld. Zet <code>APP_WACHTWOORD</code> in Vercel → Settings → Environment Variables en deploy opnieuw.
        </p>
      )}
      <input type="hidden" name="terug" value={terug} />
      <div>
        <label className="label" htmlFor="wachtwoord">
          Wachtwoord
        </label>
        <input id="wachtwoord" name="wachtwoord" type="password" required autoFocus autoComplete="current-password" className="input" />
      </div>
      {staat?.fout && <p className="text-sm text-red-600 dark:text-red-400">{staat.fout}</p>}
      <Button type="submit" variant="primary" loading={bezig} className="w-full">
        Inloggen
      </Button>
    </form>
  )
}
