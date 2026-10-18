'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { loadSampleProject } from '@/lib/actions'
import { Button } from '../ui'

export function SampleProjectButton({ variant = 'button' }: { variant?: 'button' | 'link' }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const load = () =>
    startTransition(async () => {
      const id = await loadSampleProject()
      router.push(`/projecten/${id}`)
    })

  if (variant === 'link')
    return (
      <button onClick={load} disabled={pending} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <Sparkles className="mr-1 inline size-3.5" /> Laad voorbeeldproject (Slaapwel)
      </button>
    )
  return (
    <Button icon={<Sparkles className="size-4" />} loading={pending} onClick={load}>
      Laad voorbeeldproject
    </Button>
  )
}
