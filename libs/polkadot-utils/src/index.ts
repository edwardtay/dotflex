import { ApiPromise } from '@polkadot/api'
import { formatBalance } from '@polkadot/util'

/**
 * Format balance with proper decimals
 */
export function formatBalanceWithDecimals(
  balance: string | number,
  decimals: number = 12,
  token: string = 'DOT'
): string {
  return formatBalance(balance, {
    decimals,
    withUnit: token,
    forceUnit: '-'
  })
}

/**
 * Get account balance from API
 */
export async function getAccountBalance(
  api: ApiPromise,
  address: string
): Promise<{
  free: string
  reserved: string
  total: string
}> {
  const accountData = await api.query.system.account(address)
  const balance = accountData.data

  const decimals = api.registry.chainDecimals[0] || 12
  const free = balance.free.toString()
  const reserved = balance.reserved.toString()
  const total = balance.free.add(balance.reserved).toString()

  return {
    free: (BigInt(free) / BigInt(10 ** decimals)).toString(),
    reserved: (BigInt(reserved) / BigInt(10 ** decimals)).toString(),
    total: (BigInt(total) / BigInt(10 ** decimals)).toString()
  }
}

/**
 * Check if identity exists for an account
 */
export async function hasIdentity(
  api: ApiPromise,
  address: string
): Promise<boolean> {
  const identityInfo = await api.query.identity.identityOf(address)
  return identityInfo.isSome
}

/**
 * Get identity information for an account
 */
export async function getIdentity(
  api: ApiPromise,
  address: string
): Promise<Record<string, string> | null> {
  const identityInfo = await api.query.identity.identityOf(address)

  if (!identityInfo.isSome) {
    return null
  }

  const identityData = identityInfo.unwrap()
  const info = identityData.info

  const identity: Record<string, string> = {}

  if (info.display.isRaw) {
    identity.display = info.display.asRaw.toUtf8()
  }
  if (info.email.isRaw) {
    identity.email = info.email.asRaw.toUtf8()
  }
  if (info.twitter.isRaw) {
    identity.twitter = info.twitter.asRaw.toUtf8()
  }
  if (info.web.isRaw) {
    identity.web = info.web.asRaw.toUtf8()
  }
  if (info.legal.isRaw) {
    identity.legal = info.legal.asRaw.toUtf8()
  }
  if (info.riot.isRaw) {
    identity.riot = info.riot.asRaw.toUtf8()
  }

  return identity
}

