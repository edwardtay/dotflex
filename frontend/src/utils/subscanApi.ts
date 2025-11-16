/**
 * Subscan API Integration Utilities
 * 
 * Provides functions to fetch account balance and other data from Subscan API
 * Documentation: https://docs.subscan.io/
 */

export interface SubscanAccountBalance {
  free: string
  reserved: string
  misc_frozen: string
  fee_frozen: string
}

export interface SubscanAccountData {
  address: string
  data: SubscanAccountBalance
  nonce?: number
}

export interface SubscanApiResponse {
  code: number
  message: string
  generated_at: number
  data: {
    account: SubscanAccountData
  }
}

export interface SubscanPortfolioBalance {
  chain: string
  token: string
  free: string
  reserved: string
  total: string
  decimals: number
}

export interface SubscanPortfolioResponse {
  code: number
  message: string
  generated_at: number
  data: {
    list: Array<{
      chain: string
      token: string
      balance: string
      reserved: string
      decimals: number
    }>
  }
}

import { getMainnetChains, getEssentialChains, getChainInfo, type SubscanChainInfo } from './subscanChains'
import { subscanRateLimiter } from './rateLimiter'

// Build dynamic map from comprehensive chain list
const SUBSCAN_API_BASE_URLS: Record<string, string> = {}
getMainnetChains().forEach(chain => {
  SUBSCAN_API_BASE_URLS[chain.name] = chain.apiUrl
})

/**
 * Get Subscan API base URL for a chain
 */
function getSubscanApiUrl(chainName: string): string | null {
  return SUBSCAN_API_BASE_URLS[chainName] || null
}

/**
 * Fetch account balance from Subscan API
 * 
 * @param chainName - Name of the chain (e.g., 'Polkadot', 'Kusama')
 * @param address - Account address to query
 * @returns Account balance data or null if failed
 */
export async function getAccountBalanceFromSubscan(
  chainName: string,
  address: string
): Promise<{
  free: string
  reserved: string
  total: string
  token: string
} | null> {
  const apiKey = import.meta.env.VITE_SUBSCAN_API_KEY
  const baseUrl = getSubscanApiUrl(chainName)

  console.log(`[Subscan] Checking configuration for ${chainName}...`)
  console.log(`[Subscan] API Key present: ${apiKey ? 'Yes' : 'No'}`)
  console.log(`[Subscan] Base URL: ${baseUrl || 'Not found'}`)

  if (!baseUrl) {
    console.warn(`[Subscan] No API URL configured for chain: ${chainName}`)
    return null
  }

  if (!apiKey) {
    console.warn(`[Subscan] API key not configured. Set VITE_SUBSCAN_API_KEY in environment variables`)
    console.warn(`[Subscan] Current env keys:`, Object.keys(import.meta.env).filter(k => k.includes('SUBSCAN')))
    return null
  }

  try {
    // Use rate limiter to avoid exceeding 5 req/sec limit
    return await subscanRateLimiter.execute(async () => {
      // Use the account endpoint - correct format is /api/scan/account (not v2)
      const url = `${baseUrl}/api/scan/account`
      
      console.log(`[Subscan] Fetching balance for ${address.substring(0, 8)}... on ${chainName}`)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          key: address, // Subscan API uses 'key' field, not 'address'
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Subscan] API request failed: ${response.status} ${response.statusText}`, errorText)
        return null
      }

      const data: any = await response.json()

      if (data.code !== 0) {
        // "Record Not Found" means account doesn't exist or has no activity in Subscan
        // This can happen if:
        // - Account is new/inactive
        // - Account was removed from Subscan's index
        // - Subscan database is temporarily out of sync
        // We'll fall back to RPC which always has the latest data
        if (data.message === 'Record Not Found' || data.message === 'Invalid address') {
          console.log(`[Subscan] ${chainName}: Account not found in Subscan database (will use RPC fallback)`)
          console.log(`[Subscan] ${chainName}: This is normal - Subscan may not have indexed this account yet`)
        } else {
          console.warn(`[Subscan] ${chainName}: API returned error: ${data.message} (will use RPC fallback)`)
        }
        return null
      }

      // Log response structure for debugging (only if account is string or missing data)
      if (!data.data?.account || typeof data.data.account === 'string' || !data.data.account.data) {
        console.log(`[Subscan] ${chainName} API response structure:`, JSON.stringify(data, null, 2).substring(0, 600))
      }

      // Handle different response structures
      if (!data.data || !data.data.account) {
        console.warn(`[Subscan] ${chainName}: No account data in response`)
        return null
      }

      const account = data.data.account
      
      // Check if account is a string (hash) or object with balance data
      if (typeof account === 'string') {
        console.log(`[Subscan] ${chainName}: Account exists but has no balance data (account hash: ${account.substring(0, 16)}...)`)
        console.log(`[Subscan] ${chainName}: This account may be new or have zero balance - Subscan may not have indexed balance data yet`)
        return null
      }

      // Account should be an object with data property
      if (!account.data || typeof account.data !== 'object') {
        console.warn(`[Subscan] ${chainName}: Account object exists but missing balance data structure`)
        console.warn(`[Subscan] Account structure:`, JSON.stringify(account, null, 2).substring(0, 500))
        return null
      }

      const balance = account.data

      // Calculate total balance
      const freeBigInt = BigInt(balance.free)
      const reservedBigInt = BigInt(balance.reserved)
      const totalBigInt = freeBigInt + reservedBigInt

      console.log(`[Subscan] Raw balance - free: ${balance.free}, reserved: ${balance.reserved}, total: ${totalBigInt.toString()}`)

      // Get token symbol from chain info
      const chainInfo = getChainInfo(chainName)
      const tokenSymbol = chainInfo?.token || 'TOKEN'

      return {
        free: balance.free,
        reserved: balance.reserved,
        total: totalBigInt.toString(),
        token: tokenSymbol
      }
    })
  } catch (error: any) {
    console.error(`[Subscan] Failed to fetch balance for ${address.substring(0, 8)}... on ${chainName}:`, error.message || error)
    return null
  }
}

/**
 * Fetch multi-chain portfolio balances from Subscan Portfolio API
 * This aggregates balances across all supported chains
 * 
 * @param address - Account address to query
 * @returns Array of balances across all chains or null if failed
 */
export async function getPortfolioBalancesFromSubscan(
  address: string
): Promise<SubscanPortfolioBalance[] | null> {
  const apiKey = import.meta.env.VITE_SUBSCAN_API_KEY

  if (!apiKey) {
    console.warn(`[Subscan Portfolio] API key not configured. Set VITE_SUBSCAN_API_KEY in environment variables`)
    return null
  }

  try {
    // Query ALL Substrate chains supported by Subscan
    // This includes Polkadot ecosystem, Kusama ecosystem, and standalone Substrate chains
    console.log(`[Subscan Portfolio] Fetching balances from ALL Substrate chains for ${address.substring(0, 8)}...`)
    
    const allChains = getEssentialChains().map(chain => chain.name)
    console.log(`[Subscan Portfolio] Querying ${allChains.length} essential Substrate chains...`)
    console.log(`[Subscan Portfolio] Rate limited to 5 requests/second`)
    
    // Process sequentially with rate limiting (rate limiter handles delays automatically)
    const balances: SubscanPortfolioBalance[] = []
    let completed = 0
    
    for (const chainName of allChains) {
      try {
        // Rate limiter ensures we don't exceed 5 req/sec
        const balance = await getAccountBalanceFromSubscan(chainName, address)
        completed++
        
        if (completed % 10 === 0) {
          console.log(`[Subscan Portfolio] Progress: ${completed}/${allChains.length} chains queried...`)
        }
        
        if (balance) {
          const chainInfo = getChainInfo(chainName)
          balances.push({
            chain: chainName,
            token: balance.token,
            free: balance.free,
            reserved: balance.reserved,
            total: balance.total,
            decimals: chainInfo?.decimals || 12
          })
        }
      } catch (error: any) {
        completed++
        // Silently skip chains that fail - this is normal for chains without balances
      }
    }
    
    console.log(`[Subscan Portfolio] Completed: ${completed}/${allChains.length} chains queried`)

    if (balances.length === 0) {
      console.log(`[Subscan Portfolio] No balances found across any chains`)
      return null
    }

    console.log(`[Subscan Portfolio] Found ${balances.length} balances across chains:`, balances.map(b => `${b.chain} (${b.token})`))
    return balances

  } catch (error: any) {
    console.error(`[Subscan Portfolio] Failed to fetch portfolio balances:`, error.message || error)
    return null
  }
}

