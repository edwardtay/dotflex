import { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'

const RPC_URL = import.meta.env.VITE_POLKADOT_RPC_URL || 'wss://westend-rpc.polkadot.io'

export function usePolkadot() {
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isManualMode, setIsManualMode] = useState(false)

  useEffect(() => {
    let provider: WsProvider | null = null
    let apiInstance: ApiPromise | null = null
    let cancelled = false

    const initApi = async () => {
      try {
        console.log('Initializing Polkadot API connection to:', RPC_URL)
        provider = new WsProvider(RPC_URL)
        apiInstance = await ApiPromise.create({ provider })
        
        if (!cancelled) {
          setApi(apiInstance)
          console.log('Polkadot API connected successfully')
        }
      } catch (error) {
        console.error('Failed to initialize Polkadot API:', error)
        if (!cancelled) {
          // Set API to null but still allow app to render
          setApi(null)
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

  const connectWallet = useCallback(async () => {
    try {
      console.log('Connecting to Polkadot extension...')
      const extensions = await web3Enable('Identity Portfolio Manager')
      
      if (extensions.length === 0) {
        alert('Please install Polkadot.js extension')
        return
      }

      const allAccounts = await web3Accounts()
      console.log('Found accounts:', allAccounts.length)
      
      if (allAccounts.length === 0) {
        alert('No accounts found. Please create an account in Polkadot.js extension')
        return
      }

      setAccounts(allAccounts)
      setSelectedAccount(allAccounts[0])
      setIsConnected(true)
      setIsManualMode(false)
      console.log('Wallet connected successfully')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet. Please check Polkadot.js extension.')
    }
  }, [])

  const connectManualAddress = useCallback((address: string) => {
    try {
      // Validate address format (basic check)
      if (!address || address.trim().length === 0) {
        alert('Please enter a valid address')
        return false
      }

      // Create a mock account object for manual entry
      const manualAccount: InjectedAccountWithMeta = {
        address: address.trim(),
        meta: {
          name: 'Manual Entry',
          source: 'manual',
          genesisHash: null,
          whenCreated: Date.now()
        }
      }

      setAccounts([manualAccount])
      setSelectedAccount(manualAccount)
      setIsConnected(true)
      setIsManualMode(true)
      console.log('Manual address connected:', address)
      return true
    } catch (error) {
      console.error('Failed to connect manual address:', error)
      alert('Failed to connect address. Please check the address format.')
      return false
    }
  }, [])

  return {
    api,
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    isManualMode,
    connectWallet,
    connectManualAddress,
    setSelectedAccount
  }
}

