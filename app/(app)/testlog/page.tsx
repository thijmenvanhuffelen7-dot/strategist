import { FlaskConical } from 'lucide-react'
import { Placeholder } from '@/components/Placeholder'

export default function TestlogPage() {
  return (
    <Placeholder title="Testlog" description="Creative-tests, metrics en lessen." icon={<FlaskConical />} phase={4}>
      Handmatige invoer en CSV-import uit Meta/TikTok Ads Manager, automatisch berekende metrics, grafieken en AI-analyse.
    </Placeholder>
  )
}
