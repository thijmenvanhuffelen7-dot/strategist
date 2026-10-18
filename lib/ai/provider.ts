// Provider-interface: de rest van de app praat alleen hiertegen, nooit direct met Groq/OpenAI/Anthropic.

export interface ChatRequest {
  model: string
  system: string
  user: string
  maxTokens: number
  /** Vraag de provider om gegarandeerd geldige JSON. */
  json: boolean
  /** Tekst streamen zodra hij binnenkomt. Valt terug op niet-streamen als de provider dat met JSON niet ondersteunt. */
  stream: boolean
  signal?: AbortSignal
  /** Optionele afbeelding (https-URL of data-URL) voor modellen die afbeeldingen kunnen lezen. */
  afbeelding?: string
}

export type ChatChunk =
  | { type: 'text'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  /** De provider kon niet streamen; de tekst komt in één keer. */
  | { type: 'no-stream' }

export interface ModelOptie {
  id: string
  label: string
}

export interface AiProvider {
  id: string
  naam: string
  standaardModel: string
  /** Model dat afbeeldingen kan lezen (voor screenshots); leeg = niet ondersteund. */
  visieModel?: string
  modellen: ModelOptie[]
  /** Maximaal aantal tokens (invoer + uitvoer) per minuut; daar plannen we verzoeken omheen. */
  tokensPerMinuut: number
  isIngesteld(): boolean
  ontbrekendeKeyMelding: string
  chat(req: ChatRequest): AsyncIterable<ChatChunk>
}

/** Limiet bereikt (HTTP 429). retryAfterSec komt uit de header van de provider. */
export class RateLimitError extends Error {
  constructor(
    public retryAfterSec: number,
    message = 'Limiet bereikt',
  ) {
    super(message)
  }
}

/** Fout die we in gewone taal aan de gebruiker kunnen tonen. */
export class AiFout extends Error {
  constructor(
    message: string,
    public opnieuwProberen = true,
  ) {
    super(message)
  }
}
