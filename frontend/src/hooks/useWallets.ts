/**
 * Unified Wallet Hook
 * 
 * Manages both Polkadot.js (Substrate) and MetaMask (EVM) wallet connections
 * Provides unified interface for accessing both wallet types
 */

import { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { connectMetaMask } from '../utils/evmContractIntegration'
import type { ethers } from 'ethers'

const RPC_URL = import.meta.env.VITE_POLKADOT_RPC_URL || 'wss://westend-rpc.polkadot.io'

export interface PolkadotWallet {
  accounts: InjectedAccountWithMeta[]
  selectedAccount: InjectedAccountWithMeta | null
  api: ApiPromise | null
  isConnected: boolean
  isManualMode: boolean
}

export interface EVMWallet {
  address: string
  signer: ethers.JsonRpcSigner | null
  provider: ethers.BrowserProvider | null
  isConnected: boolean
}

export interface WalletState {
  polkadot: PolkadotWallet
  evm: EVMWallet
  isLoading: boolean
}

const initialPolkadotState: PolkadotWallet = {
  accounts: [],
  selectedAccount: null,
  api: null,
  isConnected: false,
  isManualMode: false
}

const initialEVMState: EVMWallet = {
  address: '',
  signer: null,
  provider: null,
  isConnected: false
}

export function useWallets() {
  const [polkadot, setPolkadot] = useState<PolkadotWallet>(initialPolkadotState)
  const [evm, setEVM] = useState<EVMWallet>(initialEVMState)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize Polkadot API
  useEffect(() => {
    let provider: WsProvider | null = null
    let apiInstance: ApiPromise | null = null
    let cancelled = false

    const initApi = async () => {
      try {
        console.log('[Wallets] Initializing Polkadot API connection to:', RPC_URL)
        provider = new WsProvider(RPC_URL)
        apiInstance = await ApiPromise.create({ provider })
        
        if (!cancelled) {
          setPolkadot(prev => ({ ...prev, api: apiInstance }))
          console.log('[Wallets] Polkadot API connected successfully')
        }
      } catch (error) {
        console.error('[Wallets] Failed to initialize Polkadot API:', error)
        if (!cancelled) {
          setPolkadot(prev => ({ ...prev, api: null }))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    initApi()

    return () => {
      cancelled = true
      if (apiInstance) {
        apiInstance.disconnect().catch(console.error)
      }
      if (provider) {
        provider.disconnect().catch(console.error)
      }
    }
  }, [])

  // Connect Polkadot.js wallet
  const connectPolkadot = useCallback(async () => {
    try {
      console.log('[Wallets] Connecting to Polkadot extension...')
      const extensions = await web3Enable('DotFlex')
      
      if (extensions.length === 0) {
        const install = confirm('Polkadot.js extension not found.\n\nWould you like to install it now?')
        if (install) {
          window.open('https://polkadot.js.org/extension/', '_blank')
        }
        throw new Error('Polkadot.js extension not installed')
      }

      const allAccounts = await web3Accounts()
      console.log('[Wallets] Found Polkadot accounts:', allAccounts.length)
      
      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create an account in Polkadot.js extension.')
      }

      setPolkadot({
        accounts: allAccounts,
        selectedAccount: allAccounts[0],
        api: polkadot.api,
        isConnected: true,
        isManualMode: false
      })
      
      console.log('[Wallets] ✓ Polkadot wallet connected')
      return true
    } catch (error: any) {
      console.error('[Wallets] Failed to connect Polkadot wallet:', error)
      throw error
    }
  }, [polkadot.api])

  // Connect EVM wallet
  const connectEVM = useCallback(async () => {
    try {
      console.log('[Wallets] Connecting to EVM wallet...')
      const connection = await connectMetaMask()
      
      if (!connection) {
        throw new Error('EVM wallet connection failed. Please install an EVM wallet extension.')
      }

      setEVM({
        address: connection.address,
        signer: connection.signer,
        provider: connection.provider,
        isConnected: true
      })
      
      console.log('[Wallets] ✓ EVM wallet connected:', connection.address)
      return true
    } catch (error: any) {
      console.error('[Wallets] Failed to connect EVM wallet:', error)
      // Re-throw with user-friendly message
      const errorMessage = error.message || 'Failed to connect EVM wallet. Please make sure your wallet is unlocked and try again.'
      throw new Error(errorMessage)
    }
  }, [])

  // Connect manual Polkadot address
  const connectManualPolkadot = useCallback((address: string) => {
    try {
      if (!address || address.trim().length === 0) {
        throw new Error('Please enter a valid address')
      }

      const manualAccount: InjectedAccountWithMeta = {
        address: address.trim(),
        meta: {
          name: '',
          source: 'manual',
          genesisHash: null,
          whenCreated: Date.now()
        }
      }

      setPolkadot({
        accounts: [manualAccount],
        selectedAccount: manualAccount,
        api: polkadot.api,
        isConnected: false, // Manual entry is NOT a connected wallet
        isManualMode: true
      })
      
      console.log('[Wallets] ✓ Manual Polkadot address connected:', address)
      return true
    } catch (error: any) {
      console.error('[Wallets] Failed to connect manual address:', error)
      throw error
    }
  }, [polkadot.api])

  // Disconnect Polkadot wallet
  const disconnectPolkadot = useCallback(() => {
    setPolkadot(initialPolkadotState)
    console.log('[Wallets] Polkadot wallet disconnected')
  }, [])

  // Disconnect EVM wallet
  const disconnectEVM = useCallback(() => {
    setEVM(initialEVMState)
    console.log('[Wallets] EVM wallet disconnected')
  }, [])

  // Disconnect all wallets
  const disconnectAll = useCallback(() => {
    disconnectPolkadot()
    disconnectEVM()
  }, [disconnectPolkadot, disconnectEVM])

  return {
    polkadot,
    evm,
    isLoading,
    connectPolkadot,
    connectEVM,
    connectManualPolkadot,
    disconnectPolkadot,
    disconnectEVM,
    disconnectAll
  }
}

