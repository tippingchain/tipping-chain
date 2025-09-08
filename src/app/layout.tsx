import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThirdwebProvider } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StreamTip - Cross-chain Tipping with ApeChain Settlement',
  description: 'Tip streamers with any crypto, automatically settled in USDC on ApeChain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  )
}