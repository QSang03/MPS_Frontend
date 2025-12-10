import type { Metadata } from 'next'
import { Inter, Roboto, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import TokenRefreshProvider from '@/components/providers/TokenRefreshProvider'
import { Toaster } from '@/components/ui/sonner'
import ThemeApplier from '@/components/providers/ThemeApplier'
import LocaleProvider from '@/components/providers/LocaleProvider'

// Modern font stack for better Vietnamese support
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const roboto = Roboto({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-roboto',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'MPS - CHÍNH NHÂN TECHNOLOGY - Managed Print Services',
  description: 'Comprehensive print management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${roboto.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <TokenRefreshProvider>
            <LocaleProvider>
              {children}
              <ThemeApplier />
              <Toaster />
            </LocaleProvider>
          </TokenRefreshProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
