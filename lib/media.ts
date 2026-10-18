// Gedeeld (browser + server): welke bestanden mogen worden geüpload.
export const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'] as const
export const MAX_AFBEELDING = 15 * 1024 * 1024
export const MAX_VIDEO = 100 * 1024 * 1024

export function controleerBestand(type: string, grootte: number): string | null {
  if (!(MEDIA_TYPES as readonly string[]).includes(type)) return 'Alleen afbeeldingen (png, jpg, webp, gif) en video’s (mp4, mov, webm) zijn toegestaan.'
  const max = type.startsWith('video/') ? MAX_VIDEO : MAX_AFBEELDING
  if (grootte > max) return `Bestand is te groot (max ${Math.round(max / 1024 / 1024)} MB).`
  return null
}
