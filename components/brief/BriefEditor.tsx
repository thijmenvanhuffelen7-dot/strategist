'use client'
import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Trash2, Sparkles, Plus, ArrowUp, ArrowDown, X, FileDown, Link2, FlaskConical, Check } from 'lucide-react'
import { dupliceerBrief, updateBrief, verwijderBrief } from '@/lib/builder-actions'
import { BRIEF_STATUSSEN, FORMAT_TYPES, type BriefInhoud, type BriefStatus, type ScriptRij } from '@/lib/builder-types'
import type { BriefDetail } from '@/lib/data-builder'
import { slaDirectOp, useServerState, useUitgesteld, wachtOpOpslaan } from '@/lib/use-server-state'
import { AutoTextarea } from '../AutoTextarea'
import { Button, STATUS, StatusPill } from '../ui'
import { useConfirm } from '../ConfirmDialog'
import { AiStatus } from '../ai/AiStatus'
import { Review } from '../ai/Review'
import { Versies } from '../ai/Versies'
import { useAiActie } from '../ai/useAiActie'
import type { AiInfo } from '../ai/types'
import type { SwipeItemData } from '@/lib/builder-types'
import { ReferentieAds } from './ReferentieAds'

const FASES = ['hook', 'probleem', 'oplossing', 'bewijs', 'bezwaar', 'CTA']

export function BriefEditor({
  detail,
  ai,
  referenties,
  swipeKeuzes,
}: {
  detail: BriefDetail
  ai: AiInfo
  referenties: SwipeItemData[]
  swipeKeuzes: { id: string; titel: string; merk: string | null }[]
}) {
  const { brief, project, angle, hook } = detail
  const router = useRouter()
  const confirm = useConfirm()
  const { staat, start, opnieuw, stop, sluit } = useAiActie()
  const [pending, startTransition] = useTransition()
  const versie = brief.bijgewerkt_op.toISOString()
  const [titel, setTitel] = useServerState(brief.titel, versie)
  const [status, setStatus] = useServerState<BriefStatus>(brief.status, versie)
  const [inhoud, setInhoud] = useServerState<BriefInhoud>(brief.inhoud, versie)
  const [opgeslagen, setOpgeslagen] = useState(true)

  const opslaan = useUitgesteld(async (patch: { titel?: string; inhoud?: BriefInhoud }) => {
    await updateBrief(brief.id, patch)
    setOpgeslagen(true)
  })

  const zetInhoud = (fn: (i: BriefInhoud) => BriefInhoud) => {
    const nieuw = fn(inhoud)
    setInhoud(nieuw)
    setOpgeslagen(false)
    opslaan('inhoud', { inhoud: nieuw })
  }
  const sectie = <K extends 'overzicht' | 'doelgroep' | 'boodschap' | 'testvariaties' | 'richtlijnen'>(k: K, patch: Partial<BriefInhoud[K]>) =>
    zetInhoud((i) => ({ ...i, [k]: { ...i[k], ...patch } }))

  const regenereer = async () => {
    if (!brief.angle_id || !brief.hook_id) return
    if (!(await confirm({ title: 'Brief opnieuw genereren?', message: 'De huidige inhoud wordt vervangen. Je kunt via “Versies” terug naar een eerdere AI-versie (eigen bewerkingen daarna niet).', confirmLabel: 'Opnieuw genereren' })))
      return
    start({ actie: 'brief', projectId: project.id, angleId: brief.angle_id, hookId: brief.hook_id, briefId: brief.id })
  }

  const verwijder = async () => {
    if (!(await confirm({ title: `“${titel}” verwijderen?`, message: 'Dit kan niet ongedaan worden gemaakt.', confirmLabel: 'Verwijderen', danger: true }))) return
    startTransition(async () => {
      await verwijderBrief(brief.id)
      router.push(`/briefs/project/${project.id}?stap=4`)
    })
  }

  const dupliceer = () =>
    startTransition(async () => {
      await wachtOpOpslaan()
      const id = await dupliceerBrief(brief.id)
      router.push(`/briefs/${id}`)
    })

  const o = inhoud.overzicht

  return (
    <div className="pb-16">
      <Link href={`/briefs/project/${project.id}?stap=4`} className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> {project.naam}
      </Link>

      <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-start">
        <AutoTextarea
          className="w-full flex-1 border-0 bg-transparent p-0 text-2xl font-semibold tracking-tight focus:ring-0 focus:outline-none"
          value={titel}
          aria-label="Titel"
          onChange={(e) => {
            setTitel(e.target.value)
            setOpgeslagen(false)
            opslaan('titel', { titel: e.target.value })
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Status"
            className="input h-8 w-auto py-1 text-xs"
            value={status}
            onChange={(e) => {
              const s = e.target.value as BriefStatus
              setStatus(s)
              void slaDirectOp(updateBrief(brief.id, { status: s }))
            }}
          >
            {BRIEF_STATUSSEN.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
          <StatusPill status={status} />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
        {angle && <span>Angle: <strong className="font-medium text-zinc-700 dark:text-zinc-300">{angle.naam}</strong></span>}
        {hook && <span>Hook: “{hook.gesproken}”</span>}
        <span className={`inline-flex items-center gap-1 ${opgeslagen ? 'text-emerald-600' : ''}`}>{opgeslagen ? <><Check className="size-3" /> Opgeslagen</> : 'Opslaan…'}</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" icon={<Copy className="size-3.5" />} loading={pending} onClick={dupliceer}>
          Dupliceren als variant
        </Button>
        <Button size="sm" icon={<Sparkles className="size-3.5" />} loading={staat.bezig} disabled={!ai.ingesteld || !brief.angle_id || !brief.hook_id} title={!ai.ingesteld ? ai.ontbrekendeKeyMelding : undefined} onClick={regenereer}>
          Opnieuw genereren
        </Button>
        <Versies versies={detail.versies} uitleg="De huidige inhoud van de brief wordt vervangen door deze AI-versie." />
        <Button size="sm" variant="ghost" icon={<FileDown className="size-3.5" />} disabled title="Komt in fase 5">
          PDF / Markdown
        </Button>
        <Button size="sm" variant="ghost" icon={<Link2 className="size-3.5" />} disabled title="Komt in fase 5">
          Deellink
        </Button>
        <Button size="sm" variant="ghost" icon={<FlaskConical className="size-3.5" />} disabled title="Komt in fase 4">
          Testlog-item
        </Button>
        <Button size="sm" variant="danger" icon={<Trash2 className="size-3.5" />} onClick={verwijder} className="ml-auto">
          Verwijderen
        </Button>
      </div>

      <AiStatus staat={staat} onOpnieuw={opnieuw} onStop={stop} onSluit={sluit} dagLimiet={ai.dagLimiet} />

      <div className="mt-2 space-y-8">
        <Sectie nr={1} titel="Overzicht">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Veld label="Angle" waarde={o.angle} onChange={(v) => sectie('overzicht', { angle: v })} />
            <Veld label="Doel" waarde={o.doel} onChange={(v) => sectie('overzicht', { doel: v })} />
            <Veld label="Platform" waarde={o.platform} onChange={(v) => sectie('overzicht', { platform: v })} />
            <div>
              <label className="label">Formaat</label>
              <select className="input" value={o.formaat} onChange={(e) => sectie('overzicht', { formaat: e.target.value })}>
                {['9:16', '4:5', '1:1', o.formaat].filter((x, i, a) => x && a.indexOf(x) === i).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <Veld label="Lengte" waarde={o.lengte} onChange={(v) => sectie('overzicht', { lengte: v })} />
            <div>
              <label className="label">Format-type</label>
              <input className="input" list="format-types" value={o.format_type} onChange={(e) => sectie('overzicht', { format_type: e.target.value })} />
              <datalist id="format-types">
                {FORMAT_TYPES.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
          </div>
        </Sectie>

        <Sectie nr={2} titel="Doelgroep">
          <Veld label="Persona" waarde={inhoud.doelgroep.persona} onChange={(v) => sectie('doelgroep', { persona: v })} groot />
          <div className="grid gap-3 sm:grid-cols-2">
            <Veld label="Situatie waarin ze scrollen" waarde={inhoud.doelgroep.situatie} onChange={(v) => sectie('doelgroep', { situatie: v })} />
            <Veld label="Bewustzijnsniveau" waarde={inhoud.doelgroep.bewustzijnsniveau} onChange={(v) => sectie('doelgroep', { bewustzijnsniveau: v })} />
          </div>
        </Sectie>

        <Sectie nr={3} titel="Boodschap">
          <Veld label="Kernboodschap" waarde={inhoud.boodschap.kernboodschap} onChange={(v) => sectie('boodschap', { kernboodschap: v })} groot />
          <div className="grid gap-3 sm:grid-cols-2">
            <Veld label="Belangrijkste bewijs" waarde={inhoud.boodschap.bewijs} onChange={(v) => sectie('boodschap', { bewijs: v })} />
            <Veld label="Bezwaar om weg te nemen" waarde={inhoud.boodschap.bezwaar} onChange={(v) => sectie('boodschap', { bezwaar: v })} />
          </div>
        </Sectie>

        <Sectie nr={4} titel="Script">
          <ScriptTabel rijen={inhoud.script} onChange={(script) => zetInhoud((i) => ({ ...i, script }))} />
        </Sectie>

        <Sectie nr={5} titel="Testvariaties">
          <Lijst label="Alternatieve hooks" items={inhoud.testvariaties.hooks} onChange={(hooks) => sectie('testvariaties', { hooks })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Veld label="Alternatieve CTA" waarde={inhoud.testvariaties.cta} onChange={(v) => sectie('testvariaties', { cta: v })} />
            <Veld label="Alternatief format" waarde={inhoud.testvariaties.format} onChange={(v) => sectie('testvariaties', { format: v })} />
          </div>
        </Sectie>

        <Sectie nr={6} titel="Richtlijnen voor creator en editor">
          <div className="grid gap-3 sm:grid-cols-2">
            <Veld label="Toon" waarde={inhoud.richtlijnen.toon} onChange={(v) => sectie('richtlijnen', { toon: v })} />
            <Veld label="Setting" waarde={inhoud.richtlijnen.setting} onChange={(v) => sectie('richtlijnen', { setting: v })} />
            <Veld label="Muziek" waarde={inhoud.richtlijnen.muziek} onChange={(v) => sectie('richtlijnen', { muziek: v })} />
            <Veld label="Ondertitels" waarde={inhoud.richtlijnen.ondertitels} onChange={(v) => sectie('richtlijnen', { ondertitels: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Lijst label="Do's" items={inhoud.richtlijnen.dos} onChange={(dos) => sectie('richtlijnen', { dos })} />
            <Lijst label="Don'ts" items={inhoud.richtlijnen.donts} onChange={(donts) => sectie('richtlijnen', { donts })} />
          </div>
        </Sectie>

        <Sectie nr={7} titel="Succescriteria">
          <div className="space-y-2">
            {inhoud.succescriteria.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[160px_140px_1fr_auto]">
                {(['metric', 'drempel', 'toelichting'] as const).map((k) => (
                  <input
                    key={k}
                    className="input"
                    placeholder={k}
                    aria-label={k}
                    value={s[k]}
                    onChange={(e) => zetInhoud((x) => ({ ...x, succescriteria: x.succescriteria.map((c, j) => (j === i ? { ...c, [k]: e.target.value } : c)) }))}
                  />
                ))}
                <button aria-label="Verwijderen" className="rounded p-2 text-zinc-400 hover:text-red-500" onClick={() => zetInhoud((x) => ({ ...x, succescriteria: x.succescriteria.filter((_, j) => j !== i) }))}>
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => zetInhoud((x) => ({ ...x, succescriteria: [...x.succescriteria, { metric: '', drempel: '', toelichting: '' }] }))}>
              Metric toevoegen
            </Button>
          </div>
        </Sectie>

        <ReferentieAds briefId={brief.id} ads={referenties} keuzes={swipeKeuzes} />

        <Review projectId={project.id} stap="brief" briefId={brief.id} laatste={detail.review} ai={ai} />
      </div>
    </div>
  )
}

function Sectie({ nr, titel, children }: { nr: number; titel: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-baseline gap-2 border-b border-zinc-200 pb-2 text-base font-semibold dark:border-zinc-800">
        <span className="text-sm font-normal text-zinc-400 tabular-nums">{nr}.</span>
        {titel}
      </h2>
      {children}
    </section>
  )
}

function Veld({ label, waarde, onChange, groot }: { label: string; waarde: string; onChange: (v: string) => void; groot?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <AutoTextarea className={`input leading-relaxed ${groot ? 'text-[15px]' : 'text-sm'}`} value={waarde} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Lijst({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <AutoTextarea className="input flex-1 text-sm" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button aria-label="Verwijderen" className="rounded p-2 text-zinc-400 hover:text-red-500" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-1.5 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => onChange([...items, ''])}>
        <Plus className="size-3" /> Toevoegen
      </button>
    </div>
  )
}

const KOLOMMEN: { key: keyof Omit<ScriptRij, 'id' | 'fase'>; label: string; breedte: string }[] = [
  { key: 'tijd', label: 'Tijd', breedte: 'w-20' },
  { key: 'beeld', label: 'Beeld', breedte: 'min-w-48' },
  { key: 'gesproken', label: 'Gesproken tekst', breedte: 'min-w-56' },
  { key: 'tekst_op_beeld', label: 'Tekst op beeld', breedte: 'min-w-40' },
  { key: 'opmerkingen', label: 'Opmerkingen', breedte: 'min-w-40' },
]

function ScriptTabel({ rijen, onChange }: { rijen: ScriptRij[]; onChange: (r: ScriptRij[]) => void }) {
  const wijzig = (id: string, patch: Partial<ScriptRij>) => onChange(rijen.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const verplaats = (i: number, d: -1 | 1) => {
    const kopie = [...rijen]
    ;[kopie[i], kopie[i + d]] = [kopie[i + d], kopie[i]]
    onChange(kopie)
  }
  const nieuweRij = (): ScriptRij => ({ id: crypto.randomUUID(), tijd: '', fase: '', beeld: '', gesproken: '', tekst_op_beeld: '', opmerkingen: '' })

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="w-24 px-2 py-2">Fase</th>
              {KOLOMMEN.map((k) => (
                <th key={k.key} className={`px-2 py-2 ${k.breedte}`}>
                  {k.label}
                </th>
              ))}
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 align-top dark:divide-zinc-800">
            {rijen.map((r, i) => (
              <tr key={r.id}>
                <td className="px-1 py-1">
                  <input className="w-full rounded bg-transparent px-1.5 py-1 text-xs font-medium text-accent-700 focus:bg-white focus:outline-none dark:text-accent-100 dark:focus:bg-zinc-800" list="fases" value={r.fase} aria-label="Fase" onChange={(e) => wijzig(r.id, { fase: e.target.value })} />
                </td>
                {KOLOMMEN.map((k) => (
                  <td key={k.key} className="px-1 py-1">
                    <AutoTextarea
                      className="w-full rounded bg-transparent px-1.5 py-1 leading-relaxed focus:bg-white focus:ring-1 focus:ring-accent-500 focus:outline-none dark:focus:bg-zinc-800"
                      value={r[k.key]}
                      aria-label={k.label}
                      onChange={(e) => wijzig(r.id, { [k.key]: e.target.value })}
                    />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <div className="flex">
                    <button aria-label="Omhoog" disabled={i === 0} onClick={() => verplaats(i, -1)} className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:hover:text-zinc-200">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button aria-label="Omlaag" disabled={i === rijen.length - 1} onClick={() => verplaats(i, 1)} className="rounded p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 dark:hover:text-zinc-200">
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button aria-label="Rij verwijderen" onClick={() => onChange(rijen.filter((x) => x.id !== r.id))} className="rounded p-1 text-zinc-400 hover:text-red-500">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="fases">
          {FASES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>
      <Button size="sm" className="mt-2" icon={<Plus className="size-3.5" />} onClick={() => onChange([...rijen, nieuweRij()])}>
        Rij toevoegen
      </Button>
    </div>
  )
}
