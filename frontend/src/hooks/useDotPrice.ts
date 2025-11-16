import { useState, useEffect } from 'react'

export function useDotPrice() {
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd')
      .then(r => r.json())
      .then(data => setPrice(data.polkadot?.usd || null))
      .catch(() => setPrice(null))
  }, [])

  return price
}
