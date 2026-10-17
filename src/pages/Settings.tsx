import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Upload, HardDrive, Copy, ClipboardPaste } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../lib/profile'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { PLATFORMS, TALEN } from '../lib/types'
import { db } from '../lib/db'
import { Button, ErrorBox, PageHeader } from '../components/ui'
import { useConfirm } from '../components/ConfirmDialog'

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

const IS_ARTIFACT = import.meta.env.MODE === 'artifact'

function Backup() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')

  const backupJson = async () =>
    JSON.stringify({ app: 'strategist-os', versie: 1, gemaakt_op: new Date().toISOString(), data: await db.exportAll() })

  const download = async () => {
    const blob = new Blob([await backupJson()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `strategist-os-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const copy = async () => {
    setError(null)
    // De tekst eerst ophalen en daarna direct kopiëren, binnen dezelfde klik.
    const json = await backupJson()
    try {
      await navigator.clipboard.writeText(json)
      setMsg('Back-up gekopieerd. Plak hem in een notitie of tekstbestand om te bewaren.')
    } catch {
      setPasted(json)
      setPasteOpen(true)
      setMsg('Kopiëren werd geblokkeerd. Selecteer de tekst hieronder en kopieer hem zelf.')
    }
  }

  const restore = async (text: string) => {
    setError(null)
    setMsg(null)
    try {
      const parsed = JSON.parse(text)
      if (parsed?.app !== 'strategist-os' || typeof parsed.data !== 'object') throw new Error('Dit is geen geldige Strategist OS-back-up.')
      const ok = await confirm({
        title: 'Back-up terugzetten?',
        message: 'Alle huidige data in deze browser wordt vervangen door de back-up.',
        confirmLabel: 'Terugzetten',
        danger: true,
      })
      if (!ok) return
      setBusy(true)
      await db.importAll(parsed.data)
      await qc.invalidateQueries()
      setPasted('')
      setPasteOpen(false)
      setMsg('Back-up teruggezet.')
    } catch (e) {
      setError(e instanceof SyntaxError ? new Error('De tekst is geen geldige back-up (ongeldige JSON).') : e)
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
        je naar een ander apparaat, maak dan eerst een back-up en zet die daar terug.
      </p>
      <div className="flex flex-wrap gap-2">
        {!IS_ARTIFACT && (
          <Button icon={<Download className="size-4" />} onClick={download}>
            Back-up downloaden
          </Button>
        )}
        <Button icon={<Copy className="size-4" />} onClick={copy}>
          Back-up kopiëren
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json,.txt" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) await restore(await f.text())
        }} />
        <Button icon={<Upload className="size-4" />} loading={busy} onClick={() => fileRef.current?.click()}>
          Terugzetten uit bestand
        </Button>
        <Button icon={<ClipboardPaste className="size-4" />} onClick={() => setPasteOpen((v) => !v)}>
          Terugzetten uit tekst
        </Button>
      </div>
      {pasteOpen && (
        <div className="space-y-2">
          <textarea
            id="backup-tekst"
            className="input min-h-32 font-mono text-xs"
            placeholder="Plak hier je back-up…"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
          <Button variant="primary" size="sm" disabled={!pasted.trim()} loading={busy} onClick={() => restore(pasted)}>
            Deze back-up terugzetten
          </Button>
        </div>
      )}
      {msg && <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {error != null && <ErrorBox error={error} />}
    </div>
  )
}
