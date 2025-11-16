export interface PolkadotStats {
  price: number
  priceChange24h: number
  marketCap: number
}

export async function getPolkadotStats(): Promise<PolkadotStats | null> {
  try {
    const priceData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd&include_24hr_change=true&include_market_cap=true').then(r => r.json())

    return {
      price: priceData.polkadot?.usd || 0,
      priceChange24h: priceData.polkadot?.usd_24h_change || 0,
      marketCap: priceData.polkadot?.usd_market_cap || 0
    }
  } catch (error) {
    console.error('[PolkadotStats] Failed to fetch:', error)
    return null
  }
}
