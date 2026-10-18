// Kiest de provider en het model. Wisselen naar een andere provider = hier een nieuwe toevoegen
// (bijv. lib/ai/anthropic.ts met dezelfde interface) en AI_PROVIDER in .env.local zetten.
import { prisma } from '../db'
import { groq } from './groq'
import type { AiProvider } from './provider'

const PROVIDERS: Record<string, AiProvider> = { groq }

export function getProvider(): AiProvider {
  return PROVIDERS[process.env.AI_PROVIDER ?? 'groq'] ?? groq
}

/** Model uit Instellingen, anders uit .env.local (GROQ_MODEL), anders de standaard van de provider. */
export async function getModel(provider = getProvider()): Promise<string> {
  const profiel = await prisma.profiel.findUnique({ where: { id: 1 }, select: { ai_model: true } })
  return profiel?.ai_model || process.env.GROQ_MODEL || provider.standaardModel
}

export { AiFout, RateLimitError } from './provider'
