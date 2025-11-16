import { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { getAccountBalanceFromSubscan } from '../utils/subscanApi'

export interface ChainConfig {
  name: string
  rpcUrl: string
  token: string
  decimals: number
  enabled: boolean
}

// Only Polkadot chain - portfolio focused on Polkadot only
export const DEFAULT_CHAINS: ChainConfig[] = [
  {
    name: 'Polkadot',
    rpcUrl: 'wss://rpc.polkadot.io', // Official - most reliable
    token: 'DOT',
    decimals: 10,
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
    const activeConnections: ApiPromise[] = []
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

      // Connect to chains with non-blocking approach
      // Failures are OK since Subscan API handles balance queries
      const connectionPromises = chains.map(async (chain) => {
        try {
          console.log(`[useMultiChain] Connecting to ${chain.name}...`)
          
          const provider = new WsProvider(chain.rpcUrl, 3000) // 3 second timeout
          const api = await Promise.race([
            ApiPromise.create({ provider }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 8000)
            )
          ]) as ApiPromise
          
          // Wait for API to be ready with shorter timeout
          await Promise.race([
            api.isReady,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('API ready timeout')), 5000)
            )
          ])
          
          if (!cancelled) {
            activeConnections.push(api)
            apis.set(chain.name, {
              chain,
              api,
              isLoading: false,
              error: null
            })
            setChainApis(new Map(apis))
            console.log(`[useMultiChain] ✓ Connected to ${chain.name}`)
          } else {
            await api.disconnect()
          }
        } catch (error: any) {
          // Silently mark as failed - Subscan API will handle balance queries
          if (!cancelled) {
            apis.set(chain.name, {
              chain,
              api: null,
              isLoading: false,
              error: null // Don't show error - Subscan handles it
            })
            setChainApis(new Map(apis))
            console.log(`[useMultiChain] ${chain.name} RPC unavailable (using Subscan API instead)`)
          }
        }
      })

      // Don't wait for all - let them connect in background
      Promise.allSettled(connectionPromises).then(() => {
        const connectedCount = Array.from(apis.values()).filter(ca => ca.api !== null).length
        console.log(`[useMultiChain] RPC connections: ${connectedCount}/${chains.length} connected (Subscan API handles balance queries)`)
      })
      
      // Mark as initialized immediately - don't wait for RPC connections
      // Subscan API handles balance queries regardless of RPC status
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
    console.log(`[${chainName}] getBalance called for ${address.substring(0, 8)}...`)
    // Try Subscan API first
    console.log(`[${chainName}] Attempting Subscan API first...`)
    const subscanBalance = await getAccountBalanceFromSubscan(chainName, address)
    if (subscanBalance) {
      console.log(`[${chainName}] ✓ Subscan API returned balance, using it`)
      const chainApi = chainApis.get(chainName)
      if (chainApi) {
        const decimals = chainApi.chain.decimals
        const divisor = BigInt(10 ** decimals)
        
        // Format with proper decimal handling
        const formatBalance = (value: string): string => {
          const valueBigInt = BigInt(value)
          const wholePart = valueBigInt / divisor
          const fractionalPart = valueBigInt % divisor
          const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
          return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
        }
        
        const formatted = {
          free: formatBalance(subscanBalance.free),
          reserved: formatBalance(subscanBalance.reserved),
          total: formatBalance(subscanBalance.total),
          token: chainApi.chain.token
        }
        
        console.log(`[${chainName}] Subscan balance formatted:`, formatted)
        return formatted
      }
    }

    // Fallback to RPC if Subscan fails
    console.log(`[${chainName}] Subscan API unavailable or account not found, using RPC (always up-to-date)...`)
    const chainApi = chainApis.get(chainName)
    if (!chainApi || !chainApi.api) {
      console.log(`[${chainName}] API not available`)
      return null
    }

    try {
      // Wait for API to be ready
      await chainApi.api.isReady
      
      console.log(`[${chainName}] Querying balance via RPC for ${address.substring(0, 8)}...`)
      
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

