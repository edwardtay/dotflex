/**
 * Direct RPC queries for Polkadot balance
 * Multiple endpoint fallback for reliability
 */

import { ApiPromise, WsProvider } from '@polkadot/api'

export interface PolkadotRpcEndpoint {
  name: string
  url: string
  provider: string
}

// Multiple reliable Polkadot RPC endpoints
// QuickNode WSS endpoint is added dynamically if configured
export const POLKADOT_RPC_ENDPOINTS: PolkadotRpcEndpoint[] = [
  // QuickNode (if configured, will be prepended)
  { name: 'Dwellir', url: 'wss://polkadot-rpc.dwellir.com', provider: 'Dwellir' },
  { name: 'OnFinality', url: 'wss://polkadot.api.onfinality.io/public-ws', provider: 'OnFinality' },
  { name: 'RadiumBlock', url: 'wss://polkadot.public.curie.radiumblock.co/ws', provider: 'RadiumBlock' },
  { name: '1RPC', url: 'wss://1rpc.io/dot', provider: '1RPC' },
  { name: 'IBP', url: 'wss://rpc.ibp.network/polkadot', provider: 'IBP' },
  { name: 'Polkadot Official', url: 'wss://rpc.polkadot.io', provider: 'Polkadot' },
]

/**
 * Get list of RPC endpoints, including QuickNode if configured
 */
function getRpcEndpoints(): PolkadotRpcEndpoint[] {
  const endpoints = [...POLKADOT_RPC_ENDPOINTS]
  
  // Add QuickNode WSS endpoint if configured
  const quickNodeWss = import.meta.env.VITE_QUICKNODE_WSS_URL
  if (quickNodeWss) {
    endpoints.unshift({
      name: 'QuickNode',
      url: quickNodeWss,
      provider: 'QuickNode'
    })
  }
  
  return endpoints
}

export interface BalanceResult {
  free: string
  reserved: string
  total: string
  endpoint: string
  responseTime: number
}

/**
 * Get DOT balance via direct RPC query
 * Tries multiple endpoints until one succeeds
 */
export async function getDotBalanceViaRpc(
  address: string,
  onProgress?: (message: string) => void
): Promise<BalanceResult | null> {
  const log = (msg: string) => {
    console.log(`[Polkadot RPC] ${msg}`)
    onProgress?.(msg)
  }

  log(`Attempting to get DOT balance for ${address.substring(0, 12)}...`)
  
  const endpoints = getRpcEndpoints()
  log(`Trying ${endpoints.length} RPC endpoints...`)

  // Try each endpoint sequentially
  for (const endpoint of endpoints) {
    let api: ApiPromise | null = null
    let provider: WsProvider | null = null
    
    try {
      log(`Trying ${endpoint.name} (${endpoint.provider})...`)
      const startTime = Date.now()
      
      // Create provider with timeout
      provider = new WsProvider(endpoint.url, 3000) // 3 second connection timeout
      
      // Create API with timeout
      api = await Promise.race([
        ApiPromise.create({ provider }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 8000)
        )
      ])

      // Wait for API to be ready with timeout
      await Promise.race([
        api.isReady,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API ready timeout')), 5000)
        )
      ])

      log(`✓ Connected to ${endpoint.name}, querying balance...`)

      // Query balance with timeout
      const accountData = await Promise.race([
        api.query.system.account(address),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        )
      ]) as any

      if (!accountData || !accountData.data) {
        log(`✗ ${endpoint.name}: No account data returned`)
        await api.disconnect()
        continue
      }

      const balance = accountData.data
      const free = balance.free.toString()
      const reserved = balance.reserved.toString()
      const total = balance.free.add(balance.reserved).toString()

      // DOT has 10 decimals
      const decimals = 10
      const divisor = BigInt(10 ** decimals)

      const formatBalance = (value: string): string => {
        const valueBigInt = BigInt(value)
        const wholePart = valueBigInt / divisor
        const fractionalPart = valueBigInt % divisor
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
        return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
      }

      const endTime = Date.now()
      const responseTime = endTime - startTime

      const result: BalanceResult = {
        free: formatBalance(free),
        reserved: formatBalance(reserved),
        total: formatBalance(total),
        endpoint: `${endpoint.name} (${endpoint.provider})`,
        responseTime
      }

      log(`✓ Success via ${endpoint.name} (${responseTime}ms)`)
      log(`  Free: ${result.free} DOT`)
      log(`  Reserved: ${result.reserved} DOT`)
      log(`  Total: ${result.total} DOT`)

      // Cleanup
      await api.disconnect()
      
      return result

    } catch (error: any) {
      log(`✗ ${endpoint.name} failed: ${error.message || 'Unknown error'}`)
      
      // Cleanup on error
      try {
        if (api) await api.disconnect()
        if (provider) provider.disconnect()
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Continue to next endpoint
      continue
    }
  }

  log(`✗ All ${endpoints.length} RPC endpoints failed`)
  return null
}

/**
 * Get DOT balance with parallel endpoint attempts (faster but uses more resources)
 */
export async function getDotBalanceViaRpcParallel(
  address: string,
  onProgress?: (message: string) => void
): Promise<BalanceResult | null> {
  const log = (msg: string) => {
    console.log(`[Polkadot RPC Parallel] ${msg}`)
    onProgress?.(msg)
  }

  log(`Attempting to get DOT balance for ${address.substring(0, 12)}...`)
  
  const endpoints = getRpcEndpoints()
  log(`Trying ${endpoints.length} RPC endpoints in parallel...`)

  const attempts = endpoints.map(async (endpoint): Promise<BalanceResult | null> => {
    let api: ApiPromise | null = null
    let provider: WsProvider | null = null
    
    try {
      const startTime = Date.now()
      provider = new WsProvider(endpoint.url, 3000)
      api = await Promise.race([
        ApiPromise.create({ provider }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 8000)
        )
      ])

      await Promise.race([
        api.isReady,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API ready timeout')), 5000)
        )
      ])

      const accountData = await Promise.race([
        api.query.system.account(address),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 10000)
        )
      ]) as any

      if (!accountData || !accountData.data) {
        await api.disconnect()
        return null
      }

      const balance = accountData.data
      const free = balance.free.toString()
      const reserved = balance.reserved.toString()
      const total = balance.free.add(balance.reserved).toString()

      const decimals = 10
      const divisor = BigInt(10 ** decimals)

      const formatBalance = (value: string): string => {
        const valueBigInt = BigInt(value)
        const wholePart = valueBigInt / divisor
        const fractionalPart = valueBigInt % divisor
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
        return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
      }

      const endTime = Date.now()
      const responseTime = endTime - startTime

      const result: BalanceResult = {
        free: formatBalance(free),
        reserved: formatBalance(reserved),
        total: formatBalance(total),
        endpoint: `${endpoint.name} (${endpoint.provider})`,
        responseTime
      }

      await api.disconnect()
      return result

    } catch (error: any) {
      try {
        if (api) await api.disconnect()
        if (provider) provider.disconnect()
      } catch {
        // Ignore cleanup errors
      }
      return null
    }
  })

  // Wait for first successful result
  const results = await Promise.allSettled(attempts)
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      log(`✓ Success via ${result.value.endpoint} (${result.value.responseTime}ms)`)
      return result.value
    }
  }

  log(`✗ All ${endpoints.length} RPC endpoints failed`)
  return null
}

