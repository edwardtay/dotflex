import { useState, useEffect, useCallback } from 'react'
import { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { useMultiChain } from '../hooks/useMultiChain'
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
  token: string
}

export default function PortfolioView({ api, accounts }: PortfolioViewProps) {
  const { chainApis, isInitializing, getBalance } = useMultiChain()
  const [balances, setBalances] = useState<BalanceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chainStats, setChainStats] = useState<Map<string, { count: number; total: string }>>(new Map())

  const loadBalances = useCallback(async () => {
    if (accounts.length === 0) return

    try {
      setIsLoading(true)
      console.log('Loading balances from', chainApis.length, 'chains for', accounts.length, 'accounts')
      
      const allBalances: BalanceInfo[] = []

      // Query each account on each chain
      for (const account of accounts) {
        for (const chainApi of chainApis) {
          if (!chainApi.api || chainApi.isLoading) continue

          try {
            const balance = await getBalance(chainApi.chain.name, account.address)
            if (balance) {
              console.log(`Balance for ${account.address.substring(0, 8)}... on ${chainApi.chain.name}:`, balance)
              // Show all balances, including zero balances
              allBalances.push({
                account: account.address,
                free: balance.free,
                reserved: balance.reserved,
                total: balance.total,
                chain: chainApi.chain.name,
                token: balance.token
              })
            } else {
              console.log(`No balance returned for ${account.address.substring(0, 8)}... on ${chainApi.chain.name}`)
            }
          } catch (error) {
            console.error(`Failed to load balance for ${account.address} on ${chainApi.chain.name}:`, error)
          }
        }
      }

      setBalances(allBalances)

      // Calculate chain statistics
      const stats = new Map<string, { count: number; total: string }>()
      allBalances.forEach(balance => {
        const existing = stats.get(balance.chain) || { count: 0, total: '0' }
        stats.set(balance.chain, {
          count: existing.count + 1,
          total: (BigInt(existing.total) + BigInt(Math.floor(parseFloat(balance.total) * 1000000))).toString()
        })
      })
      setChainStats(stats)

      console.log('Balances loaded:', allBalances)
    } catch (error) {
      console.error('Failed to load balances:', error)
    } finally {
      setIsLoading(false)
    }
  }, [accounts, chainApis, getBalance])

  useEffect(() => {
    if (!isInitializing && accounts.length > 0 && chainApis.some(ca => ca.api)) {
      loadBalances()
    }
  }, [isInitializing, accounts.length, chainApis.length, loadBalances])

  if (isInitializing || isLoading) {
    return (
      <div className="portfolio-view">
        <h2>Portfolio Overview</h2>
        <div className="loading-state">
          <p>{isInitializing ? 'Connecting to chains...' : 'Loading balances...'}</p>
          <div className="chain-status">
            {chainApis.map(chainApi => (
              <div key={chainApi.chain.name} className="chain-status-item">
                <span className={chainApi.api ? 'status-connected' : chainApi.isLoading ? 'status-loading' : 'status-error'}>
                  {chainApi.api ? '✓' : chainApi.isLoading ? '⋯' : '✗'}
                </span>
                <span>{chainApi.chain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const connectedChains = chainApis.filter(ca => ca.api).length
  const totalAccounts = new Set(balances.map(b => b.account)).size

  return (
    <div className="portfolio-view">
      <h2>Portfolio Overview</h2>
      
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Connected Chains</h3>
          <p className="total-value">{connectedChains}</p>
        </div>
        <div className="summary-card">
          <h3>Accounts</h3>
          <p>{totalAccounts}</p>
        </div>
        <div className="summary-card">
          <h3>Balances Found</h3>
          <p>{balances.length}</p>
        </div>
      </div>

      {chainStats.size > 0 && (
        <div className="chain-stats-section">
          <h3>Chain Summary</h3>
          <div className="chain-stats-grid">
            {Array.from(chainStats.entries()).map(([chain, stats]) => {
              const chainInfo = chainApis.find(ca => ca.chain.name === chain)?.chain
              return (
                <div key={chain} className="chain-stat-card">
                  <h4>{chain}</h4>
                  <p className="stat-value">{stats.count} account{stats.count !== 1 ? 's' : ''}</p>
                  {chainInfo && (
                    <p className="stat-token">{chainInfo.token}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="balances-section">
        <h3>Account Balances</h3>
        <button onClick={loadBalances} className="refresh-button">
          Refresh Balances
        </button>
        
        {balances.length === 0 ? (
          <div className="no-balances">
            <p>No balances found for the connected accounts.</p>
            <p className="hint">This could mean:</p>
            <ul>
              <li>The accounts don't have balances on these chains</li>
              <li>Some chains are still connecting (check status above)</li>
              <li>Try refreshing or check the browser console for errors</li>
            </ul>
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
                    <span className="balance-value">{balance.total} {balance.token}</span>
                  </div>
                  <div className="balance-item">
                    <label>Free:</label>
                    <span>{balance.free} {balance.token}</span>
                  </div>
                  <div className="balance-item">
                    <label>Reserved:</label>
                    <span>{balance.reserved} {balance.token}</span>
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

