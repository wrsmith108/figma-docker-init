import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'V0 Landing Page',
  description: 'A modern landing page built with V0 and Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
