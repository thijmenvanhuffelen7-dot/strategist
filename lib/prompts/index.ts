// Overzicht van alle AI-functies en hun standaardprompt (de bestanden in deze map).
// Een aangepaste versie in de database (tabel prompt_templates) gaat voor; zonder aanpassing geldt het bestand.
import { prisma } from '../db'
import { angles } from './angles'
import { brief } from './brief'
import { cro } from './cro'
import { hooks } from './hooks'
import { onderzoek } from './onderzoek'
import { onderzoekSamenvoegen } from './onderzoek-samenvoegen'
import { review } from './review'

export const PROMPTS = {
  onderzoek: { titel: 'Klantonderzoek', standaard: onderzoek },
  onderzoek_samenvoegen: { titel: 'Klantonderzoek samenvoegen (grote klantdata)', standaard: onderzoekSamenvoegen },
  angles: { titel: 'Angles', standaard: angles },
  hooks: { titel: 'Hooks', standaard: hooks },
  brief: { titel: 'Creative brief', standaard: brief },
  review: { titel: 'Kritische review', standaard: review },
  cro: { titel: 'CRO-check', standaard: cro },
} as const

export type PromptFunctie = keyof typeof PROMPTS

export async function getSysteemprompt(functie: PromptFunctie): Promise<string> {
  const eigen = await prisma.promptTemplate.findUnique({ where: { functie } })
  return eigen?.systeemprompt?.trim() || PROMPTS[functie].standaard
}
