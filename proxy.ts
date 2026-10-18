// Eerste filter: wie niet is ingelogd, gaat naar /login (API-verzoeken krijgen 401).
// De echte controle zit daarnaast in elke databasefunctie en server action (lib/auth.ts).
import { NextResponse, type NextRequest } from 'next/server'
import { loginUitgeschakeld, SESSIE_COOKIE, tokenGeldig } from './lib/sessie'

export async function proxy(request: NextRequest) {
  if (loginUitgeschakeld() || (await tokenGeldig(request.cookies.get(SESSIE_COOKIE)?.value))) return NextResponse.next()
  const { pathname, search } = request.nextUrl
  if (pathname.startsWith('/api/')) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })
  const url = new URL('/login', request.url)
  if (pathname !== '/') url.searchParams.set('terug', pathname + search)
  return NextResponse.redirect(url)
}

export const config = {
  // Alles behalve het inlogscherm en statische bestanden.
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}
