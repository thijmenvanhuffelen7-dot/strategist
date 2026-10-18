// Datums altijd in Nederlandse tijd tonen. De server (bijv. Vercel) draait in UTC; zonder vaste tijdzone
// zouden server en browser verschillende tijden tonen.
const TZ = 'Europe/Amsterdam'

/** "18 okt" */
export const kortDatum = (d: Date) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: TZ })

/** "18 okt, 14:05" */
export const datumTijd = (d: Date) => d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ })

/** Middernacht van vandaag in Nederlandse tijd, als Date (voor "vandaag gebruikt"). */
export function beginVanVandaag(nu = new Date()): Date {
  const delen = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(nu)
      .map((p) => [p.type, p.value]),
  )
  // Verschil tussen Nederlandse tijd en UTC op dit moment.
  const alsUtc = Date.UTC(+delen.year, +delen.month - 1, +delen.day, +delen.hour, +delen.minute, +delen.second)
  const verschil = alsUtc - Math.floor(nu.getTime() / 1000) * 1000
  return new Date(Date.UTC(+delen.year, +delen.month - 1, +delen.day) - verschil)
}
