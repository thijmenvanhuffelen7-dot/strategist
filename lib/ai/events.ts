// Berichten die de server tijdens een AI-actie naar de browser streamt (één JSON-object per regel).
export type AiEvent =
  | { type: 'status'; bericht: string }
  | { type: 'wacht'; seconden: number }
  /** Nieuwe poging: eerder gestreamde tekst wissen. */
  | { type: 'reset' }
  | { type: 'tekst'; tekst: string }
  | { type: 'verbruik'; input: number; output: number; vandaag: number }
  | { type: 'klaar'; resultaat?: unknown }
  | { type: 'fout'; bericht: string; opnieuw: boolean }

export type Emit = (e: AiEvent) => void
