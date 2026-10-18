import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { mediaLink } from '../opslag'

/** Afbeelding als link die de AI-provider kan ophalen: ondertekende Blob-link, of data-URL voor lokale bestanden. */
export async function afbeeldingVoorAi(ref: string, type: string): Promise<string | null> {
  if (ref.startsWith('lokaal:')) {
    const data = await readFile(path.join(process.cwd(), 'uploads', path.basename(ref.slice(7)))).catch(() => null)
    if (!data || data.byteLength > 4 * 1024 * 1024) return null // limiet voor afbeeldingen als data-URL
    return `data:${type};base64,${data.toString('base64')}`
  }
  const link = await mediaLink(ref)
  return link?.startsWith('https://') ? link : null
}
