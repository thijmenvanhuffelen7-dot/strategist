import type { ReactNode } from 'react'
import { EmptyState, PageHeader } from '../components/ui'

export function Placeholder({ title, description, icon, phase, children }: { title: string; description: string; icon: ReactNode; phase: number; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={`Komt in fase ${phase}`}>
        {children}
      </EmptyState>
    </>
  )
}
