import { useState, useEffect } from 'react'
import { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './PortfolioView.css'

interface PortfolioViewProps {
  api: ApiPromise | null
  accounts: InjectedAccountWithMeta[]
}

interface BalanceInfo {
  account: string
  free: string
  reserved: string
  total: string
  chain: string
}

export default function PortfolioView({ api, accounts }: PortfolioViewProps) {
  const [balances, setBalances] = useState<BalanceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalValue, setTotalValue] = useState<string>('0')

  useEffect(() => {
    if (api && accounts.length > 0) {
      loadBalances()
    }
  }, [api, accounts])

  const loadBalances = async () => {
    if (!api || accounts.length === 0) return

    try {
      setIsLoading(true)
      console.log('Loading balances for', accounts.length, 'accounts')
      
      const balancePromises = accounts.map(async (account) => {
        try {
          const accountData = await api.query.system.account(account.address)
          const balance = accountData.data
          
          const free = balance.free.toString()
          const reserved = balance.reserved.toString()
          const total = balance.free.add(balance.reserved).toString()
          
          // Format balance (assuming 12 decimals for DOT/WND)
          const decimals = api.registry.chainDecimals[0] || 12
          const freeFormatted = (BigInt(free) / BigInt(10 ** decimals)).toString()
          const reservedFormatted = (BigInt(reserved) / BigInt(10 ** decimals)).toString()
          const totalFormatted = (BigInt(total) / BigInt(10 ** decimals)).toString()
          
          return {
            account: account.address,
            free: freeFormatted,
            reserved: reservedFormatted,
            total: totalFormatted,
            chain: 'Polkadot/Westend'
          }
        } catch (error) {
          console.error(`Failed to load balance for ${account.address}:`, error)
          return null
        }
      })

      const results = await Promise.all(balancePromises)
      const validBalances = results.filter((b): b is BalanceInfo => b !== null)
      
      setBalances(validBalances)
      
      // Calculate total value
      const total = validBalances.reduce((sum, b) => {
        return sum + BigInt(b.total)
      }, BigInt(0))
      setTotalValue(total.toString())
      
      console.log('Balances loaded:', validBalances)
    } catch (error) {
      console.error('Failed to load balances:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="portfolio-view">Loading portfolio...</div>
  }

  return (
    <div className="portfolio-view">
      <h2>Portfolio Overview</h2>
      
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total Value</h3>
          <p className="total-value">{totalValue} DOT</p>
        </div>
        <div className="summary-card">
          <h3>Accounts</h3>
          <p>{accounts.length}</p>
        </div>
        <div className="summary-card">
          <h3>Chains</h3>
          <p>1</p>
        </div>
      </div>

      <div className="balances-section">
        <h3>Account Balances</h3>
        <button onClick={loadBalances} className="refresh-button">
          Refresh Balances
        </button>
        
        {balances.length === 0 ? (
          <div className="no-balances">
            <p>No balances found. Make sure your accounts have funds.</p>
          </div>
        ) : (
          <div className="balances-list">
            {balances.map((balance, index) => (
              <div key={index} className="balance-card">
                <div className="balance-header">
                  <h4>{accounts.find(a => a.address === balance.account)?.meta.name || 'Unnamed Account'}</h4>
                  <span className="chain-badge">{balance.chain}</span>
                </div>
                <div className="balance-details">
                  <div className="balance-item">
                    <label>Total:</label>
                    <span className="balance-value">{balance.total} DOT</span>
                  </div>
                  <div className="balance-item">
                    <label>Free:</label>
                    <span>{balance.free} DOT</span>
                  </div>
                  <div className="balance-item">
                    <label>Reserved:</label>
                    <span>{balance.reserved} DOT</span>
                  </div>
                </div>
                <div className="account-address">
                  <code>{balance.account}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-box">
        <h4>Cross-Chain Support</h4>
        <p>Future versions will support:</p>
        <ul>
          <li>Multiple parachain connections</li>
          <li>Cross-chain asset tracking via XCM</li>
          <li>Privacy-preserving portfolio analytics</li>
          <li>Historical balance tracking</li>
        </ul>
      </div>
    </div>
  )
}

