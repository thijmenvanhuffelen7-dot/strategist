'use client'
import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, ExternalLink, FlaskConical, Copy, Check, FileText } from 'lucide-react'
import type { BuilderData } from '@/lib/data-builder'
import { AnglesTab, BriefsTab, HooksTab, OnderzoekTab } from './ProjectTabs'
import { deleteProject } from '@/lib/actions'
import { doelLabel, type Project } from '@/lib/types'
import { countEntries } from '@/lib/klantdata'
import { Button, EmptyState, Pill } from '../ui'
import { useConfirm } from '../ConfirmDialog'

const DREMPEL_LABELS: Record<string, string> = { hook_rate: 'Hook rate ≥ %', hold_rate: 'Hold rate ≥ %', ctr: 'CTR ≥ %', cpa: 'CPA ≤ €', roas: 'ROAS ≥ x' }

const TABS = [
  { id: 'overzicht', label: 'Overzicht' },
  { id: 'onderzoek', label: 'Onderzoek' },
  { id: 'angles', label: 'Angles' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'briefs', label: 'Briefs' },
  { id: 'tests', label: 'Tests' },
] as const

export function ProjectDetail({ project, initialTab, builder }: { project: Project; initialTab: string; builder: Pick<BuilderData, 'research' | 'angles' | 'hooks' | 'briefs'> }) {
  const router = useRouter()
  const [tab, setTab] = useState(initialTab)
  const [deleting, startDeleting] = useTransition()
  const confirm = useConfirm()

  const selectTab = (id: string) => {
    setTab(id)
    // Tabblad in de URL zetten, zodat herladen of terugkomen op hetzelfde tabblad uitkomt.
    window.history.replaceState(null, '', id === 'overzicht' ? `/projecten/${project.id}` : `/projecten/${project.id}?tab=${id}`)
  }

  const remove = async () => {
    const ok = await confirm({
      title: `“${project.naam}” verwijderen?`,
      message: 'Ook alle bijbehorende onderzoek, angles, hooks, briefs en tests worden verwijderd. Dit kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Verwijderen',
      danger: true,
    })
    if (!ok) return
    startDeleting(async () => {
      await deleteProject(project.id)
      router.push('/projecten')
    })
  }

  return (
    <>
      <Link href="/projecten" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="size-4" /> Projecten
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{project.naam}</h1>
            {project.is_voorbeeld && <Pill color="violet">Voorbeeldproject</Pill>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.platforms.map((p) => (
              <Pill key={p}>{p}</Pill>
            ))}
            {project.doel && <Pill color="blue">{doelLabel(project.doel)}</Pill>}
            <Pill color="accent">Ads in het {project.taal}</Pill>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon={<FileText className="size-4" />} onClick={() => router.push(`/briefs/project/${project.id}`)}>
            Brief Builder
          </Button>
          <Button icon={<Pencil className="size-4" />} onClick={() => router.push(`/projecten/${project.id}/bewerken`)}>
            Bewerken
          </Button>
          <Button variant="danger" icon={<Trash2 className="size-4" />} loading={deleting} onClick={remove}>
            <span className="hidden sm:inline">Verwijderen</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 -mx-4 overflow-x-auto border-b border-zinc-200 px-4 sm:mx-0 sm:px-0 dark:border-zinc-800">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-accent-600 font-medium text-zinc-900 dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overzicht' && <Overzicht project={project} />}
      {tab === 'onderzoek' && <OnderzoekTab projectId={project.id} research={builder.research} />}
      {tab === 'angles' && <AnglesTab projectId={project.id} angles={builder.angles} />}
      {tab === 'hooks' && <HooksTab projectId={project.id} hooks={builder.hooks} angles={builder.angles} />}
      {tab === 'briefs' && <BriefsTab projectId={project.id} briefs={builder.briefs} />}
      {tab === 'tests' && (
        <Komt icon={<FlaskConical />} title="Nog geen tests">
          Houd hier creative-tests, metrics en lessen bij, met CSV-import uit Meta en TikTok Ads Manager. <em>Beschikbaar in fase 4.</em>
        </Komt>
      )}
    </>
  )
}

function Komt({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <EmptyState icon={icon} title={title}>
      {children}
    </EmptyState>
  )
}

function Overzicht({ project: p }: { project: Project }) {
  const klantItems = countEntries(p.klantdata)
  const drempels = Object.entries(p.drempels ?? {})
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Block title="Omschrijving">{p.omschrijving}</Block>
        <Block title="Doelgroep">{p.doelgroep}</Block>
        <Block title="Landingspagina-tekst" mono>
          {p.landingspagina_tekst}
        </Block>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Ruwe klantdata</h3>
            <span className="text-xs text-zinc-500">{klantItems} items</span>
          </div>
          {p.klantdata?.trim() ? (
            <div className="card max-h-[28rem] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{p.klantdata}</div>
          ) : (
            <p className="text-sm text-zinc-400">
              Nog geen klantdata. <Link className="text-accent-600 hover:underline" href={`/projecten/${p.id}/bewerken`}>Voeg reviews toe</Link> om met onderzoek te beginnen.
            </p>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          <Row label="Prijs">{p.prijs || '—'}</Row>
          <Row label="Website">
            {p.url ? (
              <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-600 hover:underline">
                {p.url.replace(/^https?:\/\//, '')} <ExternalLink className="size-3" />
              </a>
            ) : (
              '—'
            )}
          </Row>
          {p.url && (
            <Row label="CRO">
              <Link href={`/cro?project=${p.id}&url=${encodeURIComponent(p.url)}`} className="text-accent-600 hover:underline">
                Check deze pagina →
              </Link>
            </Row>
          )}
          <Row label="Doel">{doelLabel(p.doel)}</Row>
          <Row label="Taal ads">{p.taal}</Row>
          <Row label="Platforms">{p.platforms.join(', ') || '—'}</Row>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Concurrenten</h3>
          {p.concurrenten.length ? (
            <ul className="space-y-1.5 text-sm">
              {p.concurrenten.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{c.naam || c.url}</span>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Geen concurrenten toegevoegd</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Drempelwaarden</h3>
          {drempels.length ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {drempels.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-zinc-500">{DREMPEL_LABELS[k] ?? k}</dt>
                  <dd className="text-right tabular-nums">{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-zinc-400">Standaardwaarden uit instellingen</p>
          )}
        </div>
      </aside>
    </div>
  )
}

function Block({ title, children, mono }: { title: string; children: ReactNode; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  if (!children) return null
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">{title}</h3>
        <button
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          title="Kopiëren"
          onClick={() => {
            navigator.clipboard.writeText(String(children))
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <p className={`leading-relaxed whitespace-pre-wrap ${mono ? 'card p-4 font-mono text-[13px]' : 'text-[15px]'}`}>{children}</p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-zinc-500">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  )
}
