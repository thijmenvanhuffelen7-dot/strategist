'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2, Hourglass, X, Gauge } from 'lucide-react'
import { Button, ErrorBox } from '../ui'
import type { AiStaat } from './useAiActie'

/** Toont voortgang, live tekst, wachttijd bij limieten, fouten en tokenverbruik van een AI-actie. */
export function AiStatus({ staat, onOpnieuw, onStop, onSluit, dagLimiet }: { staat: AiStaat; onOpnieuw: () => void; onStop: () => void; onSluit: () => void; dagLimiet: number }) {
  const preRef = useRef<HTMLPreElement>(null)
  const [nu, setNu] = useState(() => Date.now())

  useEffect(() => {
    if (!staat.wachtTot) return
    const t = setInterval(() => setNu(Date.now()), 250)
    return () => clearInterval(t)
  }, [staat.wachtTot])

  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight
  }, [staat.tekst])

  if (!staat.bezig && !staat.fout && !staat.verbruik) return null
  const wachtSec = staat.wachtTot ? Math.max(0, Math.ceil((staat.wachtTot - nu) / 1000)) : 0

  return (
    <div className="space-y-2">
      {staat.bezig && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
            {wachtSec > 0 ? (
              <>
                <Hourglass className="size-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">Even wachten, limiet bereikt ({wachtSec} sec)</span>
              </>
            ) : (
              <>
                <Loader2 className="size-4 animate-spin text-accent-600" />
                <span className="text-zinc-600 dark:text-zinc-300">{staat.status ?? 'Bezig…'}</span>
              </>
            )}
            <button onClick={onStop} className="ml-auto text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Stoppen
            </button>
          </div>
          {!staat.tekst && wachtSec === 0 && <p className="px-3 py-2 text-xs text-zinc-400">De tekst verschijnt zodra de AI begint te schrijven…</p>}
          {staat.tekst && (
            <pre ref={preRef} className="max-h-48 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-500">
              {staat.tekst}
            </pre>
          )}
        </div>
      )}
      {staat.fout && <ErrorBox error={new Error(staat.fout.bericht)} onRetry={staat.fout.opnieuw ? onOpnieuw : undefined} />}
      {!staat.bezig && staat.verbruik && <Verbruik verbruik={staat.verbruik} dagLimiet={dagLimiet} onSluit={onSluit} />}
    </div>
  )
}

function Verbruik({ verbruik, dagLimiet, onSluit }: { verbruik: NonNullable<AiStaat['verbruik']>; dagLimiet: number; onSluit: () => void }) {
  const totaal = verbruik.input + verbruik.output
  const pct = Math.min(100, Math.round((verbruik.vandaag / dagLimiet) * 100))
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900">
      <Gauge className="size-3.5" />
      <span>
        <strong className="font-medium text-zinc-700 dark:text-zinc-300">{totaal.toLocaleString('nl-NL')}</strong> tokens ({verbruik.input.toLocaleString('nl-NL')} in /{' '}
        {verbruik.output.toLocaleString('nl-NL')} uit)
      </span>
      <span>
        · vandaag {verbruik.vandaag.toLocaleString('nl-NL')} van ~{dagLimiet.toLocaleString('nl-NL')} ({pct}%)
      </span>
      <Button variant="ghost" size="sm" className="ml-auto h-5 px-1" onClick={onSluit} aria-label="Sluiten">
        <X className="size-3" />
      </Button>
    </div>
  )
}
