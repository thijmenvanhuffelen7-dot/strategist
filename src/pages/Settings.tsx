import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Upload, HardDrive } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../lib/profile'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { PLATFORMS, TALEN } from '../lib/types'
import { db } from '../lib/db'
import { Button, ErrorBox, PageHeader } from '../components/ui'

export function Settings() {
  const { data: profile } = useProfile()
  const update = useUpdateProfile()
  const { theme, setTheme } = useTheme()
  const [naam, setNaam] = useState('')
  const [taal, setTaal] = useState('Nederlands')
  const [platform, setPlatform] = useState('Meta')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setNaam(profile.naam ?? '')
    setTaal(profile.standaard_taal)
    setPlatform(profile.standaard_platform)
  }, [profile])

  const save = async () => {
    await update.mutateAsync({ naam, standaard_taal: taal, standaard_platform: platform })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <>
      <PageHeader title="Instellingen" description="Drempelwaarden, tag-lijsten en AI-prompts volgen in fase 5." />
      <div className="max-w-xl space-y-6">
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Profiel</h2>
          <div>
            <label className="label">Naam</label>
            <input className="input" value={naam} onChange={(e) => setNaam(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Standaardtaal ads</label>
              <select className="input" value={taal} onChange={(e) => setTaal(e.target.value)}>
                {TALEN.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Standaardplatform</label>
              <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          {update.error && <ErrorBox error={update.error} />}
          <div className="flex items-center gap-3">
            <Button variant="primary" loading={update.isPending} onClick={save}>
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

        <Backup />
      </div>
    </>
  )
}

function Backup() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)

  const download = async () => {
    const data = await db.exportAll()
    const blob = new Blob([JSON.stringify({ app: 'strategist-os', versie: 1, gemaakt_op: new Date().toISOString(), data }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `strategist-os-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const restore = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setMsg(null)
    try {
      const parsed = JSON.parse(await file.text())
      if (parsed?.app !== 'strategist-os' || typeof parsed.data !== 'object') throw new Error('Dit is geen geldig Strategist OS-back-upbestand.')
      if (!confirm('Back-up terugzetten? Alle huidige data in deze browser wordt vervangen.')) return
      setBusy(true)
      await db.importAll(parsed.data)
      await qc.invalidateQueries()
      setMsg('Back-up teruggezet.')
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="card space-y-3 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <HardDrive className="size-4 text-zinc-400" /> Opslag en back-up
      </h2>
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Al je data staat lokaal in deze browser, op dit apparaat. Er is geen account en niets gaat naar een server. Wis je je browserdata of wil
        je naar een ander apparaat, download dan eerst een back-up en zet die daar terug.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button icon={<Download className="size-4" />} onClick={download}>
          Back-up downloaden
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        <Button icon={<Upload className="size-4" />} loading={busy} onClick={() => fileRef.current?.click()}>
          Back-up terugzetten
        </Button>
      </div>
      {msg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {error != null && <ErrorBox error={error} />}
    </div>
  )
}
