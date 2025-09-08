'use client'

import { ThirdwebProvider as Provider } from "thirdweb/react"
import { client, wallets, inAppWallet, smartWallet } from "../lib/thirdweb"

export function ThirdwebProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
    </Provider>
  )
}