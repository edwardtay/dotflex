// Type declarations for EVM wallets (MetaMask, Brave Wallet, Coinbase Wallet, etc.)

interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isBraveWallet?: boolean
    isCoinbaseWallet?: boolean
    providers?: Array<{
      isMetaMask?: boolean
      isBraveWallet?: boolean
      isCoinbaseWallet?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      send: (method: string, params?: any[]) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
    }> // Some wallets expose multiple providers
    request: (args: { method: string; params?: any[] }) => Promise<any>
    send: (method: string, params?: any[]) => Promise<any>
    on: (event: string, handler: (...args: any[]) => void) => void
    removeListener: (event: string, handler: (...args: any[]) => void) => void
  }
}

