// Houdt bij hoeveel tokens er de afgelopen minuut zijn verstuurd (per serverproces),
// zodat we vóór een verzoek kunnen wachten in plaats van tegen de limiet aan te lopen.

const VENSTER_MS = 60_000
const log: { tijd: number; tokens: number }[] = []

function opruimen(nu: number) {
  while (log.length && nu - log[0].tijd > VENSTER_MS) log.shift()
}

/** Aantal seconden wachten voordat `tokens` er nog bij passen binnen `limiet` per minuut (0 = direct). */
export function wachttijd(tokens: number, limiet: number): number {
  const nu = Date.now()
  opruimen(nu)
  let gebruikt = log.reduce((s, r) => s + r.tokens, 0)
  if (gebruikt + tokens <= limiet) return 0
  // Wacht tot genoeg oude verzoeken uit het venster vallen.
  for (const r of log) {
    gebruikt -= r.tokens
    if (gebruikt + tokens <= limiet) return Math.max(1, Math.ceil((r.tijd + VENSTER_MS - nu) / 1000))
  }
  return Math.ceil(VENSTER_MS / 1000)
}

export function registreer(tokens: number) {
  log.push({ tijd: Date.now(), tokens })
}

/** Corrigeert de laatste registratie met het werkelijke verbruik. */
export function corrigeerLaatste(werkelijk: number) {
  const laatste = log[log.length - 1]
  if (laatste) laatste.tokens = werkelijk
}
