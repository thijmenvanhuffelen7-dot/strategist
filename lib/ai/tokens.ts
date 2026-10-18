// Ruwe tokenschatting: ~3,5 tekens per token voor Nederlands/Engels. Liever iets te hoog dan te laag.
export function schatTokens(tekst: string): number {
  return Math.ceil(tekst.length / 3.5)
}

/**
 * Splitst klantdata in stukken die elk binnen `maxTokens` passen.
 * Items (gescheiden door een lege regel) blijven heel; een te groot item wordt hard afgekapt.
 */
export function splitsKlantdata(tekst: string, maxTokens: number): string[] {
  const items = tekst.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  const stukken: string[] = []
  let huidig: string[] = []
  let huidigTokens = 0
  for (let item of items) {
    let t = schatTokens(item)
    if (t > maxTokens) {
      item = item.slice(0, Math.floor(maxTokens * 3.5))
      t = maxTokens
    }
    if (huidigTokens + t > maxTokens && huidig.length) {
      stukken.push(huidig.join('\n\n'))
      huidig = []
      huidigTokens = 0
    }
    huidig.push(item)
    huidigTokens += t
  }
  if (huidig.length) stukken.push(huidig.join('\n\n'))
  return stukken
}

/** Kapt tekst af op ongeveer `maxTokens` tokens. */
export function kapAf(tekst: string | null | undefined, maxTokens: number): string {
  if (!tekst) return ''
  const max = Math.floor(maxTokens * 3.5)
  return tekst.length > max ? `${tekst.slice(0, max)}\n[…afgekapt]` : tekst
}
