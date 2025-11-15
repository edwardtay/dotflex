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
    rpcUrl: 'wss://astar-rpc.dwellir.com',
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
    rpcUrl: 'wss://acala-rpc.dwellir.com',
    token: 'ACA',
    decimals: 12,
    enabled: true
  },
  {
    name: 'Karura',
    rpcUrl: 'wss://karura-rpc.dwellir.com',
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

      // Connect to each chain with retry logic
      const connectionPromises = chains.map(async (chain) => {
        const maxRetries = 2
        let lastError: any = null
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`Retrying connection to ${chain.name} (attempt ${attempt + 1}/${maxRetries + 1})...`)
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt)) // Exponential backoff
            } else {
              console.log(`Connecting to ${chain.name}...`)
            }
            
            const provider = new WsProvider(chain.rpcUrl, 5000) // 5 second timeout
            const api = await Promise.race([
              ApiPromise.create({ provider }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 15000)
              )
            ]) as ApiPromise
            
            // Wait for API to be ready
            await api.isReady
            
            if (!cancelled) {
              activeConnections.push(api)
              apis.set(chain.name, {
                chain,
                api,
                isLoading: false,
                error: null
              })
              setChainApis(new Map(apis))
              console.log(`✓ Connected to ${chain.name}`)
              return // Success, exit retry loop
            } else {
              await api.disconnect()
              return
            }
          } catch (error: any) {
            lastError = error
            console.warn(`Failed to connect to ${chain.name} (attempt ${attempt + 1}):`, error.message || error)
            
            // If this was the last attempt, mark as failed
            if (attempt === maxRetries && !cancelled) {
              apis.set(chain.name, {
                chain,
                api: null,
                isLoading: false,
                error: lastError.message || 'Connection failed after retries'
              })
              setChainApis(new Map(apis))
              console.error(`✗ Failed to connect to ${chain.name} after ${maxRetries + 1} attempts`)
            }
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
      // Disconnect all APIs gracefully
      activeConnections.forEach((api) => {
        try {
          api.disconnect().catch(() => {
            // Ignore disconnect errors during cleanup
          })
        } catch (e) {
          // Ignore errors during cleanup
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
      console.log(`[${chainName}] API not available`)
      return null
    }

    try {
      // Wait for API to be ready
      await chainApi.api.isReady
      
      console.log(`[${chainName}] Querying balance for ${address.substring(0, 8)}...`)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
      
      const accountData = await Promise.race([
        chainApi.api.query.system.account(address),
        timeoutPromise
      ]) as any
      
      if (!accountData || !accountData.data) {
        console.warn(`[${chainName}] No account data returned`)
        return null
      }
      
      const balance = accountData.data
      
      const decimals = chainApi.chain.decimals
      const free = balance.free.toString()
      const reserved = balance.reserved.toString()
      const total = balance.free.add(balance.reserved).toString()
      
      console.log(`[${chainName}] Raw balance - free: ${free}, reserved: ${reserved}, total: ${total}`)
      
      // Convert to BigInt for division, then format with decimals
      const freeBigInt = BigInt(free)
      const reservedBigInt = BigInt(reserved)
      const totalBigInt = BigInt(total)
      const divisor = BigInt(10 ** decimals)
      
      // Format with proper decimal handling
      const formatBalance = (value: bigint): string => {
        const wholePart = value / divisor
        const fractionalPart = value % divisor
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
        return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
      }
      
      const formatted = {
        free: formatBalance(freeBigInt),
        reserved: formatBalance(reservedBigInt),
        total: formatBalance(totalBigInt),
        token: chainApi.chain.token
      }
      
      console.log(`[${chainName}] Formatted balance:`, formatted)
      return formatted
    } catch (error: any) {
      console.error(`[${chainName}] Failed to get balance for ${address.substring(0, 8)}...:`, error.message || error)
      return null
    }
  }, [chainApis])

  return {
    chainApis: Array.from(chainApis.values()),
    isInitializing,
    getBalance
  }
}

