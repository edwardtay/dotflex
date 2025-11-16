/**
 * QuickNode API Integration for Polkadot
 * Provides REST API endpoints for balance queries
 * Documentation: https://www.quicknode.com/docs/polkadot
 */

export interface QuickNodeBalanceResponse {
  free: string
  reserved: string
  miscFrozen: string
  feeFrozen: string
}

export interface QuickNodeAccountBalanceInfo {
  accountId: string
  balance: QuickNodeBalanceResponse
}

/**
 * Get DOT balance via QuickNode API
 * Endpoint: /accounts/{accountId}/balance-info
 */
export async function getDotBalanceViaQuickNode(
  address: string,
  apiKey?: string,
  onProgress?: (message: string) => void
): Promise<{
  free: string
  reserved: string
  total: string
  responseTime: number
} | null> {
  const log = (msg: string) => {
    console.log(`[QuickNode] ${msg}`)
    onProgress?.(msg)
  }

  // QuickNode endpoint - requires QuickNode account and endpoint URL
  // Set VITE_QUICKNODE_URL (e.g., https://your-endpoint.quiknode.pro/...)
  // Set VITE_QUICKNODE_API_KEY if required
  const quickNodeUrl = import.meta.env.VITE_QUICKNODE_URL
  const apiKeyValue = import.meta.env.VITE_QUICKNODE_API_KEY || apiKey

  if (!quickNodeUrl) {
    log(`QuickNode URL not configured (set VITE_QUICKNODE_URL)`)
    log(`  Current env: VITE_QUICKNODE_URL=${import.meta.env.VITE_QUICKNODE_URL || 'not set'}`)
    return null
  }

  log(`Attempting QuickNode API for ${address.substring(0, 12)}...`)
  log(`  QuickNode URL: ${quickNodeUrl}`)

  try {
    const startTime = Date.now()
    
    // QuickNode endpoint format: /accounts/{accountId}/balance-info
    // Remove trailing slash if present
    const baseUrl = quickNodeUrl.replace(/\/$/, '')
    
    // QuickNode REST API endpoints to try (different possible formats)
    const endpointsToTry = [
      `${baseUrl}/accounts/${address}/balance-info`,
      `${baseUrl}/v1/accounts/${address}/balance`,
      `${baseUrl}/api/v1/accounts/${address}/balance`,
      `${baseUrl}/accounts/${address}/balance`,
    ]
    
    log(`Trying ${endpointsToTry.length} QuickNode endpoint formats...`)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add API key if provided (QuickNode may use different header names)
    if (apiKeyValue) {
      headers['X-API-Key'] = apiKeyValue
      headers['Authorization'] = `Bearer ${apiKeyValue}`
    }

    // Try each endpoint format
    let data: any = null
    let lastError: string = ''
    
    for (const url of endpointsToTry) {
      try {
        log(`Trying endpoint: ${url}`)
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
        })

        const endTime = Date.now()
        const responseTime = endTime - startTime

        if (!response.ok) {
          const errorText = await response.text()
          lastError = `${response.status} ${response.statusText}: ${errorText.substring(0, 100)}`
          log(`✗ Failed: ${lastError}`)
          continue // Try next endpoint
        }

        data = await response.json()
        log(`✓ Success with endpoint: ${url} (${responseTime}ms)`)
        break // Success, exit loop
        
      } catch (error: any) {
        lastError = error.message || 'Unknown error'
        log(`✗ Error with ${url}: ${lastError}`)
        continue // Try next endpoint
      }
    }

    if (!data) {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      log(`✗ All QuickNode endpoints failed. Last error: ${lastError}`)
      log(`  Total time: ${responseTime}ms`)
      return null
    }

    log(`QuickNode API response: ${JSON.stringify(data).substring(0, 400)}`)

    // Handle different response formats
    let balance: QuickNodeBalanceResponse | null = null

    if (data.balance) {
      // Direct balance object
      balance = data.balance
    } else if (data.data?.balance) {
      // Nested data structure
      balance = data.data.balance
    } else if (data.result?.balance) {
      // Result wrapper
      balance = data.result.balance
    } else if (data.free !== undefined) {
      // Balance fields at root level
      balance = {
        free: data.free,
        reserved: data.reserved || '0',
        miscFrozen: data.miscFrozen || data.misc_frozen || '0',
        feeFrozen: data.feeFrozen || data.fee_frozen || '0',
      }
    }

    if (!balance) {
      log(`✗ QuickNode API: Unexpected response format`)
      log(`  Full response: ${JSON.stringify(data)}`)
      return null
    }

    // Calculate total balance
    const freeBigInt = BigInt(balance.free)
    const reservedBigInt = BigInt(balance.reserved)
    const totalBigInt = freeBigInt + reservedBigInt

    // DOT has 10 decimals
    const decimals = 10
    const divisor = BigInt(10 ** decimals)

    const formatBalance = (value: bigint): string => {
      const wholePart = value / divisor
      const fractionalPart = value % divisor
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
      return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
    }

    const result = {
      free: formatBalance(freeBigInt),
      reserved: formatBalance(reservedBigInt),
      total: formatBalance(totalBigInt),
      responseTime
    }

    log(`✓ QuickNode API success (${responseTime}ms)`)
    log(`  Free: ${result.free} DOT`)
    log(`  Reserved: ${result.reserved} DOT`)
    log(`  Total: ${result.total} DOT`)

    return result

  } catch (error: any) {
    log(`✗ QuickNode API error: ${error.message || 'Unknown error'}`)
    return null
  }
}

/**
 * Get asset balances via QuickNode API
 * Endpoint: /asset-balances
 */
export async function getAssetBalancesViaQuickNode(
  address: string,
  apiKey?: string
): Promise<any[] | null> {
  const quickNodeUrl = import.meta.env.VITE_QUICKNODE_URL
  const apiKeyValue = import.meta.env.VITE_QUICKNODE_API_KEY || apiKey

  if (!quickNodeUrl) {
    return null
  }

  try {
    const baseUrl = quickNodeUrl.replace(/\/$/, '')
    const url = `${baseUrl}/asset-balances?accountId=${address}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (apiKeyValue) {
      headers['X-API-Key'] = apiKeyValue
      headers['Authorization'] = `Bearer ${apiKeyValue}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.assets || data.data?.assets || []

  } catch (error) {
    console.error('[QuickNode] Asset balances error:', error)
    return null
  }
}

/**
 * Get transaction history via QuickNode API
 * Note: This uses RPC queries since QuickNode primarily provides WebSocket RPC
 */
export async function getTransactionHistoryViaQuickNode(
  address: string,
  limit: number = 10
): Promise<any[] | null> {
  // QuickNode provides RPC endpoints, not REST API for transactions
  // Use direct RPC connection instead
  const quickNodeWss = import.meta.env.VITE_QUICKNODE_WSS_URL
  
  if (!quickNodeWss) {
    return null
  }

  try {
    const { ApiPromise, WsProvider } = await import('@polkadot/api')
    const provider = new WsProvider(quickNodeWss)
    const api = await ApiPromise.create({ provider })
    await api.isReady

    // Query account transactions (this is a simplified example)
    // In practice, you'd need to query blocks and filter by address
    const accountInfo = await api.query.system.account(address)
    
    await api.disconnect()
    
    return [{
      address,
      nonce: accountInfo.nonce.toString(),
      // Note: Full transaction history requires block scanning
    }]

  } catch (error) {
    console.error('[QuickNode] Transaction history error:', error)
    return null
  }
}

/**
 * Get staking information via QuickNode RPC
 */
export async function getStakingInfoViaQuickNode(
  address: string
): Promise<{
  staking: string
  rewards: string
  validator: string | null
} | null> {
  const quickNodeWss = import.meta.env.VITE_QUICKNODE_WSS_URL
  
  if (!quickNodeWss) {
    return null
  }

  try {
    const { ApiPromise, WsProvider } = await import('@polkadot/api')
    const provider = new WsProvider(quickNodeWss)
    const api = await ApiPromise.create({ provider })
    await api.isReady

    // Query staking ledger
    const stakingLedger = await api.query.staking.ledger(address)
    const staking = stakingLedger?.unwrapOr(null)
    
    // Query validators
    const validators = await api.query.staking.validators()
    
    await api.disconnect()
    
    if (!staking) {
      return null
    }

    return {
      staking: staking.total.toString(),
      rewards: '0', // Would need to query rewards separately
      validator: null, // Check if address is a validator
    }

  } catch (error) {
    console.error('[QuickNode] Staking info error:', error)
    return null
  }
}

