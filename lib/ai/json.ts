/** Haalt het JSON-object uit AI-tekst, ook als het model er toch ```json-blokken of uitleg omheen zet. */
export function haalJson(tekst: string): unknown {
  const zonderFences = tekst.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(zonderFences)
  } catch {
    const start = zonderFences.indexOf('{')
    const eind = zonderFences.lastIndexOf('}')
    if (start >= 0 && eind > start) return JSON.parse(zonderFences.slice(start, eind + 1))
    throw new SyntaxError('Geen JSON gevonden in het antwoord.')
  }
}
