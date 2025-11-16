/**
 * Enhanced Polkadot Wallet Detection
 * 
 * Detects and connects to multiple Polkadot wallet extensions
 */

import { web3Enable, web3Accounts, web3FromAddress } from '@polkadot/extension-dapp'
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types'

export interface WalletInfo {
  name: string
  displayName: string
  icon?: string
  installed: boolean
  extension?: InjectedExtension
}

export interface DetectedWallet extends WalletInfo {
  accounts: InjectedAccountWithMeta[]
}

// Known Polkadot wallet extensions
export const POLKADOT_WALLETS: WalletInfo[] = [
  {
    name: 'polkadot-js',
    displayName: 'Polkadot.js Extension',
    installed: false
  },
  {
    name: 'talisman',
    displayName: 'Talisman',
    installed: false
  },
  {
    name: 'subwallet-js',
    displayName: 'SubWallet',
    installed: false
  },
  {
    name: 'nova-wallet',
    displayName: 'Nova Wallet',
    installed: false
  },
  {
    name: 'fearless-wallet',
    displayName: 'Fearless Wallet',
    installed: false
  },
  {
    name: 'enkrypt',
    displayName: 'Enkrypt',
    installed: false
  },
  {
    name: 'polkagate',
    displayName: 'PolkaGate',
    installed: false
  }
]

/**
 * Detect all available Polkadot wallets
 */
export async function detectPolkadotWallets(): Promise<DetectedWallet[]> {
  try {
    console.log('[Wallet] Detecting Polkadot wallets...')
    
    // Enable all extensions
    const extensions = await web3Enable('WhatSub Portfolio Tracker')
    console.log('[Wallet] Found extensions:', extensions.map(ext => ext.name))
    
    if (extensions.length === 0) {
      console.warn('[Wallet] No Polkadot wallet extensions found')
      return []
    }
    
    // Get all accounts from all extensions
    const allAccounts = await web3Accounts()
    console.log('[Wallet] Total accounts found:', allAccounts.length)
    
    // Group accounts by wallet extension
    const detectedWallets: DetectedWallet[] = []
    
    for (const walletInfo of POLKADOT_WALLETS) {
      const extension = extensions.find(ext => 
        ext.name.toLowerCase().includes(walletInfo.name.toLowerCase()) ||
        walletInfo.name.toLowerCase().includes(ext.name.toLowerCase())
      )
      
      if (extension) {
        // Get accounts for this specific wallet
        const walletAccounts = allAccounts.filter(account => 
          account.meta.source === extension.name ||
          account.meta.source?.toLowerCase().includes(walletInfo.name.toLowerCase())
        )
        
        detectedWallets.push({
          ...walletInfo,
          installed: true,
          extension,
          accounts: walletAccounts
        })
        
        console.log(`[Wallet] ${walletInfo.displayName}: ${walletAccounts.length} accounts`)
      }
    }
    
    // Handle any unrecognized extensions
    for (const extension of extensions) {
      const isKnown = detectedWallets.some(wallet => wallet.extension?.name === extension.name)
      if (!isKnown) {
        const unknownAccounts = allAccounts.filter(account => 
          account.meta.source === extension.name
        )
        
        detectedWallets.push({
          name: extension.name,
          displayName: extension.name,
          installed: true,
          extension,
          accounts: unknownAccounts
        })
        
        console.log(`[Wallet] Unknown wallet ${extension.name}: ${unknownAccounts.length} accounts`)
      }
    }
    
    return detectedWallets
    
  } catch (error) {
    console.error('[Wallet] Failed to detect wallets:', error)
    return []
  }
}

/**
 * Get signer for a specific account
 */
export async function getAccountSigner(address: string) {
  try {
    const injector = await web3FromAddress(address)
    return injector.signer
  } catch (error) {
    console.error('[Wallet] Failed to get signer for address:', address, error)
    throw new Error(`Failed to get signer for account ${address.slice(0, 8)}...`)
  }
}

/**
 * Check if any Polkadot wallets are installed
 */
export function checkWalletInstallation(): { hasWallets: boolean; installedWallets: string[] } {
  const installedWallets: string[] = []
  
  // Check for common wallet extensions in window object
  if (typeof window !== 'undefined') {
    if (window.injectedWeb3?.['polkadot-js']) installedWallets.push('Polkadot.js Extension')
    if (window.injectedWeb3?.['talisman']) installedWallets.push('Talisman')
    if (window.injectedWeb3?.['subwallet-js']) installedWallets.push('SubWallet')
    if (window.injectedWeb3?.['nova-wallet']) installedWallets.push('Nova Wallet')
    if (window.injectedWeb3?.['fearless-wallet']) installedWallets.push('Fearless Wallet')
    if (window.injectedWeb3?.['enkrypt']) installedWallets.push('Enkrypt')
    if (window.injectedWeb3?.['polkagate']) installedWallets.push('PolkaGate')
  }
  
  return {
    hasWallets: installedWallets.length > 0,
    installedWallets
  }
}

/**
 * Get wallet installation links
 */
export const WALLET_INSTALL_LINKS = {
  'polkadot-js': 'https://polkadot.js.org/extension/',
  'talisman': 'https://talisman.xyz/',
  'subwallet-js': 'https://subwallet.app/',
  'nova-wallet': 'https://novawallet.io/',
  'fearless-wallet': 'https://fearlesswallet.io/',
  'enkrypt': 'https://enkrypt.com/',
  'polkagate': 'https://polkagate.xyz/'
} as const

declare global {
  interface Window {
    injectedWeb3?: Record<string, any>
  }
}