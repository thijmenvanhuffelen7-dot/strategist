'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ClipboardPaste, ScanSearch } from 'lucide-react'
import { maakCroCheck } from '@/lib/cro-actions'
import { Button } from '../ui'

export function NieuweCroCheck({ projecten, beginUrl, beginProject }: { projecten: { id: string; naam: string }[]; beginUrl: string; beginProject: string }) {
  const router = useRouter()
  const [modus, setModus] = useState<'url' | 'plakken'>('url')
  const [url, setUrl] = useState(beginUrl)
  const [tekst, setTekst] = useState('')
  const [projectId, setProjectId] = useState(beginProject)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, startTransition] = useTransition()

  const start = () =>
    startTransition(async () => {
      setFout(null)
      const res = await maakCroCheck({ url, tekst: modus === 'plakken' ? tekst : undefined, projectId })
      if ('id' in res) {
        setTekst('')
        router.push(`/cro/${res.id}`)
      } else {
        setFout(res.fout)
        if (res.plakken) setModus('plakken')
      }
    })

  return (
    <div className="card space-y-4 p-5">
      <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800/60">
        {(
          [
            ['url', 'Webadres', Globe],
            ['plakken', 'Tekst plakken', ClipboardPaste],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => setModus(m)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 ${modus === m ? 'bg-white font-medium shadow-sm dark:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="cro-url">
          {modus === 'url' ? 'Webadres van de landingspagina' : 'Webadres (optioneel, ter referentie)'}
        </label>
        <input id="cro-url" className="input" placeholder="https://jouwmerk.nl/product" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && modus === 'url' && start()} />
      </div>

      {modus === 'plakken' && (
        <div>
          <label className="label" htmlFor="cro-tekst">
            Tekst van de pagina
          </label>
          <textarea
            id="cro-tekst"
            className="input min-h-48 font-mono text-[13px] leading-relaxed"
            placeholder="Selecteer op de pagina alles (Ctrl/Cmd+A), kopieer en plak hier. Koppen, knopteksten en reviews zijn het belangrijkst."
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="label" htmlFor="cro-project">
          Project (optioneel)
        </label>
        <select id="cro-project" className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Geen project: beoordeel de pagina op zichzelf</option>
          {projecten.map((p) => (
            <option key={p.id} value={p.id}>
              {p.naam}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">Met een project vergelijkt de AI de pagina met je klantonderzoek: pijnpunten, bezwaren en klanttaal.</p>
      </div>

      {fout && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{fout}</p>}

      <Button variant="primary" icon={<ScanSearch className="size-4" />} loading={bezig} disabled={modus === 'url' ? !url.trim() : tekst.trim().length < 200} onClick={start}>
        {modus === 'url' ? 'Pagina ophalen' : 'Tekst gebruiken'}
      </Button>
    </div>
  )
}
