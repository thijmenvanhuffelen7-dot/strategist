import { FileText } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'

export default function BriefsPage() {
  return (
    <Placeholder title="Brief Builder" description="Van klantonderzoek naar creative brief in 4 stappen." icon={<FileText />} phase={2}>
      Stap 1 klantonderzoek → stap 2 angles → stap 3 hooks → stap 4 creative brief, telkens met AI-output die je kunt bewerken, opnieuw
      genereren of goedkeuren, plus een kritische review als creative director.
    </Placeholder>
  )
}
