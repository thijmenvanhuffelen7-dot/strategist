// Zod-schema's voor de AI-uitvoer, plus een voorbeeld dat in de prompt meegaat zodat het model de vorm kent.
// Schema's zijn bewust vergevingsgezind bij kleine afwijkingen (bijv. score als tekst), maar streng op de kern.
import { z } from 'zod'
import { ANGLE_TYPES, BEWUSTZIJNSNIVEAUS, BRANCHES, CRO_CATEGORIEEN, EMOTIES, FORMAT_TYPES, FREQUENTIES, HOOK_TYPES, NIVEAUS } from '../builder-types'

// Tekst uit het AI-antwoord. Let op: z.coerce.string() maakt van een ontbrekend veld de tekst "undefined";
// daarom eerst null/undefined → '' en lege items uit lijsten filteren.
const naarTekst = (v: unknown) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const str = z.preprocess(naarTekst, z.string())
const tekst = str.catch('')
const tekstLijst = z
  .array(z.unknown())
  .transform((a) => a.map(naarTekst).map((t) => t.trim()).filter(Boolean))
  .catch([])

function kiesUit<T extends readonly string[]>(opties: T, standaard: T[number]) {
  return z.preprocess(
    (v) => {
      const s = String(v ?? '').toLowerCase().trim()
      return opties.find((o) => o.toLowerCase() === s) ?? opties.find((o) => s.includes(o.toLowerCase())) ?? standaard
    },
    z.enum(opties as unknown as [T[number], ...T[number][]]),
  )
}

export const onderzoekSchema = z.object({
  pijnpunten: z
    .array(
      z.object({
        omschrijving: z.string().min(1),
        frequentie: kiesUit(FREQUENTIES, 'soms'),
        quotes: tekstLijst.transform((q) => q.slice(0, 3)),
        emotie: tekst,
      }),
    )
    .min(1),
  verlangens: tekstLijst,
  bezwaren: z.array(z.object({ bezwaar: z.string().min(1), wegnemen: tekst })).catch([]),
  aha_momenten: tekstLijst,
  klanttaal: tekstLijst,
  bewustzijnsniveau: z.object({ niveau: kiesUit(BEWUSTZIJNSNIVEAUS, 'problem aware'), uitleg: tekst }),
})
export type OnderzoekOutput = z.infer<typeof onderzoekSchema>

export const onderzoekVoorbeeld = {
  pijnpunten: [{ omschrijving: '…', frequentie: 'vaak | soms | zelden', quotes: ['letterlijke quote'], emotie: '…' }],
  verlangens: ['…'],
  bezwaren: [{ bezwaar: '…', wegnemen: 'hoe een ad dit wegneemt' }],
  aha_momenten: ['…'],
  klanttaal: ['letterlijk woord of zinnetje'],
  bewustzijnsniveau: { niveau: BEWUSTZIJNSNIVEAUS.join(' | '), uitleg: '…' },
}

export const anglesSchema = z.object({
  angles: z
    .array(
      z.object({
        naam: z.string().min(1),
        type: kiesUit(ANGLE_TYPES, 'pijnpunt'),
        kernboodschap: tekst,
        doelgroep: tekst,
        onderbouwing: tekst,
        risico: tekst,
        score: z.coerce.number().catch(5).transform((n) => Math.min(10, Math.max(1, Math.round(n)))),
      }),
    )
    .min(1),
})
export type AnglesOutput = z.infer<typeof anglesSchema>

export const anglesVoorbeeld = {
  angles: [
    {
      naam: '…',
      type: ANGLE_TYPES.join(' | '),
      kernboodschap: 'één zin',
      doelgroep: 'voor wie',
      onderbouwing: 'waarom het werkt, met verwijzing naar pijnpunten/quotes',
      risico: '…',
      score: 7,
    },
  ],
}

export const hooksSchema = z.object({
  hooks: z
    .array(
      z.object({
        gesproken: z.string().min(1),
        overlay: tekst,
        eerste_shot: tekst,
        type: kiesUit(HOOK_TYPES, 'directe aanspreking'),
      }),
    )
    .min(1),
})
export type HooksOutput = z.infer<typeof hooksSchema>

export const hooksVoorbeeld = {
  hooks: [{ gesproken: 'max 12 woorden', overlay: '…', eerste_shot: '…', type: HOOK_TYPES.join(' | ') }],
}

export const briefSchema = z.object({
  titel: z.string().min(1),
  overzicht: z.object({ angle: tekst, doel: tekst, platform: tekst, formaat: tekst, lengte: tekst, format_type: tekst }),
  doelgroep: z.object({ persona: tekst, situatie: tekst, bewustzijnsniveau: tekst }),
  boodschap: z.object({ kernboodschap: tekst, bewijs: tekst, bezwaar: tekst }),
  script: z
    .array(z.object({ tijd: tekst, fase: tekst, beeld: tekst, gesproken: tekst, tekst_op_beeld: tekst, opmerkingen: tekst }))
    .min(2),
  testvariaties: z.object({ hooks: tekstLijst, cta: tekst, format: tekst }),
  richtlijnen: z.object({ toon: tekst, setting: tekst, muziek: tekst, ondertitels: tekst, dos: tekstLijst, donts: tekstLijst }),
  succescriteria: z.array(z.object({ metric: tekst, drempel: tekst, toelichting: tekst })).catch([]),
})
export type BriefOutput = z.infer<typeof briefSchema>

export const briefVoorbeeld = {
  titel: '…',
  overzicht: { angle: '…', doel: '…', platform: '…', formaat: '9:16 | 4:5', lengte: '30 sec', format_type: '…' },
  doelgroep: { persona: '3–4 zinnen', situatie: '…', bewustzijnsniveau: '…' },
  boodschap: { kernboodschap: '…', bewijs: '…', bezwaar: '…' },
  script: [{ tijd: '0–3s', fase: 'hook | probleem | oplossing | bewijs | bezwaar | CTA', beeld: '…', gesproken: '…', tekst_op_beeld: '…', opmerkingen: '…' }],
  testvariaties: { hooks: ['…', '…', '…'], cta: '…', format: '…' },
  richtlijnen: { toon: '…', setting: '…', muziek: '…', ondertitels: '…', dos: ['…'], donts: ['…'] },
  succescriteria: [{ metric: 'hook rate', drempel: '≥ 30%', toelichting: '…' }],
}

export const reviewSchema = z.object({
  zwakste_aannames: z.array(z.object({ punt: z.string().min(1), waarom: tekst, verbetering: tekst })).min(1),
  ontbrekende_info: tekstLijst,
  oordeel: tekst,
  score: z.coerce.number().catch(5).transform((n) => Math.min(10, Math.max(1, Math.round(n)))),
})
export type ReviewOutput = z.infer<typeof reviewSchema>

export const reviewVoorbeeld = {
  zwakste_aannames: [{ punt: '…', waarom: '…', verbetering: '…' }],
  ontbrekende_info: ['…'],
  oordeel: '2–3 zinnen',
  score: 6,
}

export const croSchema = z.object({
  score: z.coerce.number().catch(5).transform((n) => Math.min(10, Math.max(1, Math.round(n)))),
  samenvatting: tekst,
  quick_wins: z.array(z.object({ titel: tekst, actie: tekst })).catch([]),
  punten: z
    .array(
      z.object({
        categorie: kiesUit(CRO_CATEGORIEEN, 'waardepropositie'),
        bron: z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : 'tekst'), z.string()).catch('tekst'),
        probleem: z.string().min(1),
        bewijs: tekst,
        aanbeveling: tekst,
        voorbeeldtekst: tekst,
        impact: kiesUit(NIVEAUS, 'midden'),
        moeite: kiesUit(NIVEAUS, 'midden'),
      }),
    )
    .min(3),
  testideeen: z.array(z.object({ hypothese: tekst, variant: tekst, metric: tekst })).catch([]),
})
export type CroOutput = z.infer<typeof croSchema>

export const croVoorbeeld = {
  score: 6,
  samenvatting: '2–3 zinnen',
  quick_wins: [{ titel: '…', actie: '…' }],
  punten: [
    {
      categorie: CRO_CATEGORIEEN.join(' | '),
      bron: 'tekst | screenshot <label>',
      probleem: '…',
      bewijs: 'letterlijk citaat van de pagina, of wat er ontbreekt',
      aanbeveling: '…',
      voorbeeldtekst: 'kant-en-klare tekst',
      impact: 'hoog | midden | laag',
      moeite: 'hoog | midden | laag',
    },
  ],
  testideeen: [{ hypothese: 'Als we … dan … omdat …', variant: '…', metric: 'conversieratio' }],
}

export const swipeSchema = z.object({
  hook: z.object({ gesproken: tekst, visueel: tekst, type: kiesUit(HOOK_TYPES, 'directe aanspreking') }),
  angle: z.object({ naam: tekst, type: kiesUit(ANGLE_TYPES, 'pijnpunt'), kernboodschap: tekst }),
  structuur: z.array(z.object({ tijd: tekst, fase: tekst, wat: tekst })).catch([]),
  emotie: tekst,
  pijnpunt: tekst,
  bewustzijnsniveau: kiesUit(BEWUSTZIJNSNIVEAUS, 'problem aware'),
  redenen: tekstLijst.pipe(z.array(z.string()).min(1)),
  toepassingen: z.array(z.object({ idee: tekst, hoe: tekst })).catch([]),
  tags: z
    .object({
      branche: kiesUit(BRANCHES, 'overig'),
      format: kiesUit(FORMAT_TYPES, 'UGC talking head'),
      hook_type: kiesUit(HOOK_TYPES, 'directe aanspreking'),
      angle_type: kiesUit(ANGLE_TYPES, 'pijnpunt'),
      emotie: kiesUit(EMOTIES, 'herkenning'),
    })
    .catch({ branche: 'overig', format: 'UGC talking head', hook_type: 'directe aanspreking', angle_type: 'pijnpunt', emotie: 'herkenning' }),
})
export type SwipeOutput = z.infer<typeof swipeSchema>

export const swipeVoorbeeld = {
  hook: { gesproken: 'letterlijk de eerste zin', visueel: 'wat je in de eerste 1–3 sec ziet', type: HOOK_TYPES.join(' | ') },
  angle: { naam: '…', type: ANGLE_TYPES.join(' | '), kernboodschap: 'één zin' },
  structuur: [{ tijd: '0–3s', fase: 'hook | probleem | oplossing | bewijs | bezwaar | CTA', wat: '…' }],
  emotie: '…',
  pijnpunt: '…',
  bewustzijnsniveau: BEWUSTZIJNSNIVEAUS.join(' | '),
  redenen: ['…', '…', '…'],
  toepassingen: [{ idee: '…', hoe: 'concreet voor het gekozen project' }],
  tags: { branche: BRANCHES.join(' | '), format: FORMAT_TYPES.join(' | '), hook_type: HOOK_TYPES.join(' | '), angle_type: ANGLE_TYPES.join(' | '), emotie: EMOTIES.join(' | ') },
}

export const croVisueelSchema = z.object({
  boven_de_vouw: tekst,
  cta: tekst,
  hierarchie: tekst,
  vertrouwen: tekst,
  leesbaarheid: tekst,
  problemen: z.array(z.object({ probleem: tekst, waar: tekst })).catch([]),
})

export const croVisueelVoorbeeld = {
  boven_de_vouw: '…',
  cta: '…',
  hierarchie: '…',
  vertrouwen: '…',
  leesbaarheid: '…',
  problemen: [{ probleem: '…', waar: 'bijv. rechtsboven, onder de kop' }],
}
