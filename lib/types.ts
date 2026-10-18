export const PLATFORMS = ['Meta', 'TikTok', 'YouTube Shorts', 'Overig'] as const
export type Platform = (typeof PLATFORMS)[number]

export const DOELEN = [
  { value: 'cold_traffic', label: 'Cold traffic' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'lancering', label: 'Lancering' },
  { value: 'overig', label: 'Overig' },
] as const
export type Doel = (typeof DOELEN)[number]['value']

export const TALEN = ['Nederlands', 'Engels', 'Duits', 'Frans', 'Spaans'] as const

export interface Concurrent {
  naam: string
  url: string
}

export interface Drempels {
  hook_rate?: number
  hold_rate?: number
  ctr?: number
  cpa?: number
  roas?: number
}

export const STANDAARD_DREMPELS: Drempels = { hook_rate: 30, hold_rate: 10, ctr: 1, cpa: 30, roas: 2 }

export interface Project {
  id: string
  naam: string
  omschrijving: string | null
  prijs: string | null
  url: string | null
  landingspagina_tekst: string | null
  doelgroep: string | null
  platforms: Platform[]
  doel: Doel | null
  taal: string
  concurrenten: Concurrent[]
  klantdata: string | null
  drempels: Drempels
  is_voorbeeld: boolean
  aangemaakt_op: Date
  bijgewerkt_op: Date
}

export type ProjectInput = Omit<Project, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>

export interface Profiel {
  naam: string | null
  standaard_taal: string
  standaard_platform: string
  drempels: Drempels
  tag_lijsten: Record<string, string[]>
}

export function doelLabel(doel: string | null | undefined) {
  return DOELEN.find((d) => d.value === doel)?.label ?? '—'
}

export function emptyProject(taal = 'Nederlands', platform?: string): ProjectInput {
  return {
    naam: '',
    omschrijving: '',
    prijs: '',
    url: '',
    landingspagina_tekst: '',
    doelgroep: '',
    platforms: PLATFORMS.includes(platform as Platform) ? [platform as Platform] : [],
    doel: 'cold_traffic',
    taal,
    concurrenten: [],
    klantdata: '',
    drempels: {},
    is_voorbeeld: false,
  }
}

/** Project zonder id en tijdstempels, voor het bewerkformulier. */
export function toInput(p: Project): ProjectInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, aangemaakt_op, bijgewerkt_op, ...rest } = p
  return rest
}
