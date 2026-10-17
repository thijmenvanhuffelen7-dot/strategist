import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useProfile, useUpdateProfile } from '../lib/profile'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { PLATFORMS, TALEN } from '../lib/types'
import { Button, ErrorBox, PageHeader } from '../components/ui'

export function Settings() {
  const { user, signOut } = useAuth()
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
      <PageHeader title="Instellingen" description="Drempelwaarden, tag-lijsten, AI-prompts en data-export volgen in fase 5." />
      <div className="max-w-xl space-y-6">
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold">Profiel</h2>
          <div>
            <label className="label">E-mailadres</label>
            <input className="input opacity-70" value={user?.email ?? ''} disabled />
          </div>
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

        <Button variant="danger" onClick={signOut}>
          Uitloggen
        </Button>
      </div>
    </>
  )
}
