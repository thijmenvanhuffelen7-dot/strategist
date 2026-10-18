import { Suspense } from 'react'
import { AppShell } from '@/components/AppShell'
import { getProfiel } from '@/lib/data'
import { wachtwoord } from '@/lib/sessie'

// Layout met zijbalk voor alle pagina's behalve het inlogscherm.
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <AppShell
      metLogin={Boolean(wachtwoord())}
      profiel={
        <Suspense fallback={<ProfielWeergave naam={null} />}>
          <ProfielNaam />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  )
}

async function ProfielNaam() {
  const profiel = await getProfiel()
  return <ProfielWeergave naam={profiel.naam} />
}

function ProfielWeergave({ naam }: { naam: string | null }) {
  return (
    <>
      <div className="flex size-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium uppercase dark:bg-zinc-800">{naam?.[0] ?? '?'}</div>
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{naam || 'Profiel'}</span>
    </>
  )
}
