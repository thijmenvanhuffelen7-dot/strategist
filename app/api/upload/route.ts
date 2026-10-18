// Geeft de browser toestemming om direct naar Vercel Blob te uploaden (privé). Alleen voor ingelogde gebruikers.
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isIngelogd } from '@/lib/auth'
import { MAX_VIDEO, MEDIA_TYPES } from '@/lib/media'

export async function POST(request: Request) {
  if (!(await isIngelogd())) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'Geen Blob-opslag gekoppeld' }, { status: 400 })
  const body = (await request.json()) as HandleUploadBody
  try {
    const res = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('swipe/')) throw new Error('Ongeldig pad')
        return { allowedContentTypes: [...MEDIA_TYPES], maximumSizeInBytes: MAX_VIDEO, addRandomSuffix: true }
      },
    })
    return Response.json(res)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
