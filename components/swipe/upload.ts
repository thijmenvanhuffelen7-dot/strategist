'use client'
import { upload } from '@vercel/blob/client'
import { controleerBestand } from '@/lib/media'

/** Uploadt een bestand: naar Vercel Blob (privé) als dat is gekoppeld, anders naar de lokale map. Geeft de verwijzing terug. */
export async function uploadBestand(bestand: File, blob: boolean, voortgang?: (procent: number) => void, map: 'swipe' | 'cro' = 'swipe'): Promise<{ ref: string; type: string }> {
  const fout = controleerBestand(bestand.type, bestand.size)
  if (fout) throw new Error(fout)
  if (blob) {
    const veiligeNaam = (bestand.name || 'screenshot.png').replace(/[^\w.\-]+/g, '-').slice(-80)
    const res = await upload(`${map}/${veiligeNaam}`, bestand, {
      access: 'private',
      handleUploadUrl: '/api/upload',
      multipart: bestand.size > 10 * 1024 * 1024,
      contentType: bestand.type,
      onUploadProgress: (e) => voortgang?.(Math.round(e.percentage)),
    })
    return { ref: `blob:${res.pathname}`, type: bestand.type }
  }
  const form = new FormData()
  form.append('bestand', bestand)
  const res = await fetch('/api/upload-lokaal', { method: 'POST', body: form })
  const data = (await res.json()) as { ref?: string; type?: string; fout?: string }
  if (!res.ok || !data.ref) throw new Error(data.fout ?? 'Uploaden mislukt.')
  voortgang?.(100)
  return { ref: data.ref, type: data.type ?? bestand.type }
}
