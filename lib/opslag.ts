// Opslag van screenshots en video's. Online: Vercel Blob (privé). Lokaal zonder Blob-token: de map /uploads.
// In de database staat een verwijzing: "blob:<pad>" of "lokaal:<bestandsnaam>".
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { del, issueSignedToken, presignUrl, type IssuedSignedToken } from '@vercel/blob'

export const UPLOAD_MAP = path.join(process.cwd(), 'uploads')

export function blobActief() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/** Veilige bestandsnaam voor de lokale map. */
export function lokaleNaam(origineel: string) {
  const ext = path.extname(origineel).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 6)
  return `${randomUUID()}${ext}`
}

export async function bewaarLokaal(bestand: File): Promise<string> {
  await mkdir(UPLOAD_MAP, { recursive: true })
  const naam = lokaleNaam(bestand.name)
  await writeFile(path.join(UPLOAD_MAP, naam), Buffer.from(await bestand.arrayBuffer()))
  return `lokaal:${naam}`
}

// Eén ondertekend leestoken per serverproces, steeds ruim op tijd vernieuwd.
let token: IssuedSignedToken | null = null
async function leesToken() {
  if (!token || token.validUntil - Date.now() < 10 * 60_000) {
    token = await issueSignedToken({ pathname: '*', operations: ['get'], validUntil: Date.now() + 60 * 60_000 })
  }
  return token
}

/** Link om media te tonen. Alleen aanroepen voor ingelogde gebruikers. */
export async function mediaLink(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null
  if (ref.startsWith('lokaal:')) return `/api/media?ref=${encodeURIComponent(ref)}`
  if (ref.startsWith('blob:')) {
    const pathname = ref.slice(5)
    try {
      const t = await leesToken()
      return (await presignUrl(t, { operation: 'get', pathname, access: 'private' })).presignedUrl
    } catch (e) {
      // Terugval: via onze eigen server (werkt altijd, maar video's kunnen dan niet doorspoelen).
      console.warn('[opslag] ondertekende link mislukt, terugval via server:', (e as Error).message)
      return `/api/media?ref=${encodeURIComponent(ref)}`
    }
  }
  return null
}

export async function verwijderMedia(ref: string | null | undefined) {
  if (!ref) return
  try {
    if (ref.startsWith('lokaal:')) await unlink(path.join(UPLOAD_MAP, path.basename(ref.slice(7))))
    else if (ref.startsWith('blob:') && blobActief()) await del(ref.slice(5))
  } catch (e) {
    console.warn('[opslag] verwijderen mislukt:', (e as Error).message)
  }
}
