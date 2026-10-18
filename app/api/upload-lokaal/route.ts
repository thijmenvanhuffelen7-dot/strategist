// Lokale upload naar de map /uploads (alleen als er geen Blob-opslag is gekoppeld).
import { isIngelogd } from '@/lib/auth'
import { controleerBestand } from '@/lib/media'
import { bewaarLokaal, blobActief } from '@/lib/opslag'

export async function POST(request: Request) {
  if (!(await isIngelogd())) return Response.json({ fout: 'Niet ingelogd' }, { status: 401 })
  if (blobActief()) return Response.json({ fout: 'Gebruik de Blob-upload' }, { status: 400 })
  if (process.env.VERCEL) return Response.json({ fout: 'Koppel eerst Blob-opslag in Vercel (Storage → Blob).' }, { status: 400 })
  const bestand = (await request.formData()).get('bestand')
  if (!(bestand instanceof File)) return Response.json({ fout: 'Geen bestand ontvangen' }, { status: 400 })
  const fout = controleerBestand(bestand.type, bestand.size)
  if (fout) return Response.json({ fout }, { status: 400 })
  return Response.json({ ref: await bewaarLokaal(bestand), type: bestand.type })
}
