import { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'

export interface ChainConfig {
  name: string
  rpcUrl: string
  token: string
  decimals: number
  enabled: boolean
}

export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    name: 'Polkadot',
    rpcUrl: 'wss://rpc.polkadot.io',
    token: 'DOT',
    decimals: 10,
    enabled: true
  },
  {
    name: 'Kusama',
    rpcUrl: 'wss://kusama-rpc.polkadot.io',
    token: 'KSM',
    decimals: 12,
    enabled: true
  },
  {
    name: 'Westend',
    rpcUrl: 'wss://westend-rpc.polkadot.io',
    token: 'WND',
    decimals: 12,
    enabled: true
  },
  {
    name: 'Astar',
    rpcUrl: 'wss://rpc.astar.network',
    token: 'ASTR',
    decimals: 18,
    enabled: true
  },
  {
    name: 'Moonbeam',
    rpcUrl: 'wss://wss.api.moonbeam.network',
    token: 'GLMR',
    decimals: 18,
    enabled: true
  },
  {
    name: 'Moonriver',
    rpcUrl: 'wss://wss.api.moonriver.moonbeam.network',
    token: 'MOVR',
    decimals: 18,
    enabled: true
  },
  {
    name: 'Acala',
    rpcUrl: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    token: 'ACA',
    decimals: 12,
    enabled: true
  },
  {
    name: 'Karura',
    rpcUrl: 'wss://karura.api.onfinality.io/public-ws',
    token: 'KAR',
    decimals: 12,
    enabled: true
  },
  {
    name: 'Bifrost',
    rpcUrl: 'wss://bifrost-rpc.liebi.com/ws',
    token: 'BNC',
    decimals: 12,
    enabled: true
  }
]

export interface ChainApi {
  chain: ChainConfig
  api: ApiPromise | null
  isLoading: boolean
  error: string | null
}

export function useMultiChain(chains: ChainConfig[] = DEFAULT_CHAINS.filter(c => c.enabled)) {
  const [chainApis, setChainApis] = useState<Map<string, ChainApi>>(new Map())
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const apis = new Map<string, ChainApi>()
    let cancelled = false

    const initChains = async () => {
      setIsInitializing(true)
      
      // Initialize all chains
      for (const chain of chains) {
        apis.set(chain.name, {
          chain,
          api: null,
          isLoading: true,
          error: null
        })
      }
      setChainApis(new Map(apis))

      // Connect to each chain
      const connectionPromises = chains.map(async (chain) => {
        try {
          console.log(`Connecting to ${chain.name}...`)
          const provider = new WsProvider(chain.rpcUrl)
          const api = await ApiPromise.create({ provider })
          
          if (!cancelled) {
            apis.set(chain.name, {
              chain,
              api,
              isLoading: false,
              error: null
            })
            setChainApis(new Map(apis))
            console.log(`Connected to ${chain.name}`)
          } else {
            await api.disconnect()
          }
        } catch (error: any) {
          console.error(`Failed to connect to ${chain.name}:`, error)
          if (!cancelled) {
            apis.set(chain.name, {
              chain,
              api: null,
              isLoading: false,
              error: error.message || 'Connection failed'
            })
            setChainApis(new Map(apis))
          }
        }
      })

      await Promise.allSettled(connectionPromises)
      
      if (!cancelled) {
        setIsInitializing(false)
      }
    }

    initChains()

    return () => {
      cancelled = true
      // Disconnect all APIs
      apis.forEach((chainApi) => {
        if (chainApi.api) {
          chainApi.api.disconnect().catch(console.error)
        }
      })
    }
  }, [chains.map(c => c.rpcUrl).join(',')])

  const getBalance = useCallback(async (chainName: string, address: string): Promise<{
    free: string
    reserved: string
    total: string
    token: string
  } | null> => {
    const chainApi = chainApis.get(chainName)
    if (!chainApi || !chainApi.api) {
      return null
    }

    try {
      const accountData = await chainApi.api.query.system.account(address)
      const balance = accountData.data
      
      const decimals = chainApi.chain.decimals
      const free = balance.free.toString()
      const reserved = balance.reserved.toString()
      const total = balance.free.add(balance.reserved).toString()
      
      // Convert to BigInt for division, then format with decimals
      const freeBigInt = BigInt(free)
      const reservedBigInt = BigInt(reserved)
      const totalBigInt = BigInt(total)
      const divisor = BigInt(10 ** decimals)
      
      // Calculate with proper decimal handling
      const freeFormatted = (freeBigInt / divisor).toString() + '.' + 
        (freeBigInt % divisor).toString().padStart(decimals, '0').replace(/0+$/, '').replace(/\.$/, '')
      const reservedFormatted = (reservedBigInt / divisor).toString() + '.' + 
        (reservedBigInt % divisor).toString().padStart(decimals, '0').replace(/0+$/, '').replace(/\.$/, '')
      const totalFormatted = (totalBigInt / divisor).toString() + '.' + 
        (totalBigInt % divisor).toString().padStart(decimals, '0').replace(/0+$/, '').replace(/\.$/, '')
      
      return {
        free: freeFormatted || '0',
        reserved: reservedFormatted || '0',
        total: totalFormatted || '0',
        token: chainApi.chain.token
      }
    } catch (error) {
      console.error(`Failed to get balance from ${chainName} for ${address.substring(0, 8)}...:`, error)
      return null
    }
  }, [chainApis])

  return {
    chainApis: Array.from(chainApis.values()),
    isInitializing,
    getBalance
  }
}

