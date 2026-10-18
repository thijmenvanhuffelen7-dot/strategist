// Haalt een webpagina op en zet die om naar leesbare tekst voor de CRO-check.
// Veiligheid: alleen http(s), geen interne/lokale adressen (ook niet via een doorverwijzing), tijdslimiet en maximale grootte.
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { parse, type HTMLElement } from 'node-html-parser'

const MAX_BYTES = 3 * 1024 * 1024
const TIMEOUT_MS = 12_000
const MAX_DOORVERWIJZINGEN = 4

export class OphaalFout extends Error {}

function privéAdres(ip: string): boolean {
  if (isIP(ip) === 6) {
    const l = ip.toLowerCase()
    if (l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80')) return true
    const v4 = /::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l)
    return v4 ? privéAdres(v4[1]) : false
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

async function controleerUrl(ruw: string): Promise<URL> {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(ruw.trim()) && !/^https?:\/\//i.test(ruw.trim())) throw new OphaalFout('Alleen http- en https-adressen zijn toegestaan.')
  let url: URL
  try {
    url = new URL(ruw.trim().match(/^https?:\/\//i) ? ruw.trim() : `https://${ruw.trim()}`)
  } catch {
    throw new OphaalFout('Dit is geen geldig webadres.')
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new OphaalFout('Alleen http- en https-adressen zijn toegestaan.')
  // Alleen voor lokaal testen (nooit in productie): lokale adressen toestaan.
  const lokaalToegestaan = process.env.NODE_ENV !== 'production' && process.env.CRO_LOKAAL_TOESTAAN === '1'
  if (lokaalToegestaan) return url
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new OphaalFout('Interne adressen kunnen niet worden opgehaald.')
  const adressen = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (!adressen.length) throw new OphaalFout(`Kon ${host} niet vinden. Klopt het adres?`)
  if (adressen.some((a) => privéAdres(a.address))) throw new OphaalFout('Interne adressen kunnen niet worden opgehaald.')
  return url
}

async function haalHtml(start: string): Promise<{ html: string; url: string }> {
  let url = await controleerUrl(start)
  for (let i = 0; i <= MAX_DOORVERWIJZINGEN; i++) {
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StrategistOS-CRO-check/1.0)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'nl,en;q=0.8',
        },
      })
    } catch (e) {
      throw new OphaalFout((e as Error).name === 'TimeoutError' ? 'De website reageerde niet op tijd.' : 'De website kon niet worden bereikt.')
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = await controleerUrl(new URL(res.headers.get('location')!, url).toString())
      continue
    }
    if (res.status === 403 || res.status === 401 || res.status === 429) throw new OphaalFout('Deze website blokkeert automatisch ophalen. Plak de tekst van de pagina zelf.')
    if (!res.ok) throw new OphaalFout(`De website gaf een fout (${res.status}).`)
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('html')) throw new OphaalFout('Dit adres is geen webpagina (geen HTML).')
    const lengte = Number(res.headers.get('content-length') ?? 0)
    if (lengte > MAX_BYTES) throw new OphaalFout('De pagina is te groot om op te halen.')
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) throw new OphaalFout('De pagina is te groot om op te halen.')
    return { html: new TextDecoder().decode(buf), url: url.toString() }
  }
  throw new OphaalFout('Te veel doorverwijzingen.')
}

const schoon = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim()
const uniek = (lijst: string[], max: number) => [...new Set(lijst.map(schoon).filter((x) => x.length > 1))].slice(0, max)

/** Zet HTML om naar een gestructureerd tekstoverzicht van de pagina. */
export function htmlNaarTekst(html: string): { titel: string; tekst: string } {
  const root = parse(html, { comment: false })
  const titel = schoon(root.querySelector('title')?.text) || schoon(root.querySelector('h1')?.text) || 'Naamloze pagina'
  const meta = schoon(root.querySelector('meta[name="description"]')?.getAttribute('content'))
  root.querySelectorAll('script, style, noscript, svg, iframe, template').forEach((el) => el.remove())

  const koppen = root.querySelectorAll('h1, h2, h3').map((h) => `${h.tagName.toLowerCase()}: ${schoon(h.text)}`)
  const knoppen = uniek(
    root.querySelectorAll('button, input[type=submit], a[class*="btn"], a[class*="button"], a[role="button"], [class*="cta"]').map((el: HTMLElement) => el.getAttribute('value') ?? el.text),
    25,
  )
  const lichaam = root.querySelector('main') ?? root.querySelector('body') ?? root
  // Blokken tekst in leesvolgorde, zonder menu's en footers.
  lichaam.querySelectorAll('nav, footer, header nav').forEach((el) => el.remove())
  const blokken = uniek(
    lichaam.querySelectorAll('h1, h2, h3, h4, p, li, blockquote, td, figcaption, label, summary').map((el) => el.text),
    400,
  ).filter((b) => b.length < 600)
  const volledig = blokken.join('\n')
  const prijzen = uniek(volledig.match(/(?:€|\$|£)\s?\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s?(?:€|euro)/gi) ?? [], 10)
  const signalen = {
    reviews: /review|beoordeling|sterren|★|klanten zeggen|trustpilot|kiyoh/i.test(volledig),
    garantie: /garantie|geld.?terug|retour|proef(?:periode|slapen)|niet goed/i.test(volledig),
    verzending: /verzend|bezorg|levering|shipping/i.test(volledig),
  }

  const tekst = [
    `Titel: ${titel}`,
    meta && `Meta-omschrijving: ${meta}`,
    prijzen.length ? `Gevonden prijzen: ${prijzen.join(', ')}` : 'Gevonden prijzen: geen',
    `Signalen: reviews ${signalen.reviews ? 'ja' : 'nee'}, garantie/retour ${signalen.garantie ? 'ja' : 'nee'}, verzendinfo ${signalen.verzending ? 'ja' : 'nee'}`,
    `\nKnoppen/CTA's:\n${knoppen.map((k) => `- ${k}`).join('\n') || '- (geen gevonden)'}`,
    `\nKoppen:\n${koppen.slice(0, 40).join('\n')}`,
    `\nPaginatekst (in volgorde):\n${volledig}`,
  ]
    .filter(Boolean)
    .join('\n')
  return { titel, tekst }
}

export async function haalPaginaOp(url: string) {
  const { html, url: eindUrl } = await haalHtml(url)
  const { titel, tekst } = htmlNaarTekst(html)
  if (tekst.length < 400) throw new OphaalFout('Op deze pagina staat bijna geen tekst in de HTML (de site laadt de inhoud waarschijnlijk pas later). Plak de tekst van de pagina zelf.')
  return { titel, tekst, url: eindUrl }
}
