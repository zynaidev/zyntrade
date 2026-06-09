import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZynTrade',
  description: 'Trading journal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" data-scroll-behavior="smooth">
      <body className={inter.className} style={{ background: '#080810', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
