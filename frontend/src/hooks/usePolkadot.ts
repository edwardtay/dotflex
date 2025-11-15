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

  useEffect(() => {
    let provider: WsProvider | null = null
    let apiInstance: ApiPromise | null = null

    const initApi = async () => {
      try {
        console.log('Initializing Polkadot API connection to:', RPC_URL)
        provider = new WsProvider(RPC_URL)
        apiInstance = await ApiPromise.create({ provider })
        setApi(apiInstance)
        console.log('Polkadot API connected successfully')
      } catch (error) {
        console.error('Failed to initialize Polkadot API:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initApi()

    return () => {
      if (apiInstance) {
        apiInstance.disconnect()
      }
      if (provider) {
        provider.disconnect()
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
      console.log('Wallet connected successfully')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet. Please check Polkadot.js extension.')
    }
  }, [])

  return {
    api,
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    connectWallet,
    setSelectedAccount
  }
}

