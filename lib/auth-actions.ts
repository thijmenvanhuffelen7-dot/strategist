'use server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { maakToken, SESSIE_COOKIE, SESSIE_DUUR_SEC, wachtwoord } from './sessie'

const hash = (s: string) => createHash('sha256').update(s).digest()

export async function login(_vorige: { fout: string } | null, formData: FormData): Promise<{ fout: string } | null> {
  const ww = wachtwoord()
  if (!ww) return { fout: 'Er is nog geen wachtwoord ingesteld. Zet APP_WACHTWOORD in de omgevingsvariabelen (Vercel → Settings → Environment Variables) en deploy opnieuw.' }
  const ingevuld = String(formData.get('wachtwoord') ?? '')
  // Vergelijken in vaste tijd, en bij een fout even wachten: dat maakt raden lastiger.
  if (!timingSafeEqual(hash(ingevuld), hash(ww))) {
    await new Promise((r) => setTimeout(r, 800))
    return { fout: 'Onjuist wachtwoord.' }
  }
  ;(await cookies()).set(SESSIE_COOKIE, await maakToken(ww), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSIE_DUUR_SEC,
  })
  const terug = String(formData.get('terug') ?? '/')
  redirect(terug.startsWith('/') && !terug.startsWith('//') ? terug : '/')
}

export async function logout() {
  ;(await cookies()).delete(SESSIE_COOKIE)
  redirect('/login')
}
