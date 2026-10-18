'use client'
import { useState, useTransition } from 'react'
import { HardDrive } from 'lucide-react'
import { saveProfiel } from '@/lib/actions'
import { setTheme, useTheme, type ThemeChoice } from '@/lib/theme'
import { PLATFORMS, TALEN } from '@/lib/types'
import { Button, ErrorBox } from './ui'

type Values = { naam: string; standaard_taal: string; standaard_platform: string }

export function SettingsForm({ initial }: { initial: Values }) {
  const [values, setValues] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [pending, startTransition] = useTransition()
  const theme = useTheme()

  const save = () =>
    startTransition(async () => {
      setError(null)
      try {
        await saveProfiel(values)
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch (e) {
        setError(e)
      }
    })

  return (
    <div className="max-w-xl space-y-6">
      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold">Profiel</h2>
        <div>
          <label className="label" htmlFor="naam">Naam</label>
          <input id="naam" className="input" value={values.naam} onChange={(e) => setValues({ ...values, naam: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="taal">Standaardtaal ads</label>
            <select id="taal" className="input" value={values.standaard_taal} onChange={(e) => setValues({ ...values, standaard_taal: e.target.value })}>
              {TALEN.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="platform">Standaardplatform</label>
            <select id="platform" className="input" value={values.standaard_platform} onChange={(e) => setValues({ ...values, standaard_platform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        {error != null && <ErrorBox error={error} />}
        <div className="flex items-center gap-3">
          <Button variant="primary" loading={pending} onClick={save}>
            Opslaan
          </Button>
          {saved && <span className="text-sm text-emerald-600">Opgeslagen</span>}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold">Weergave</h2>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as ThemeChoice[]).map((t) => (
            <Button key={t} variant={theme === t ? 'primary' : 'secondary'} onClick={() => setTheme(t)}>
              {{ light: 'Licht', dark: 'Donker', system: 'Systeem' }[t]}
            </Button>
          ))}
        </div>
      </div>

      <div className="card space-y-2 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HardDrive className="size-4 text-zinc-400" /> Opslag
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Al je data staat in één bestand op je computer: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">prisma/strategist.db</code>.
          Uploads komen in de map <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">uploads/</code>. Kopieer die twee om een back-up te maken.
        </p>
      </div>
    </div>
  )
}
