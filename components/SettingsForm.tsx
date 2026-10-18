'use client'
import { useState, useTransition } from 'react'
import { HardDrive, Sparkles } from 'lucide-react'
import { saveProfiel } from '@/lib/actions'
import { bewaarAiModel } from '@/lib/builder-actions'
import { setTheme, useTheme, type ThemeChoice } from '@/lib/theme'
import { PLATFORMS, TALEN } from '@/lib/types'
import { Button, ErrorBox } from './ui'

type Values = { naam: string; standaard_taal: string; standaard_platform: string }
type AiInstellingen = { provider: string; ingesteld: boolean; modellen: { id: string; label: string }[]; gekozen: string; standaard: string }

export function SettingsForm({ initial, ai }: { initial: Values; ai: AiInstellingen }) {
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

      <AiKeuze ai={ai} />

      <div className="card space-y-2 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HardDrive className="size-4 text-zinc-400" /> Opslag
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Je data staat in je eigen Postgres-database (Neon, gekoppeld via Vercel → Storage). Neon maakt zelf back-ups; een export van al je data
          (JSON/CSV) komt in een latere fase.
        </p>
      </div>
    </div>
  )
}

function AiKeuze({ ai }: { ai: AiInstellingen }) {
  const bekend = ai.modellen.some((m) => m.id === ai.gekozen)
  const [keuze, setKeuze] = useState(ai.gekozen === '' ? '' : bekend ? ai.gekozen : 'eigen')
  const [eigen, setEigen] = useState(bekend ? '' : ai.gekozen)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const opslaan = () =>
    startTransition(async () => {
      await bewaarAiModel(keuze === 'eigen' ? eigen : keuze)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  return (
    <div className="card space-y-3 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-zinc-400" /> AI
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Provider: {ai.provider} ·{' '}
        {ai.ingesteld ? (
          <span className="text-emerald-600">API-key gevonden</span>
        ) : (
          <span className="text-amber-600">geen API-key: zet GROQ_API_KEY in .env.local en herstart de app</span>
        )}
      </p>
      <div>
        <label className="label" htmlFor="ai-model">Model</label>
        <select id="ai-model" className="input" value={keuze} onChange={(e) => setKeuze(e.target.value)}>
          <option value="">Standaard ({ai.standaard})</option>
          {ai.modellen.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
          <option value="eigen">Ander model-ID…</option>
        </select>
      </div>
      {keuze === 'eigen' && (
        <div>
          <label className="label" htmlFor="ai-model-eigen">Model-ID (zie console.groq.com/docs/models)</label>
          <input id="ai-model-eigen" className="input font-mono text-xs" value={eigen} onChange={(e) => setEigen(e.target.value)} placeholder="bijv. openai/gpt-oss-120b" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button variant="primary" loading={pending} onClick={opslaan} disabled={keuze === 'eigen' && !eigen.trim()}>
          Model opslaan
        </Button>
        {saved && <span className="text-sm text-emerald-600">Opgeslagen</span>}
      </div>
    </div>
  )
}
