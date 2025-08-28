import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { RegisterSW } from '@/components/pwa/register-sw'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RegisterSW />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Taskmaster',
  description: 'Tasks companion with offline support for SiYuan',
  manifest: '/manifest.webmanifest',
  themeColor: '#0f172a',
}
