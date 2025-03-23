import './globals.css'
import './styles/custom.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import StoreProvider from './StoreProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'MelodyVerse - Sync Music with Friends',
  description: 'Listen to YouTube music together with friends in real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles/custom.css" />
        <link rel="stylesheet" href="/styles/utilities.css" />
        <link rel="stylesheet" href="/_next/static/css/app/layout.css" precedence="high" />
      </head>
      <body className="antialiased text-foreground bg-background min-h-screen">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
} 