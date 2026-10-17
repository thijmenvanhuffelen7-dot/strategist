import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Upload, ArrowLeft } from 'lucide-react'
import { emptyProject, useProject, useSaveProject } from '../../lib/projects'
import { useProfile } from '../../lib/profile'
import { DOELEN, PLATFORMS, TALEN, type Drempels, type ProjectInput } from '../../lib/types'
import { countEntries, fileToKlantdata } from '../../lib/klantdata'
import { Button, ErrorBox, PageHeader, Spinner } from '../../components/ui'

const DREMPEL_VELDEN: { key: keyof Drempels; label: string; suffix: string; hint: string }[] = [
  { key: 'hook_rate', label: 'Hook rate', suffix: '%', hint: 'minimaal' },
  { key: 'hold_rate', label: 'Hold rate', suffix: '%', hint: 'minimaal' },
  { key: 'ctr', label: 'CTR', suffix: '%', hint: 'minimaal' },
  { key: 'cpa', label: 'CPA', suffix: '€', hint: 'maximaal' },
  { key: 'roas', label: 'ROAS', suffix: 'x', hint: 'minimaal' },
]

export function ProjectForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const { data: existing, isLoading, error } = useProject(id)
  const { data: profile, isPending: profilePending } = useProfile()
  const save = useSaveProject()
  const [values, setValues] = useState<ProjectInput | null>(null)
  const [uploadInfo, setUploadInfo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Initialiseer het formulier zodra de data (of het profiel voor standaardwaarden) er is.
  useEffect(() => {
    if (values) return
    if (isNew) {
      if (!profilePending) setValues(emptyProject(profile?.standaard_taal, profile?.standaard_platform))
    } else if (existing) {
      const { id: _id, aangemaakt_op: _a, bijgewerkt_op: _b, ...rest } = existing
      setValues(rest)
    }
  }, [isNew, existing, profile, profilePending, values])

  if (!isNew && isLoading) return <Spinner />
  if (error) return <ErrorBox error={error} />
  if (!values) return <Spinner />

  const set = <K extends keyof ProjectInput>(key: K, v: ProjectInput[K]) => setValues((s) => (s ? { ...s, [key]: v } : s))

  const togglePlatform = (p: (typeof PLATFORMS)[number]) =>
    set('platforms', values.platforms.includes(p) ? values.platforms.filter((x) => x !== p) : [...values.platforms, p])

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return
    let added = 0
    let text = values.klantdata ?? ''
    for (const f of Array.from(files)) {
      const res = await fileToKlantdata(f)
      if (res.text) text = text.trim() ? `${text.trim()}\n\n${res.text}` : res.text
      added += res.count
    }
    set('klantdata', text)
    setUploadInfo(`${added} items toegevoegd uit ${files.length} bestand(en).`)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!values.naam.trim()) return
    const p = await save.mutateAsync({
      id,
      values: { ...values, concurrenten: values.concurrenten.filter((c) => c.naam.trim() || c.url.trim()) },
    })
    navigate(`/projecten/${p.id}`)
  }

  return (
    <div className="pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> Terug
      </button>
      <PageHeader title={isNew ? 'Nieuw project' : `${existing?.naam} bewerken`} />

      <div className="space-y-8">
        <Section title="Product" description="Wat verkoop je? De AI verzint geen productfeiten, dus hoe vollediger, hoe beter.">
          <Field label="Naam merk/product *">
            <input className="input" autoFocus={isNew} value={values.naam} onChange={(e) => set('naam', e.target.value)} placeholder="Bijv. Slaapwel – gewogen deken" />
          </Field>
          <Field label="Omschrijving (wat doet het product)">
            <textarea className="input min-h-24" value={values.omschrijving ?? ''} onChange={(e) => set('omschrijving', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prijs">
              <input className="input" value={values.prijs ?? ''} onChange={(e) => set('prijs', e.target.value)} placeholder="€129" />
            </Field>
            <Field label="Website-URL">
              <input className="input" type="url" value={values.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
            </Field>
          </div>
          <Field label="Landingspagina-tekst">
            <textarea
              className="input min-h-40 font-mono text-[13px] leading-relaxed"
              value={values.landingspagina_tekst ?? ''}
              onChange={(e) => set('landingspagina_tekst', e.target.value)}
              placeholder="Plak hier de tekst van de salespagina…"
            />
          </Field>
        </Section>

        <Section title="Campagne" description="Voor wie maak je ads, waar en met welk doel?">
          <Field label="Doelgroep">
            <textarea className="input min-h-20" value={values.doelgroep ?? ''} onChange={(e) => set('doelgroep', e.target.value)} />
          </Field>
          <Field label="Platforms">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = values.platforms.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      on
                        ? 'border-accent-600 bg-accent-600 text-white'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campagnedoel">
              <select className="input" value={values.doel ?? ''} onChange={(e) => set('doel', e.target.value as ProjectInput['doel'])}>
                {DOELEN.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Taal van de ads">
              <input className="input" list="talen" value={values.taal} onChange={(e) => set('taal', e.target.value)} />
              <datalist id="talen">
                {TALEN.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
          </div>
        </Section>

        <Section title="Concurrenten">
          <div className="space-y-2">
            {values.concurrenten.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  placeholder="Naam"
                  value={c.naam}
                  onChange={(e) => set('concurrenten', values.concurrenten.map((x, j) => (j === i ? { ...x, naam: e.target.value } : x)))}
                />
                <input
                  className="input"
                  placeholder="https://"
                  value={c.url}
                  onChange={(e) => set('concurrenten', values.concurrenten.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                />
                <Button variant="ghost" aria-label="Verwijderen" onClick={() => set('concurrenten', values.concurrenten.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => set('concurrenten', [...values.concurrenten, { naam: '', url: '' }])}>
              Concurrent toevoegen
            </Button>
          </div>
        </Section>

        <Section
          title="Ruwe klantdata"
          description="Plak reviews, comments en Reddit-posts. Scheid items met een lege regel. Dit is de basis voor het klantonderzoek in de Brief Builder."
        >
          <textarea
            className="input min-h-72 font-mono text-[13px] leading-relaxed"
            value={values.klantdata ?? ''}
            onChange={(e) => set('klantdata', e.target.value)}
            placeholder={'[Review – 5 sterren]\nIk slaap eindelijk door…\n\n[Reddit]\n…'}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
            <Button size="sm" icon={<Upload className="size-3.5" />} onClick={() => fileRef.current?.click()}>
              Upload .txt / .csv
            </Button>
            <span className="text-xs text-zinc-500">
              {countEntries(values.klantdata)} items · {(values.klantdata ?? '').length.toLocaleString('nl-NL')} tekens
            </span>
            {uploadInfo && <span className="text-xs text-emerald-600 dark:text-emerald-400">{uploadInfo}</span>}
          </div>
        </Section>

        <Section title="Drempelwaarden" description="Gebruikt in de testlog om resultaten groen/rood te kleuren. Leeg = standaard uit je instellingen.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {DREMPEL_VELDEN.map((d) => (
              <Field key={d.key} label={`${d.label} (${d.hint})`}>
                <div className="relative">
                  <input
                    className="input pr-7"
                    type="number"
                    step="any"
                    min={0}
                    value={values.drempels[d.key] ?? ''}
                    placeholder={profile?.drempels?.[d.key]?.toString() ?? ''}
                    onChange={(e) => {
                      const next = { ...values.drempels }
                      if (e.target.value === '') delete next[d.key]
                      else next[d.key] = Number(e.target.value)
                      set('drempels', next)
                    }}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-zinc-400">{d.suffix}</span>
                </div>
              </Field>
            ))}
          </div>
        </Section>

        {save.error && <ErrorBox error={save.error} />}
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-zinc-200 bg-white/90 backdrop-blur lg:left-60 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl justify-end gap-2 px-4 py-3 sm:px-8">
          <Button onClick={() => navigate(-1)}>Annuleren</Button>
          <Button variant="primary" loading={save.isPending} disabled={!values.naam.trim()} onClick={submit}>
            {isNew ? 'Project aanmaken' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-zinc-200 pt-6 first:border-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-8 dark:border-zinc-800">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
