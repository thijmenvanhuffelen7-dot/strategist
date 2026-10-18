/** Info over de AI-instelling, door de server meegegeven aan de pagina. */
export interface AiInfo {
  ingesteld: boolean
  ontbrekendeKeyMelding: string
  model: string
  dagLimiet: number
}
