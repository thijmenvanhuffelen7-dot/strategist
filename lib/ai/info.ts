import { getModel, getProvider } from './index'
import type { AiInfo } from '@/components/ai/types'

export async function getAiInfo(): Promise<AiInfo> {
  const p = getProvider()
  return {
    ingesteld: p.isIngesteld(),
    ontbrekendeKeyMelding: p.ontbrekendeKeyMelding,
    model: await getModel(p),
    dagLimiet: Number(process.env.AI_TOKENS_PER_DAG) || 200_000,
  }
}
