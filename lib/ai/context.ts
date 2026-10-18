// Bouwt de context die per AI-functie wordt meegestuurd. Alleen wat nodig is, om tokens te sparen.
import type { AngleData, BriefInhoud, HookData, ResearchData } from '../builder-types'
import { doelLabel, type Project } from '../types'
import { kapAf } from './tokens'

export function projectContext(p: Project, opties: { landingspagina?: boolean; drempels?: boolean } = {}) {
  const regels = [
    `Product/merk: ${p.naam}`,
    p.omschrijving && `Omschrijving: ${p.omschrijving}`,
    p.prijs && `Prijs: ${p.prijs}`,
    p.doelgroep && `Doelgroep (volgens de klant): ${p.doelgroep}`,
    `Campagnedoel: ${doelLabel(p.doel)}`,
    p.platforms.length && `Platforms: ${p.platforms.join(', ')}`,
    `Taal van de ads: ${p.taal}`,
    p.concurrenten.length && `Concurrenten: ${p.concurrenten.map((c) => c.naam || c.url).join(', ')}`,
    opties.drempels && Object.keys(p.drempels).length && `Drempelwaarden project: ${JSON.stringify(p.drempels)}`,
    opties.landingspagina && p.landingspagina_tekst && `Landingspagina-tekst:\n${kapAf(p.landingspagina_tekst, 600)}`,
  ]
  return `# Projectinfo\n${regels.filter(Boolean).join('\n')}`
}

/** Compacte samenvatting van het onderzoek; items met een ster eerst. */
export function researchContext(r: ResearchData, opties: { quotes?: number } = {}) {
  const q = opties.quotes ?? 1
  const sterEerst = <T extends { ster: boolean }>(a: T[]) => [...a].sort((x, y) => Number(y.ster) - Number(x.ster))
  const ster = (s: boolean) => (s ? ' ★' : '')
  return [
    '# Klantonderzoek (goedgekeurd)',
    'Pijnpunten:',
    ...sterEerst(r.pijnpunten).map(
      (p) => `- ${p.omschrijving} (${p.frequentie}, emotie: ${p.emotie})${ster(p.ster)}${p.quotes.slice(0, q).map((x) => `\n  "${x}"`).join('')}`,
    ),
    'Verlangens:',
    ...sterEerst(r.verlangens).map((v) => `- ${v.tekst}${ster(v.ster)}`),
    'Bezwaren:',
    ...sterEerst(r.bezwaren).map((b) => `- ${b.bezwaar} → wegnemen: ${b.wegnemen}${ster(b.ster)}`),
    r.aha_momenten.length ? 'Aha-momenten:' : '',
    ...r.aha_momenten.map((a) => `- ${a.tekst}`),
    `Klanttaal: ${sterEerst(r.klanttaal).map((k) => `"${k.tekst}"`).join(', ')}`,
    r.bewustzijnsniveau ? `Bewustzijnsniveau: ${r.bewustzijnsniveau.niveau} – ${r.bewustzijnsniveau.uitleg}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function angleContext(a: AngleData) {
  return [
    `# Gekozen angle: ${a.naam}`,
    a.type && `Type: ${a.type}`,
    a.kernboodschap && `Kernboodschap: ${a.kernboodschap}`,
    a.doelgroep && `Voor wie: ${a.doelgroep}`,
    a.onderbouwing && `Waarom het werkt: ${a.onderbouwing}`,
    a.risico && `Risico: ${a.risico}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function hookContext(h: HookData) {
  return [`# Gekozen hook`, `Gesproken: ${h.gesproken}`, h.overlay && `Overlay: ${h.overlay}`, h.eerste_shot && `Eerste shot: ${h.eerste_shot}`, h.type && `Type: ${h.type}`]
    .filter(Boolean)
    .join('\n')
}

export function briefContext(titel: string, b: BriefInhoud) {
  return `# Brief: ${titel}\n${JSON.stringify({ ...b, script: b.script.map((r) => ({ tijd: r.tijd, fase: r.fase, beeld: r.beeld, gesproken: r.gesproken, tekst_op_beeld: r.tekst_op_beeld, opmerkingen: r.opmerkingen })) })}`
}
