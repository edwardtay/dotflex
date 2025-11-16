/**
 * Multi-Provider Balance Checker for Polkadot
 * 
 * Tries multiple API providers in sequence:
 * 1. Subscan API (fastest, most reliable)
 * 2. QuickNode API (alternative REST API)
 * 3. Public RPC endpoints (fallback)
 */

import { getAccountBalanceFromSubscan } from './subscanApi'
import { getDotBalanceViaQuickNode } from './quicknodeApi'
import { getDotBalanceViaRpc } from './polkadotRpc'

export interface BalanceResult {
  free: string
  reserved: string
  total: string
  token: string
  provider: string
  responseTime: number
  success: boolean
  error?: string
}

/**
 * Get Polkadot balance using multiple providers with fallback
 * Tries providers in order: Subscan -> QuickNode -> Public RPC
 */
export async function getPolkadotBalanceMultiProvider(
  address: string,
  onProgress?: (message: string) => void
): Promise<BalanceResult | null> {
  const log = (msg: string) => {
    console.log(`[MultiProvider] ${msg}`)
    onProgress?.(msg)
  }

  log(`Fetching Polkadot balance for ${address.substring(0, 12)}...`)
  log(`Trying multiple providers: Subscan → QuickNode → Public RPC`)

  // Provider 1: Subscan API
  log('--- Trying Subscan API (Provider 1) ---')
  const subscanStartTime = Date.now()
  try {
    const balance = await getAccountBalanceFromSubscan('Polkadot', address)
    const subscanEndTime = Date.now()
    const responseTime = subscanEndTime - subscanStartTime

    if (balance) {
      const decimals = 10 // Polkadot has 10 decimals
      const divisor = BigInt(10 ** decimals)
      
      const formatBalance = (value: string): string => {
        const valueBigInt = BigInt(value)
        const wholePart = valueBigInt / divisor
        const fractionalPart = valueBigInt % divisor
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
        return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
      }

      log(`✓ Subscan API success (${responseTime}ms)`)
      log(`  Free: ${formatBalance(balance.free)} DOT`)
      log(`  Reserved: ${formatBalance(balance.reserved)} DOT`)
      log(`  Total: ${formatBalance(balance.total)} DOT`)

      return {
        free: formatBalance(balance.free),
        reserved: formatBalance(balance.reserved),
        total: formatBalance(balance.total),
        token: 'DOT',
        provider: 'Subscan API',
        responseTime,
        success: true
      }
    } else {
      log(`✗ Subscan API returned no balance (${responseTime}ms)`)
      log(`  Trying QuickNode API...`)
    }
  } catch (error: any) {
    const subscanEndTime = Date.now()
    const responseTime = subscanEndTime - subscanStartTime
    log(`✗ Subscan API error: ${error.message || 'Unknown error'} (${responseTime}ms)`)
    log(`  Trying QuickNode API...`)
  }

  // Provider 2: QuickNode API
  log('--- Trying QuickNode API (Provider 2) ---')
  const quickNodeStartTime = Date.now()
  try {
    const balance = await getDotBalanceViaQuickNode(address, undefined, (msg) => {
      log(`  ${msg}`)
    })
    const quickNodeEndTime = Date.now()
    const responseTime = quickNodeEndTime - quickNodeStartTime

    if (balance) {
      log(`✓ QuickNode API success (${responseTime}ms)`)
      log(`  Free: ${balance.free} DOT`)
      log(`  Reserved: ${balance.reserved} DOT`)
      log(`  Total: ${balance.total} DOT`)

      return {
        free: balance.free,
        reserved: balance.reserved,
        total: balance.total,
        token: 'DOT',
        provider: 'QuickNode API',
        responseTime,
        success: true
      }
    } else {
      log(`✗ QuickNode API returned no balance (${responseTime}ms)`)
      log(`  Trying Public RPC...`)
    }
  } catch (error: any) {
    const quickNodeEndTime = Date.now()
    const responseTime = quickNodeEndTime - quickNodeStartTime
    log(`✗ QuickNode API error: ${error.message || 'Unknown error'} (${responseTime}ms)`)
    log(`  Trying Public RPC...`)
  }

  // Provider 3: Public RPC (fallback)
  log('--- Trying Public RPC (Provider 3 - Fallback) ---')
  const rpcStartTime = Date.now()
  try {
    const balance = await getDotBalanceViaRpc(address, (msg) => {
      log(`  ${msg}`)
    })
    const rpcEndTime = Date.now()
    const responseTime = rpcEndTime - rpcStartTime

    if (balance) {
      log(`✓ Public RPC success (${responseTime}ms)`)
      log(`  Free: ${balance.free} DOT`)
      log(`  Reserved: ${balance.reserved} DOT`)
      log(`  Total: ${balance.total} DOT`)

      return {
        free: balance.free,
        reserved: balance.reserved,
        total: balance.total,
        token: 'DOT',
        provider: balance.endpoint || 'Public RPC',
        responseTime,
        success: true
      }
    } else {
      log(`✗ Public RPC failed (${responseTime}ms)`)
    }
  } catch (error: any) {
    const rpcEndTime = Date.now()
    const responseTime = rpcEndTime - rpcStartTime
    log(`✗ Public RPC error: ${error.message || 'Unknown error'} (${responseTime}ms)`)
  }

  // All providers failed
  log(`✗ All providers failed to fetch balance`)
  return null
}

/**
 * Get balance from all providers in parallel (for comparison)
 * Returns results from all providers that succeed
 */
export async function getPolkadotBalanceAllProviders(
  address: string,
  onProgress?: (message: string) => void
): Promise<BalanceResult[]> {
  const log = (msg: string) => {
    console.log(`[MultiProvider] ${msg}`)
    onProgress?.(msg)
  }

  log(`Fetching Polkadot balance from all providers in parallel for ${address.substring(0, 12)}...`)

  const results: BalanceResult[] = []

  // Try all providers in parallel
  const promises = [
    // Subscan
    (async () => {
      const startTime = Date.now()
      try {
        const balance = await getAccountBalanceFromSubscan('Polkadot', address)
        const responseTime = Date.now() - startTime
        if (balance) {
          const decimals = 10
          const divisor = BigInt(10 ** decimals)
          const formatBalance = (value: string): string => {
            const valueBigInt = BigInt(value)
            const wholePart = valueBigInt / divisor
            const fractionalPart = valueBigInt % divisor
            const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
            return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
          }
          return {
            free: formatBalance(balance.free),
            reserved: formatBalance(balance.reserved),
            total: formatBalance(balance.total),
            token: 'DOT',
            provider: 'Subscan API',
            responseTime,
            success: true
          } as BalanceResult
        }
      } catch (error: any) {
        return {
          free: '0',
          reserved: '0',
          total: '0',
          token: 'DOT',
          provider: 'Subscan API',
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message || 'Unknown error'
        } as BalanceResult
      }
      return null
    })(),
    
    // QuickNode
    (async () => {
      const startTime = Date.now()
      try {
        const balance = await getDotBalanceViaQuickNode(address)
        const responseTime = Date.now() - startTime
        if (balance) {
          return {
            free: balance.free,
            reserved: balance.reserved,
            total: balance.total,
            token: 'DOT',
            provider: 'QuickNode API',
            responseTime,
            success: true
          } as BalanceResult
        }
      } catch (error: any) {
        return {
          free: '0',
          reserved: '0',
          total: '0',
          token: 'DOT',
          provider: 'QuickNode API',
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message || 'Unknown error'
        } as BalanceResult
      }
      return null
    })(),
    
    // Public RPC
    (async () => {
      const startTime = Date.now()
      try {
        const balance = await getDotBalanceViaRpc(address)
        const responseTime = Date.now() - startTime
        if (balance) {
          return {
            free: balance.free,
            reserved: balance.reserved,
            total: balance.total,
            token: 'DOT',
            provider: balance.endpoint || 'Public RPC',
            responseTime,
            success: true
          } as BalanceResult
        }
      } catch (error: any) {
        return {
          free: '0',
          reserved: '0',
          total: '0',
          token: 'DOT',
          provider: 'Public RPC',
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message || 'Unknown error'
        } as BalanceResult
      }
      return null
    })()
  ]

  const settledResults = await Promise.allSettled(promises)
  
  settledResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value)
      const provider = ['Subscan', 'QuickNode', 'Public RPC'][index]
      if (result.value.success) {
        log(`✓ ${provider}: ${result.value.total} DOT (${result.value.responseTime}ms)`)
      } else {
        log(`✗ ${provider}: ${result.value.error || 'Failed'} (${result.value.responseTime}ms)`)
      }
    }
  })

  log(`Completed: ${results.filter(r => r.success).length}/${results.length} providers succeeded`)
  return results.filter(r => r.success)
}

