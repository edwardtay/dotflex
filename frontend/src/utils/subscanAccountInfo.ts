/**
 * Subscan Account Information API
 * Fetches comprehensive account data from Subscan
 */

const SUBSCAN_API_KEY = import.meta.env.VITE_SUBSCAN_API_KEY || ''

export interface SubscanAccountInfo {
  address: string
  balance: string
  balanceLock: string
  bonded: string
  unbonding: string
  democracy_lock: string
  election_lock: string
  nonce: number
  countExtrinsic: number
  isCouncilMember: boolean
  isRegistrar: boolean
  role: string
}

export interface SubscanTransfer {
  from: string
  to: string
  amount: string
  hash: string
  blockNum: number
  blockTimestamp: number
  success: boolean
}

export async function getSubscanAccountInfo(address: string): Promise<SubscanAccountInfo | null> {
  try {
    const response = await fetch('https://polkadot.api.subscan.io/api/v2/scan/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SUBSCAN_API_KEY
      },
      body: JSON.stringify({ key: address })
    })

    if (!response.ok) {
      throw new Error(`Subscan API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code === 0 && data.data?.account) {
      return data.data.account
    }
    
    return null
  } catch (error) {
    console.error('[Subscan] Account info error:', error)
    return null
  }
}

export async function getSubscanTransfers(address: string, page = 0, row = 10): Promise<SubscanTransfer[]> {
  try {
    const response = await fetch('https://polkadot.api.subscan.io/api/scan/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SUBSCAN_API_KEY
      },
      body: JSON.stringify({ 
        address,
        page,
        row
      })
    })

    if (!response.ok) {
      throw new Error(`Subscan API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code === 0 && data.data?.transfers) {
      return data.data.transfers
    }
    
    return []
  } catch (error) {
    console.error('[Subscan] Transfers error:', error)
    return []
  }
}
