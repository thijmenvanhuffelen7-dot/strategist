import Link from 'next/link'
import { EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <EmptyState title="Pagina niet gevonden" actions={<Link href="/" className="text-sm text-accent-600 hover:underline">Naar het dashboard</Link>}>
      Dit project of deze pagina bestaat niet (meer).
    </EmptyState>
  )
}
