import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import './globals.css'
import { AppShell } from '@/components/AppShell'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { getProfiel } from '@/lib/data'
import { THEME_SCRIPT } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Strategist OS',
  description: 'Werkplek voor creative strategists',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="nl" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <Script id="thema" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <ConfirmProvider>
          <AppShell
            profiel={
              <Suspense fallback={<ProfielWeergave naam={null} />}>
                <ProfielNaam />
              </Suspense>
            }
          >
            {children}
          </AppShell>
        </ConfirmProvider>
      </body>
    </html>
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
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{naam || 'Lokaal profiel'}</span>
    </>
  )
}
