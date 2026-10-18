import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { THEME_SCRIPT } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Creative Strategist OS',
  description: 'Werkplek voor creative strategists',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="nl" className="h-full" suppressHydrationWarning>
      <body className="h-full">
        <Script id="thema" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  )
}
