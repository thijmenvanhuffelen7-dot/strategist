// Groq via de OpenAI-compatibele API. Dit is het enige bestand met Groq-specifieke code.
import OpenAI, { APIError } from 'openai'
import { AiFout, RateLimitError, type AiProvider, type ChatChunk, type ChatRequest } from './provider'

const BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'

// Als Groq streaming in JSON-modus weigert, onthouden we dat en vragen we voortaan zonder streaming.
let jsonStreamNietOndersteund = false

function client() {
  // maxRetries 0: limietfouten handelen we zelf af, zodat we de wachttijd in de interface kunnen tonen.
  return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: BASE_URL, maxRetries: 0 })
}

function retryAfter(err: APIError): number {
  const h = err.headers
  const sec = Number(h?.get('retry-after'))
  if (Number.isFinite(sec) && sec > 0) return Math.ceil(sec)
  // Groq meldt soms "Please try again in 7.5s" in de tekst.
  const m = /try again in ([\d.]+)\s*(ms|s)/i.exec(err.message)
  if (m) return Math.max(1, Math.ceil(Number(m[1]) / (m[2] === 'ms' ? 1000 : 1)))
  return 10
}

function vertaal(err: unknown): never {
  if (err instanceof APIError) {
    if (err.status === 429) throw new RateLimitError(retryAfter(err), err.message)
    if (err.status === 401) throw new AiFout('De Groq API-key wordt niet geaccepteerd. Controleer GROQ_API_KEY in .env.local.', false)
    if (err.status === 404) throw new AiFout('Dit model bestaat niet (meer) bij Groq. Kies een ander model in Instellingen.', false)
    if (err.status === 413) throw new AiFout('Het verzoek is te groot voor dit model. Probeer minder klantdata of een model met een groter limiet.')
    throw new AiFout(`Groq gaf een fout (${err.status ?? 'onbekend'}): ${err.message}`)
  }
  if (err instanceof Error && err.name === 'AbortError') throw err
  throw new AiFout('Geen verbinding met Groq. Controleer je internetverbinding.')
}

function extraOpties(model: string) {
  // gpt-oss is een redeneermodel: lage redeneerinspanning bespaart veel tokens (belangrijk bij het gratis limiet).
  return model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' as const } : {}
}

async function* chat(req: ChatRequest): AsyncIterable<ChatChunk> {
  const base = {
    model: req.model,
    messages: [
      { role: 'system' as const, content: req.system },
      { role: 'user' as const, content: req.user },
    ],
    max_completion_tokens: req.maxTokens,
    temperature: 0.7,
    ...(req.json ? { response_format: { type: 'json_object' as const } } : {}),
    ...extraOpties(req.model),
  }

  if (req.stream && !(req.json && jsonStreamNietOndersteund)) {
    try {
      const stream = await client().chat.completions.create({ ...base, stream: true, stream_options: { include_usage: true } }, { signal: req.signal })
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield { type: 'text', text }
        // Groq zet het verbruik soms in x_groq.usage in plaats van usage.
        const usage = chunk.usage ?? (chunk as unknown as { x_groq?: { usage?: OpenAI.CompletionUsage } }).x_groq?.usage
        if (usage) yield { type: 'usage', inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens }
      }
      return
    } catch (err) {
      const streamGeweigerd = err instanceof APIError && err.status === 400 && req.json && /stream/i.test(err.message)
      if (!streamGeweigerd) vertaal(err)
      jsonStreamNietOndersteund = true
    }
  }

  yield { type: 'no-stream' }
  try {
    const res = await client().chat.completions.create({ ...base, stream: false }, { signal: req.signal })
    const text = res.choices[0]?.message?.content ?? ''
    if (text) yield { type: 'text', text }
    if (res.usage) yield { type: 'usage', inputTokens: res.usage.prompt_tokens, outputTokens: res.usage.completion_tokens }
  } catch (err) {
    vertaal(err)
  }
}

export const groq: AiProvider = {
  id: 'groq',
  naam: 'Groq',
  standaardModel: 'openai/gpt-oss-120b',
  // Niet gecontroleerd tegen de Groq-documentatie (niet bereikbaar bij het bouwen); exacte lijst: console.groq.com/docs/models.
  modellen: [
    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (standaard, sterkst)' },
    { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B (sneller)' },
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (snelst, eenvoudig)' },
  ],
  tokensPerMinuut: Number(process.env.AI_TOKENS_PER_MINUUT) || 8000,
  isIngesteld: () => Boolean(process.env.GROQ_API_KEY),
  ontbrekendeKeyMelding:
    'Er is nog geen Groq API-key ingesteld. Maak een gratis key op console.groq.com, zet hem in .env.local als GROQ_API_KEY=… en herstart de app.',
  chat,
}
