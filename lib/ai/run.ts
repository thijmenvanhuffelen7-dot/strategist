// Eén JSON-verzoek aan de AI: plannen binnen de limiet, streamen, wachten bij 429, valideren met Zod.
import type { z } from 'zod'
import { getModel, getProvider } from './index'
import { haalJson } from './json'
import { corrigeerLaatste, registreer, wachttijd } from './limiter'
import { AiFout, RateLimitError } from './provider'
import { schatTokens } from './tokens'
import type { Emit } from './events'

export interface VraagOpties<S extends z.ZodType> {
  systeem: string
  gebruiker: string
  schema: S
  voorbeeld: unknown
  maxTokens: number
  emit: Emit
  signal?: AbortSignal
  /** Afbeelding meesturen (gebruikt dan het visiemodel van de provider). */
  afbeelding?: string
}

export interface VraagResultaat<T> {
  data: T
  verbruik: { input: number; output: number }
  model: string
}

const MAX_LIMIET_POGINGEN = 5

function slaap(sec: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, sec * 1000)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Afgebroken', 'AbortError'))
    })
  })
}

function jsonInstructie(voorbeeld: unknown) {
  return `Antwoord uitsluitend met één geldig JSON-object, zonder markdown en zonder uitleg ervoor of erna. Gebruik exact deze structuur (waarden met | zijn keuzes):\n${JSON.stringify(voorbeeld, null, 2)}`
}

/** Hoeveel tokens er maximaal in één verzoek passen (invoer + uitvoer), met wat marge. */
export function tokenBudget() {
  return Math.floor(getProvider().tokensPerMinuut * 0.95)
}

export async function vraagJson<S extends z.ZodType>(opts: VraagOpties<S>): Promise<VraagResultaat<z.infer<S>>> {
  const provider = getProvider()
  if (!provider.isIngesteld()) throw new AiFout(provider.ontbrekendeKeyMelding, false)
  if (opts.afbeelding && !provider.visieModel) throw new AiFout('Deze AI-provider kan geen afbeeldingen lezen.', false)
  const model = opts.afbeelding ? provider.visieModel! : await getModel(provider)
  const systeem = `${opts.systeem}\n\n${jsonInstructie(opts.voorbeeld)}`
  let gebruiker = opts.gebruiker
  const verbruik = { input: 0, output: 0 }
  let limietPogingen = 0

  for (let poging = 0; poging < 2; ) {
    // Een afbeelding telt ook mee in het limiet; ruwe schatting.
    const schatting = schatTokens(systeem + gebruiker) + opts.maxTokens + (opts.afbeelding ? 1500 : 0)
    if (schatting > tokenBudget()) {
      throw new AiFout(
        `Dit verzoek is te groot voor het limiet van ${provider.tokensPerMinuut.toLocaleString('nl-NL')} tokens per minuut (geschat ${schatting.toLocaleString('nl-NL')}). Probeer minder tekst.`,
        false,
      )
    }

    const wacht = wachttijd(schatting, provider.tokensPerMinuut)
    if (wacht > 0) {
      opts.emit({ type: 'wacht', seconden: wacht })
      await slaap(wacht, opts.signal)
    }
    registreer(schatting)
    opts.emit({ type: 'reset' })

    let tekst = ''
    let gemeld = false
    try {
      for await (const chunk of provider.chat({ model, system: systeem, user: gebruiker, maxTokens: opts.maxTokens, json: true, stream: true, signal: opts.signal, afbeelding: opts.afbeelding })) {
        if (chunk.type === 'text') {
          tekst += chunk.text
          opts.emit({ type: 'tekst', tekst: chunk.text })
        } else if (chunk.type === 'usage') {
          verbruik.input += chunk.inputTokens
          verbruik.output += chunk.outputTokens
          corrigeerLaatste(chunk.inputTokens + chunk.outputTokens)
          gemeld = true
        }
      }
    } catch (err) {
      if (err instanceof RateLimitError && limietPogingen < MAX_LIMIET_POGINGEN) {
        limietPogingen++
        opts.emit({ type: 'wacht', seconden: err.retryAfterSec })
        await slaap(err.retryAfterSec, opts.signal)
        continue
      }
      if (err instanceof RateLimitError) throw new AiFout('Het limiet blijft bereikt. Mogelijk is je daglimiet op; probeer het later opnieuw.')
      throw err
    }
    if (!gemeld) {
      // Provider gaf geen verbruik door: schatten.
      verbruik.input += schatTokens(systeem + gebruiker)
      verbruik.output += schatTokens(tekst)
    }

    let fout: string
    try {
      const parsed = opts.schema.safeParse(haalJson(tekst))
      if (parsed.success) return { data: parsed.data, verbruik, model }
      fout = parsed.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join('.') || '(hoofdniveau)'}: ${i.message}`)
        .join('; ')
    } catch (e) {
      fout = e instanceof Error ? e.message : 'ongeldige JSON'
    }

    poging++
    if (poging >= 2) throw new AiFout(`De AI gaf twee keer een antwoord in de verkeerde vorm (${fout}). Probeer het opnieuw of kies een ander model.`)
    opts.emit({ type: 'status', bericht: 'Antwoord had niet de juiste vorm, ik vraag het nog een keer…' })
    gebruiker = `${opts.gebruiker}\n\nLET OP: je vorige antwoord was ongeldig (${fout}). Geef nu uitsluitend geldige JSON in exact de gevraagde structuur.`
  }
  throw new AiFout('Onbekende fout bij de AI.')
}
