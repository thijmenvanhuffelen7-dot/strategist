'use client'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Bookmark } from 'lucide-react'
import { Button } from './ui'

export function QuickActions() {
  const router = useRouter()
  return (
    <>
      <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => router.push('/projecten/nieuw')}>
        Nieuw project
      </Button>
      <Button icon={<FileText className="size-4" />} onClick={() => router.push('/briefs')}>
        Nieuwe brief
      </Button>
      <Button icon={<Bookmark className="size-4" />} onClick={() => router.push('/swipe')}>
        Ad toevoegen
      </Button>
    </>
  )
}
