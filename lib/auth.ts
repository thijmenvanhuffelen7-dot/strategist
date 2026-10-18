// Inlogcontrole voor server-code. Elke databasefunctie, server action en API-route roept dit aan
// (proxy.ts stuurt al door naar /login, maar dat is alleen een eerste filter).
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { loginUitgeschakeld, SESSIE_COOKIE, tokenGeldig } from './sessie'

export async function isIngelogd(): Promise<boolean> {
  if (loginUitgeschakeld()) return true
  return tokenGeldig((await cookies()).get(SESSIE_COOKIE)?.value)
}

/** Niet ingelogd? Dan naar het inlogscherm. */
export async function vereisLogin() {
  if (!(await isIngelogd())) redirect('/login')
}
