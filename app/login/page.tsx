import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isIngelogd } from '@/lib/auth'
import { wachtwoord } from '@/lib/sessie'
import { LoginForm } from '@/components/LoginForm'

export const metadata = { title: 'Inloggen – Strategist OS' }

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent-600 text-sm font-bold text-white">S</div>
          <span className="text-lg font-semibold tracking-tight">Strategist OS</span>
        </div>
        <Suspense fallback={<div className="card h-48" />}>
          <Inhoud searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function Inhoud({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  if (await isIngelogd()) redirect('/')
  const { terug } = await searchParams
  return <LoginForm terug={typeof terug === 'string' ? terug : '/'} wachtwoordIngesteld={Boolean(wachtwoord())} />
}
