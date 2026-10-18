import Papa from 'papaparse'

const TEXT_COLUMN = /review|tekst|text|comment|body|content|bericht|opmerking|beoordeling|feedback/i

/** Zet een geüpload .txt- of .csv-bestand om naar platte tekst om aan de klantdata toe te voegen. */
export async function fileToKlantdata(file: File): Promise<{ text: string; count: number }> {
  const raw = await file.text()
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { text: raw.trim(), count: raw.split(/\n\s*\n/).filter((b) => b.trim()).length }
  }

  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  const fields = parsed.meta.fields ?? []
  const textCols = fields.filter((f) => TEXT_COLUMN.test(f))
  const rows = parsed.data
    .map((row) => {
      const cols = textCols.length ? textCols : fields
      return cols
        .map((c) => row[c]?.trim())
        .filter(Boolean)
        .join(textCols.length ? '\n' : ' | ')
    })
    .filter(Boolean)

  return { text: rows.map((r) => `[Review uit ${file.name}]\n${r}`).join('\n\n'), count: rows.length }
}

export function countEntries(text: string | null | undefined) {
  if (!text?.trim()) return 0
  return text.split(/\n\s*\n/).filter((b) => b.trim()).length
}
