/**
 * Account Information Utilities
 * Uses QuickNode RPC to get comprehensive account information
 */

import { ApiPromise, WsProvider } from '@polkadot/api'

export interface AccountInfo {
  address: string
  nonce: number
  identity: {
    display: string | null
    email: string | null
    twitter: string | null
    web: string | null
    verified: boolean
  } | null
  staking: {
    bonded: string
    unbonding: string
    rewards: string
    isValidator: boolean
    isNominator: boolean
  } | null
  accountIndex: string | null
  hasIdentity: boolean
}

/**
 * Get comprehensive account information via QuickNode RPC
 */
export async function getAccountInfoViaQuickNode(
  address: string,
  onProgress?: (message: string) => void
): Promise<AccountInfo | null> {
  const log = (msg: string) => {
    console.log(`[Account Info] ${msg}`)
    onProgress?.(msg)
  }

  // Use QuickNode WSS endpoint if available, otherwise fallback to public RPC
  const quickNodeWss = import.meta.env.VITE_QUICKNODE_WSS_URL
  const rpcUrl = quickNodeWss || 'wss://rpc.polkadot.io'

  log(`Fetching account info for ${address.substring(0, 12)}...`)
  log(`Using RPC: ${quickNodeWss ? 'QuickNode' : 'Public'}`)

  let api: ApiPromise | null = null
  let provider: WsProvider | null = null

  try {
    provider = new WsProvider(rpcUrl, 3000)
    api = await Promise.race([
      ApiPromise.create({ provider }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ])

    await Promise.race([
      api.isReady,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('API ready timeout')), 5000)
      )
    ])

    log('✓ Connected to RPC, querying account data...')

    // Query multiple pieces of information in parallel
    const [accountData, identityData, stakingLedger, accountIndex] = await Promise.all([
      api.query.system.account(address),
      api.query.identity.identityOf(address),
      api.query.staking.ledger(address),
      api.query.system.accountIndex(address),
    ])

    const account = accountData
    const identity = identityData.unwrapOr(null)
    const staking = stakingLedger.unwrapOr(null)
    const index = accountIndex.unwrapOr(null)

    // Get validators to check if address is a validator
    const validators = await api.query.session.validators()
    const isValidator = validators.some(v => v.toString() === address)

    // Check if nominator (has staking ledger)
    const isNominator = staking !== null

    // Extract identity information
    let identityInfo = null
    if (identity) {
      const display = identity.info.display?.asRaw?.toString() || null
      const email = identity.info.email?.asRaw?.toString() || null
      const twitter = identity.info.twitter?.asRaw?.toString() || null
      const web = identity.info.web?.asRaw?.toString() || null
      const judgements = identity.judgements.toArray()
      const verified = judgements.some(j => j[1].isReasonable || j[1].isKnownGood)

      identityInfo = {
        display,
        email,
        twitter,
        web,
        verified
      }
    }

    // Extract staking information
    let stakingInfo = null
    if (staking) {
      const decimals = api.registry.chainDecimals[0] || 10
      const divisor = BigInt(10 ** decimals)

      const formatBalance = (value: string): string => {
        const valueBigInt = BigInt(value)
        const wholePart = valueBigInt / divisor
        const fractionalPart = valueBigInt % divisor
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
        return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
      }

      stakingInfo = {
        bonded: formatBalance(staking.total.toString()),
        unbonding: formatBalance(staking.unlocking.reduce((sum, u) => sum + u.value, BigInt(0)).toString()),
        rewards: '0', // Would need separate query for rewards
        isValidator,
        isNominator
      }
    }

    const result: AccountInfo = {
      address,
      nonce: account.nonce.toNumber(),
      identity: identityInfo,
      staking: stakingInfo,
      accountIndex: index ? index.toString() : null,
      hasIdentity: identity !== null
    }

    log(`✓ Account info retrieved`)
    log(`  Nonce: ${result.nonce}`)
    log(`  Identity: ${result.hasIdentity ? 'Yes' : 'No'}`)
    log(`  Staking: ${result.staking ? 'Yes' : 'No'}`)

    await api.disconnect()
    return result

  } catch (error: any) {
    log(`✗ Error fetching account info: ${error.message || 'Unknown error'}`)
    
    try {
      if (api) await api.disconnect()
      if (provider) provider.disconnect()
    } catch {
      // Ignore cleanup errors
    }
    
    return null
  }
}

/**
 * Get account balance breakdown (more detailed than basic balance)
 */
export async function getAccountBalanceBreakdown(
  address: string
): Promise<{
  free: string
  reserved: string
  frozen: string
  miscFrozen: string
  feeFrozen: string
  total: string
} | null> {
  const quickNodeWss = import.meta.env.VITE_QUICKNODE_WSS_URL
  const rpcUrl = quickNodeWss || 'wss://rpc.polkadot.io'

  try {
    const provider = new WsProvider(rpcUrl, 3000)
    const api = await ApiPromise.create({ provider })
    await api.isReady

    const accountData = await api.query.system.account(address)
    const balance = accountData.data

    const decimals = api.registry.chainDecimals[0] || 10
    const divisor = BigInt(10 ** decimals)

    const formatBalance = (value: string): string => {
      const valueBigInt = BigInt(value)
      const wholePart = valueBigInt / divisor
      const fractionalPart = valueBigInt % divisor
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')
      return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
    }

    const free = formatBalance(balance.free.toString())
    const reserved = formatBalance(balance.reserved.toString())
    const miscFrozen = formatBalance(balance.miscFrozen.toString())
    const feeFrozen = formatBalance(balance.feeFrozen.toString())
    const frozen = formatBalance(balance.miscFrozen.add(balance.feeFrozen).toString())
    const total = formatBalance(balance.free.add(balance.reserved).toString())

    await api.disconnect()

    return {
      free,
      reserved,
      frozen,
      miscFrozen,
      feeFrozen,
      total
    }

  } catch (error) {
    console.error('[Account Info] Balance breakdown error:', error)
    return null
  }
}

