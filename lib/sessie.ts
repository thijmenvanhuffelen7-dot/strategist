// Sessiekoekje: "<vervaldatum>.<handtekening>", ondertekend met een sleutel die is afgeleid van APP_WACHTWOORD.
// Verander je het wachtwoord, dan zijn alle bestaande sessies meteen ongeldig.
// Gebruikt Web Crypto, zodat dit zowel in proxy.ts als in server-code werkt.

export const SESSIE_COOKIE = 'sos_sessie'
export const SESSIE_DUUR_SEC = 30 * 24 * 60 * 60 // 30 dagen

const enc = new TextEncoder()

/** Is er een wachtwoord ingesteld? */
export function wachtwoord(): string | undefined {
  return process.env.APP_WACHTWOORD || undefined
}

/** Zonder wachtwoord is de app alleen open tijdens lokaal ontwikkelen (`npm run dev`); online blijft hij dan dicht. */
export function loginUitgeschakeld(): boolean {
  return !wachtwoord() && process.env.NODE_ENV !== 'production'
}

async function sleutel(ww: string) {
  const ruw = await crypto.subtle.digest('SHA-256', enc.encode(`strategist-os|sessie|${ww}`))
  return crypto.subtle.importKey('raw', ruw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

const naarB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const vanB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

export async function maakToken(ww: string): Promise<string> {
  const verloopt = String(Math.floor(Date.now() / 1000) + SESSIE_DUUR_SEC)
  const handtekening = await crypto.subtle.sign('HMAC', await sleutel(ww), enc.encode(verloopt))
  return `${verloopt}.${naarB64(handtekening)}`
}

export async function tokenGeldig(token: string | undefined): Promise<boolean> {
  const ww = wachtwoord()
  if (!ww || !token) return false
  const [verloopt, handtekening] = token.split('.')
  if (!verloopt || !handtekening || Number(verloopt) < Date.now() / 1000) return false
  try {
    return await crypto.subtle.verify('HMAC', await sleutel(ww), vanB64(handtekening), enc.encode(verloopt))
  } catch {
    return false
  }
}
