// Toont media alleen aan ingelogde gebruikers. Lokale bestanden met ondersteuning voor doorspoelen (Range).
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { get } from '@vercel/blob'
import { isIngelogd } from '@/lib/auth'
import { UPLOAD_MAP } from '@/lib/opslag'

const TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' }

export async function GET(request: Request) {
  if (!(await isIngelogd())) return new Response('Niet ingelogd', { status: 401 })
  const ref = new URL(request.url).searchParams.get('ref') ?? ''

  if (ref.startsWith('blob:')) {
    const res = await get(ref.slice(5), { access: 'private' }).catch(() => null)
    if (!res || res.statusCode !== 200) return new Response('Niet gevonden', { status: 404 })
    return new Response(res.stream, { headers: { 'Content-Type': res.blob.contentType, 'Cache-Control': 'private, max-age=3600' } })
  }

  if (!ref.startsWith('lokaal:')) return new Response('Ongeldig', { status: 400 })
  const bestand = path.join(UPLOAD_MAP, path.basename(ref.slice(7)))
  const info = await stat(bestand).catch(() => null)
  if (!info) return new Response('Niet gevonden', { status: 404 })
  const type = TYPES[path.extname(bestand).toLowerCase()] ?? 'application/octet-stream'
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') ?? '')
  if (range) {
    const start = range[1] ? Number(range[1]) : 0
    const eind = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1
    return new Response(Readable.toWeb(createReadStream(bestand, { start, end: eind })) as ReadableStream, {
      status: 206,
      headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${eind}/${info.size}`, 'Content-Length': String(eind - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' },
    })
  }
  return new Response(Readable.toWeb(createReadStream(bestand)) as ReadableStream, {
    headers: { 'Content-Type': type, 'Content-Length': String(info.size), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=3600' },
  })
}
