import type { Metadata } from 'next'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'InzuConnect',
  description: 'Trouvez votre logement idéal, en toute sécurité.',
  openGraph: {
    title: 'InzuConnect',
    description: 'Logements de confiance dans la région des Grands Lacs.',
    url: 'https://inzuconnect.com',
    siteName: 'InzuConnect',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
