// Vormen van de Brief Builder-data zoals ze in de database (Json-velden) en de interface gebruikt worden.

export const FREQUENTIES = ['vaak', 'soms', 'zelden'] as const
export type Frequentie = (typeof FREQUENTIES)[number]

export const BEWUSTZIJNSNIVEAUS = ['unaware', 'problem aware', 'solution aware', 'product aware', 'most aware'] as const
export type Bewustzijnsniveau = (typeof BEWUSTZIJNSNIVEAUS)[number]

export const ANGLE_TYPES = [
  'pijnpunt',
  'verlangen',
  'vijand',
  'bezwaar-ontkrachtend',
  'identiteit',
  'vergelijking',
  'nieuw mechanisme',
  'social proof',
  'gemak',
  'contrair',
] as const

export const HOOK_TYPES = [
  'vraag',
  'gedurfde stelling',
  'POV',
  'resultaat eerst',
  'waarschuwing',
  'nieuwsgierigheidskloof',
  'directe aanspreking',
  'visueel',
] as const

export const FORMAT_TYPES = [
  'UGC talking head',
  'demo',
  'voor/na',
  'street interview',
  'green screen',
  'skit',
  'unboxing',
  'testimonial-montage',
] as const

export const BRIEF_STATUSSEN = ['concept', 'klaar', 'in_productie', 'live', 'gearchiveerd'] as const
export type BriefStatus = (typeof BRIEF_STATUSSEN)[number]

export interface Pijnpunt {
  id: string
  omschrijving: string
  frequentie: Frequentie
  quotes: string[]
  emotie: string
  ster: boolean
}
export interface TekstItem {
  id: string
  tekst: string
  ster: boolean
}
export interface Bezwaar {
  id: string
  bezwaar: string
  wegnemen: string
  ster: boolean
}
export interface BewustzijnsInfo {
  niveau: Bewustzijnsniveau
  uitleg: string
}

export interface ResearchData {
  pijnpunten: Pijnpunt[]
  verlangens: TekstItem[]
  bezwaren: Bezwaar[]
  aha_momenten: TekstItem[]
  klanttaal: TekstItem[]
  bewustzijnsniveau: BewustzijnsInfo | null
  goedgekeurd: boolean
  bijgewerkt_op: Date
}

export interface AngleData {
  id: string
  naam: string
  type: string | null
  kernboodschap: string | null
  doelgroep: string | null
  onderbouwing: string | null
  risico: string | null
  score: number | null
  geselecteerd: boolean
  eigen: boolean
}

export interface HookData {
  id: string
  angle_id: string | null
  gesproken: string | null
  overlay: string | null
  eerste_shot: string | null
  type: string | null
  ster: boolean
}

export interface ScriptRij {
  id: string
  tijd: string
  fase: string
  beeld: string
  gesproken: string
  tekst_op_beeld: string
  opmerkingen: string
}

export interface BriefInhoud {
  overzicht: { angle: string; doel: string; platform: string; formaat: string; lengte: string; format_type: string }
  doelgroep: { persona: string; situatie: string; bewustzijnsniveau: string }
  boodschap: { kernboodschap: string; bewijs: string; bezwaar: string }
  script: ScriptRij[]
  testvariaties: { hooks: string[]; cta: string; format: string }
  richtlijnen: { toon: string; setting: string; muziek: string; ondertitels: string; dos: string[]; donts: string[] }
  succescriteria: { metric: string; drempel: string; toelichting: string }[]
}

export interface BriefData {
  id: string
  project_id: string
  angle_id: string | null
  hook_id: string | null
  titel: string
  inhoud: BriefInhoud
  status: BriefStatus
  aangemaakt_op: Date
  bijgewerkt_op: Date
}

export interface ReviewResultaat {
  zwakste_aannames: { punt: string; waarom: string; verbetering: string }[]
  ontbrekende_info: string[]
  oordeel: string
  score: number
}

export const REVIEW_STAPPEN = ['onderzoek', 'angles', 'hooks', 'brief', 'cro'] as const
export type ReviewStap = (typeof REVIEW_STAPPEN)[number]

export interface AiVersie {
  id: string
  aangemaakt_op: Date
  model: string | null
  tokens: number
}

export interface Verbruik {
  inputTokens: number
  outputTokens: number
}

export function legeBriefInhoud(): BriefInhoud {
  return {
    overzicht: { angle: '', doel: '', platform: '', formaat: '9:16', lengte: '', format_type: '' },
    doelgroep: { persona: '', situatie: '', bewustzijnsniveau: '' },
    boodschap: { kernboodschap: '', bewijs: '', bezwaar: '' },
    script: [],
    testvariaties: { hooks: ['', '', ''], cta: '', format: '' },
    richtlijnen: { toon: '', setting: '', muziek: '', ondertitels: '', dos: [], donts: [] },
    succescriteria: [],
  }
}

// --- CRO-check -----------------------------------------------------------------

export const CRO_CATEGORIEEN = [
  'boven de vouw',
  'waardepropositie',
  'social proof',
  'bezwaren & risico-omkering',
  'CTA & flow',
  'prijs & aanbod',
  'vertrouwen',
  'aansluiting ads & klanttaal',
] as const
export const NIVEAUS = ['hoog', 'midden', 'laag'] as const
export type Niveau = (typeof NIVEAUS)[number]

export interface CroPunt {
  id: string
  categorie: string
  probleem: string
  bewijs: string
  aanbeveling: string
  voorbeeldtekst: string
  impact: Niveau
  moeite: Niveau
  gedaan: boolean
}

export interface CroAnalyse {
  score: number
  samenvatting: string
  quick_wins: { titel: string; actie: string }[]
  punten: CroPunt[]
  testideeen: { hypothese: string; variant: string; metric: string }[]
}

/** Prioriteit: hoge impact en lage moeite eerst. */
export function croPrioriteit(p: Pick<CroPunt, 'impact' | 'moeite'>) {
  const w = { hoog: 3, midden: 2, laag: 1 }
  return w[p.impact] * 2 - w[p.moeite]
}
