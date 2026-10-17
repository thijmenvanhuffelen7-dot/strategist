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
  aangemaakt_op: string
  bijgewerkt_op: string
}

export type ProjectInput = Omit<Project, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>

export interface Profile {
  id: string
  naam: string | null
  standaard_taal: string
  standaard_platform: string
  drempels: Drempels
  tag_lijsten: Record<string, string[]>
}

export function doelLabel(doel: string | null | undefined) {
  return DOELEN.find((d) => d.value === doel)?.label ?? '—'
}
