export async function getDotPrice(): Promise<number | null> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd')
    const data = await response.json()
    return data.polkadot?.usd || null
  } catch (error) {
    console.error('[Price] Failed to fetch DOT price:', error)
    return null
  }
}
