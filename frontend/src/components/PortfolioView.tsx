import { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { HttpProvider } from '@polkadot/rpc-provider'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { useMultiChain } from '../hooks/useMultiChain'
import { getPolkadotBalanceMultiProvider } from '../utils/multiProviderBalance'
import { getAccountInfoViaQuickNode, getAccountBalanceBreakdown, type AccountInfo } from '../utils/accountInfo'
import { getSubscanAccountInfo, getSubscanTransfers, type SubscanAccountInfo, type SubscanTransfer } from '../utils/subscanAccountInfo'

import RiskBadgeView from './RiskBadgeView'
import DotSuggestions from './DotSuggestions'
import { useDotPrice } from '../hooks/useDotPrice'
import './PortfolioView.css'

interface PortfolioViewProps {
  api: ApiPromise | null
  accounts: InjectedAccountWithMeta[]
  isManualMode?: boolean
}

interface BalanceInfo {
  account: string
  free: string
  reserved: string
  total: string
  chain: string
  token: string
}

export default function PortfolioView({ api, accounts, isManualMode = false }: PortfolioViewProps) {
  const { chainApis, isInitializing, getBalance } = useMultiChain()
  const dotPrice = useDotPrice()
  const [balances, setBalances] = useState<BalanceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chainStats, setChainStats] = useState<Map<string, { count: number; total: string }>>(new Map())
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [balanceBreakdown, setBalanceBreakdown] = useState<{
    free: string
    reserved: string
    frozen: string
    miscFrozen: string
    feeFrozen: string
    total: string
  } | null>(null)
  const [isLoadingAccountInfo, setIsLoadingAccountInfo] = useState(false)
  const [subscanInfo, setSubscanInfo] = useState<SubscanAccountInfo | null>(null)
  const [recentTransfers, setRecentTransfers] = useState<SubscanTransfer[]>([])
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false)
  const [flexLevel, setFlexLevel] = useState(1)
  const [flexXP, setFlexXP] = useState(0)
  const [totalFlexes, setTotalFlexes] = useState(0)
  const [showFlexAnimation, setShowFlexAnimation] = useState(false)
  
  const loadBalances = useCallback(async () => {
    if (accounts.length === 0) {
      console.log('[Portfolio] No accounts to query balances for')
      setIsLoading(false)
      setBalances([])
      setHasLoadedOnce(true)
      return
    }

    try {
      setIsLoading(true)
      const allBalances: BalanceInfo[] = []

      // Query Polkadot chain using multiple providers (Subscan → QuickNode → Public RPC)
      const POLKADOT_CHAIN = 'Polkadot'
      console.log(`[Portfolio] Querying ${POLKADOT_CHAIN} chain using multiple providers...`)
      
      for (const account of accounts) {
        console.log(`[Portfolio] Fetching balance for ${account.address.substring(0, 12)}...`)
        
        const balanceResult = await getPolkadotBalanceMultiProvider(account.address, (msg) => {
          console.log(`[Portfolio] ${msg}`)
        })
        
        if (balanceResult && balanceResult.success) {
          allBalances.push({
            account: account.address,
            free: balanceResult.free,
            reserved: balanceResult.reserved,
            total: balanceResult.total,
            chain: POLKADOT_CHAIN,
            token: balanceResult.token
          })
          console.log(`[Portfolio] ✓ Balance found via ${balanceResult.provider} (${balanceResult.responseTime}ms)`)
          console.log(`[Portfolio]   Free: ${balanceResult.free} DOT`)
          console.log(`[Portfolio]   Reserved: ${balanceResult.reserved} DOT`)
          console.log(`[Portfolio]   Total: ${balanceResult.total} DOT`)
        } else {
          console.warn(`[Portfolio] ✗ All providers failed for ${account.address.substring(0, 8)}...`)
        }
      }
      
      console.log(`[Portfolio] Completed. Found ${allBalances.length} balances`)
      
      if (allBalances.length === 0) {
        console.warn('[Portfolio] No balances found. Check console for individual chain errors.')
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

      console.log('[Portfolio] All balances:', allBalances)
      setHasLoadedOnce(true)

      // Load flex stats from localStorage
      if (accounts.length > 0) {
        const savedStats = localStorage.getItem(`flex-stats-${accounts[0].address}`)
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          setFlexLevel(stats.level || 1)
          setFlexXP(stats.xp || 0)
          setTotalFlexes(stats.totalFlexes || 0)
        }
      }

      // Load additional account information via QuickNode and Subscan
      if (accounts.length > 0) {
        setIsLoadingAccountInfo(true)
        setIsLoadingTransfers(true)
        try {
          const account = accounts[0]
          console.log('[Portfolio] Loading detailed account info...')
          
          const [info, breakdown, subscanData, transfers] = await Promise.all([
            getAccountInfoViaQuickNode(account.address, (msg) => {
              console.log(`[Portfolio] ${msg}`)
            }),
            getAccountBalanceBreakdown(account.address),
            getSubscanAccountInfo(account.address),
            getSubscanTransfers(account.address, 0, 5)
          ])

          if (info) {
            setAccountInfo(info)
            console.log('[Portfolio] Account info loaded:', info)
          }
          
          if (breakdown) {
            setBalanceBreakdown(breakdown)
            console.log('[Portfolio] Balance breakdown loaded:', breakdown)
          }

          if (subscanData) {
            setSubscanInfo(subscanData)
            console.log('[Portfolio] Subscan info loaded:', subscanData)
          }

          if (transfers) {
            setRecentTransfers(transfers)
            console.log('[Portfolio] Recent transfers loaded:', transfers.length)
          }
        } catch (error: any) {
          console.error('[Portfolio] Failed to load account info:', error.message || error)
        } finally {
          setIsLoadingAccountInfo(false)
          setIsLoadingTransfers(false)
        }
      }
    } catch (error: any) {
      console.error('[Portfolio] Failed to load balances:', error.message || error)
      setBalances([])
      setHasLoadedOnce(true)
    } finally {
      setIsLoading(false)
    }
  }, [accounts, chainApis, getBalance])

  // Reset loading state when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      setHasLoadedOnce(false)
      setIsLoading(true)
    }
  }, [accounts.map(a => a.address).join(',')])

  useEffect(() => {
    // Trigger loading immediately - Subscan API doesn't need RPC connections
    if (!hasLoadedOnce && accounts.length > 0) {
      console.log(`[Portfolio] Starting balance load via Subscan API for ${accounts.length} account(s)`)
      loadBalances()
    } else if (!hasLoadedOnce && accounts.length === 0) {
      console.log('[Portfolio] No accounts connected')
      setIsLoading(false)
      setHasLoadedOnce(true)
    }
  }, [hasLoadedOnce, accounts.length, loadBalances])

  // Show loading state while fetching balances
  if (isLoading || !hasLoadedOnce) {
    return (
      <div className="portfolio-view">
        <h2>Portfolio</h2>
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Polkadot portfolio...</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle case when no accounts are connected
  if (accounts.length === 0) {
    return (
      <div className="portfolio-view">
        <h2>Portfolio Overview</h2>
        <div className="no-balances">
          <p>No accounts connected.</p>
          <p className="hint">Please connect your wallet to view your portfolio.</p>
        </div>
      </div>
    )
  }

  // Group balances by chain for better organization
  const balancesByChain = new Map<string, BalanceInfo[]>()
  balances.forEach(balance => {
    const existing = balancesByChain.get(balance.chain) || []
    balancesByChain.set(balance.chain, [...existing, balance])
  })

  return (
    <div className="portfolio-view">
      <div className="portfolio-header">
        <h2>Portfolio</h2>
        <button 
            onClick={() => {
              setHasLoadedOnce(false)
              setAccountInfo(null)
              setBalanceBreakdown(null)
              setSubscanInfo(null)
              setRecentTransfers([])
              loadBalances()
            }} 
            className="refresh-button-compact" 
            disabled={isLoading}
            title="Refresh balances"
          >
            {isLoading ? '⟳' : '↻'}
          </button>
      </div>

      {/* Account Information & Balance Summary */}
      {accounts.length > 0 && (
        <div className="account-info-section">
          <div className="account-header-compact">
            <div className="account-address-compact-top" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span><strong>Address:</strong> {accounts[0].address}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(accounts[0].address)
                  alert('✓ Address copied!')
                }}
                style={{
                  background: 'rgba(230, 0, 122, 0.2)',
                  border: '1px solid rgba(230, 0, 122, 0.4)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: '#e6007a'
                }}
                title="Copy address"
              >
                📋
              </button>
            </div>
            {balances.length > 0 && accountInfo && (() => {
              const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.total), 0)
              const balanceBigInt = BigInt(Math.floor(totalBalance * 10 ** 10))
              const stakedBalance = accountInfo?.staking?.bonded 
                ? BigInt(Math.floor(parseFloat(accountInfo.staking.bonded) * 10 ** 10))
                : 0n
              const liquidBalance = balanceBigInt - stakedBalance
              const stakingRatio = balanceBigInt > 0n ? Number(stakedBalance) / Number(balanceBigInt) : 0
              
              return (
                <div className="balance-stats-compact-top">
                  <div className="balance-stat-row-top">
                    <span className="balance-stat-label-top">Total Value:</span>
                    <span className="balance-stat-value-top">
                      {totalBalance.toFixed(2)} DOT
                      {dotPrice && <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '0.5rem' }}>
                        (${(totalBalance * dotPrice).toFixed(2)})
                      </span>}
                    </span>
                  </div>
                  <div className="balance-stat-row-top">
                    <span className="balance-stat-label-top">Liquid:</span>
                    <span className="balance-stat-value-top">{(Number(liquidBalance) / 10 ** 10).toFixed(4)} DOT</span>
                  </div>
                  <div className="balance-stat-row-top">
                    <span className="balance-stat-label-top">Staked:</span>
                    <span className="balance-stat-value-top">{(Number(stakedBalance) / 10 ** 10).toFixed(4)} DOT</span>
                  </div>
                  <div className="balance-stat-row-top">
                    <span className="balance-stat-label-top">Staking Ratio:</span>
                    <span className="balance-stat-value-top">{(stakingRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )
            })()}
          </div>
          
          <div className="account-details">
            
            {isLoadingAccountInfo ? (
              <div className="account-info-loading">Loading comprehensive account details...</div>
            ) : (accountInfo || subscanInfo) ? (
              <div className="account-info-grid">
                <div className="info-item">
                  <span className="info-label">Transaction Count (Nonce):</span>
                  <span className="info-value">{accountInfo?.nonce || subscanInfo?.nonce || 0}</span>
                </div>

                {subscanInfo?.countExtrinsic && (
                  <div className="info-item">
                    <span className="info-label">Total Extrinsics:</span>
                    <span className="info-value">{subscanInfo.countExtrinsic.toLocaleString()}</span>
                  </div>
                )}

                {subscanInfo?.role && subscanInfo.role !== 'none' && (
                  <div className="info-item">
                    <span className="info-label">Network Role:</span>
                    <span className="info-value" style={{ textTransform: 'capitalize' }}>{subscanInfo.role}</span>
                  </div>
                )}

                {subscanInfo?.isCouncilMember && (
                  <div className="info-item">
                    <span className="info-label">Council Member:</span>
                    <span className="info-value" style={{ color: '#4ade80' }}>✓ Yes</span>
                  </div>
                )}

                {subscanInfo?.isRegistrar && (
                  <div className="info-item">
                    <span className="info-label">Registrar:</span>
                    <span className="info-value" style={{ color: '#4ade80' }}>✓ Yes</span>
                  </div>
                )}
                
                {accountInfo?.accountIndex && (
                  <div className="info-item">
                    <span className="info-label">Account Index:</span>
                    <span className="info-value">{accountInfo?.accountIndex}</span>
                  </div>
                )}

                {accountInfo?.identity && (
                  <div className="info-item identity-section">
                    <span className="info-label">Identity:</span>
                    <div className="identity-details">
                      {accountInfo?.identity.display && (
                        <div className="identity-field">
                          <strong>Display:</strong> {accountInfo?.identity.display}
                          {accountInfo?.identity.verified && <span className="verified-badge">✓ Verified</span>}
                        </div>
                      )}
                      {accountInfo?.identity.email && (
                        <div className="identity-field">
                          <strong>Email:</strong> {accountInfo?.identity.email}
                        </div>
                      )}
                      {accountInfo?.identity.twitter && (
                        <div className="identity-field">
                          <strong>Twitter:</strong> @{accountInfo?.identity.twitter}
                        </div>
                      )}
                      {accountInfo?.identity.web && (
                        <div className="identity-field">
                          <strong>Web:</strong> <a href={accountInfo?.identity.web} target="_blank" rel="noopener noreferrer">{accountInfo?.identity.web}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(accountInfo?.staking || subscanInfo?.bonded) && (
                  <div className="info-item staking-section">
                    <span className="info-label">Staking:</span>
                    <div className="staking-details">
                      <div className="staking-field">
                        <strong>Bonded:</strong> {accountInfo?.staking?.bonded || (subscanInfo?.bonded ? (parseFloat(subscanInfo.bonded) / 1e10).toFixed(4) : '0')} DOT
                      </div>
                      {((accountInfo?.staking?.unbonding && parseFloat(accountInfo.staking.unbonding) > 0) || (subscanInfo?.unbonding && parseFloat(subscanInfo.unbonding) > 0)) && (
                        <div className="staking-field">
                          <strong>Unbonding:</strong> {accountInfo?.staking?.unbonding || (subscanInfo?.unbonding ? (parseFloat(subscanInfo.unbonding) / 1e10).toFixed(4) : '0')} DOT
                        </div>
                      )}
                      {subscanInfo?.democracy_lock && parseFloat(subscanInfo.democracy_lock) > 0 && (
                        <div className="staking-field">
                          <strong>Democracy Lock:</strong> {(parseFloat(subscanInfo.democracy_lock) / 1e10).toFixed(4)} DOT
                        </div>
                      )}
                      {subscanInfo?.election_lock && parseFloat(subscanInfo.election_lock) > 0 && (
                        <div className="staking-field">
                          <strong>Election Lock:</strong> {(parseFloat(subscanInfo.election_lock) / 1e10).toFixed(4)} DOT
                        </div>
                      )}
                      {accountInfo?.staking?.isValidator && (
                        <div className="staking-badge validator">Validator</div>
                      )}
                      {accountInfo?.staking?.isNominator && (
                        <div className="staking-badge nominator">Nominator</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Recent Transfers */}
            {isLoadingTransfers ? (
              <div className="transfers-loading" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                Loading recent transactions...
              </div>
            ) : recentTransfers.length > 0 && (
              <div className="recent-transfers-section" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Transfers</h4>
                <div className="transfers-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentTransfers.map((transfer, idx) => (
                    <div key={idx} className="transfer-item" style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: transfer.from === accounts[0].address ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: transfer.from === accounts[0].address ? '#ef4444' : '#22c55e',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {transfer.from === accounts[0].address ? 'OUT' : 'IN'}
                          </span>
                          <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {(parseFloat(transfer.amount) / 1e10).toFixed(4)} DOT
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {new Date(transfer.blockTimestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>
                          <strong>From:</strong> {transfer.from.slice(0, 8)}...{transfer.from.slice(-6)}
                        </div>
                        <div>
                          <strong>To:</strong> {transfer.to.slice(0, 8)}...{transfer.to.slice(-6)}
                        </div>
                        <div>
                          <strong>Block:</strong> #{transfer.blockNum.toLocaleString()}
                        </div>
                        <a 
                          href={`https://polkadot.subscan.io/extrinsic/${transfer.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#e6007a', textDecoration: 'none', marginTop: '0.25rem' }}
                        >
                          View on Subscan →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <a 
                  href={`https://polkadot.subscan.io/account/${accounts[0].address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(230, 0, 122, 0.2)',
                    border: '1px solid rgba(230, 0, 122, 0.4)',
                    borderRadius: '8px',
                    color: '#e6007a',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'all 0.3s ease'
                  }}
                >
                  View All Transactions on Subscan →
                </a>
              </div>
            )}

            {balanceBreakdown && (
              <div className="balance-breakdown-section">
                <div className="breakdown-grid-compact">
                  <div className="breakdown-item-compact">
                    <span className="breakdown-label">Free:</span>
                    <span className="breakdown-value">{balanceBreakdown.free} DOT</span>
                  </div>
                  <div className="breakdown-item-compact">
                    <span className="breakdown-label">Reserved:</span>
                    <span className="breakdown-value">{balanceBreakdown.reserved} DOT</span>
                  </div>
                  {parseFloat(balanceBreakdown.frozen) > 0 && (
                    <div className="breakdown-item-compact">
                      <span className="breakdown-label">Frozen:</span>
                      <span className="breakdown-value">{balanceBreakdown.frozen} DOT</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flex Your DOT Section */}
      {accounts.length > 0 && balances.length > 0 && (
        <div className="flex-section" style={{
          marginTop: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(230, 0, 122, 0.1) 0%, rgba(230, 0, 122, 0.05) 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(230, 0, 122, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>💪 Flex Your DOT</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(230, 0, 122, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(230, 0, 122, 0.4)'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Level </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e6007a' }}>{flexLevel}</span>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(230, 0, 122, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(230, 0, 122, 0.4)'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>XP: </span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e6007a' }}>{flexXP}/{flexLevel * 100}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              width: '100%',
              height: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(flexXP / (flexLevel * 100)) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #e6007a 0%, #ff1493 100%)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{totalFlexes}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Total Flexes</div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {balances.reduce((sum, b) => sum + parseFloat(b.total), 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Total DOT</div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                {(() => {
                  const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.total), 0)
                  if (totalBalance >= 1000) return 'Whale'
                  if (totalBalance >= 100) return 'Dolphin'
                  if (totalBalance >= 10) return 'Fish'
                  return 'Shrimp'
                })()}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>Rank</div>
            </div>
          </div>

          <button
            onClick={() => {
              const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.total), 0)
              const xpGained = Math.floor(totalBalance * 10)
              const newXP = flexXP + xpGained
              const newLevel = Math.floor(newXP / 100) + 1
              const newTotalFlexes = totalFlexes + 1

              setFlexXP(newXP % (newLevel * 100))
              setFlexLevel(newLevel)
              setTotalFlexes(newTotalFlexes)
              setShowFlexAnimation(true)

              // Save to localStorage
              localStorage.setItem(`flex-stats-${accounts[0].address}`, JSON.stringify({
                level: newLevel,
                xp: newXP % (newLevel * 100),
                totalFlexes: newTotalFlexes
              }))

              setTimeout(() => setShowFlexAnimation(false), 2000)

              // Share on Twitter
              const tweetText = `In the vast ocean of blockchain, I hold ${totalBalance.toFixed(2)} DOT close to my heart.\n\nLevel ${newLevel} achieved, ${newTotalFlexes} moments of pride.\n\nA ${totalBalance >= 1000 ? 'whale' : totalBalance >= 100 ? 'dolphin' : totalBalance >= 10 ? 'fish' : 'shrimp'} swimming through the Polkadot seas, building the future one block at a time.`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank')
            }}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #e6007a 0%, #ff1493 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 0, 122, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            💪 FLEX MY DOT & SHARE
          </button>

          {showFlexAnimation && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '4rem',
              animation: 'flexPop 2s ease-out',
              zIndex: 1000,
              pointerEvents: 'none'
            }}>
              💪✨
            </div>
          )}

          <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
            Earn XP by flexing your DOT! Level up and unlock achievements 🎮
          </div>
        </div>
      )}

      {/* DOT Suggestions */}
      <DotSuggestions />

      {/* Risk Badge */}
      {accounts.length > 0 && balances.length > 0 && (
        <div className="portfolio-extras" style={{ marginTop: '2rem' }}>
          {(() => {
            const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.total), 0)
            const balanceBigInt = BigInt(Math.floor(totalBalance * 10 ** 10))
            const stakedBalance = accountInfo?.staking?.bonded 
              ? BigInt(Math.floor(parseFloat(accountInfo.staking.bonded) * 10 ** 10))
              : 0n
            const liquidBalance = balanceBigInt - stakedBalance

            return (
              <RiskBadgeView 
                address={accounts[0].address}
                liquidBalance={liquidBalance}
                stakedBalance={stakedBalance}
              />
            )
          })()}
        </div>
      )}

      {/* Removed: ZK Proof, Historical Snapshots, Achievements sections */}
      {false && (
        <div className="proof-section">
          <h3>Flex Your DOT</h3>
          <p className="section-description">
            Generate a zero-knowledge proof to flex your Polkadot holdings without revealing exact amounts.
            Earn XP and level up! Choose current balance or select a historical date.
          </p>
          
          {/* Privacy Notice: Multi-account aggregation */}
          {accounts.length > 1 && (
            <div className="privacy-aggregation-notice" style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.15)', 
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#22c55e', fontWeight: 500 }}>
                🔒 Privacy: Multi-Account Aggregation
              </p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Your proof aggregates balances across <strong>{accounts.length} connected accounts</strong>, hiding which specific account holds the assets. 
                This protects your privacy by bundling multiple addresses together.
              </p>
            </div>
          )}
          
          {isManualMode && (
            <div className="manual-mode-notice" style={{ 
              backgroundColor: 'rgba(255, 193, 7, 0.15)', 
              border: '1px solid rgba(255, 193, 7, 0.3)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p><strong>Wallet Connection Required:</strong></p>
              <p>ZK proof generation requires a connected wallet. Manual address entry is read-only. Please connect your Polkadot Wallet extension to generate proofs.</p>
            </div>
          )}
          

          
          <div className="proof-inputs">
            <div className="threshold-input-group">
              <label htmlFor="proof-threshold">Threshold (DOT):</label>
              <input
                id="proof-threshold"
                type="number"
                value={proofThreshold}
                onChange={(e) => setProofThreshold(e.target.value)}
                min="0"
                step="0.1"
                disabled={isGeneratingProof}
                placeholder="100"
              />
            </div>
            
            <div className="label-input-group">
              <label htmlFor="proof-label">Label (optional):</label>
              <input
                id="proof-label"
                type="text"
                value={proofLabel}
                onChange={(e) => setProofLabel(e.target.value)}
                disabled={isGeneratingProof}
                placeholder="e.g., Q1 2024"
                maxLength={50}
              />
            </div>
            
            <button
              onClick={async () => {
                const totalBalance = balances.reduce((sum, b) => sum + parseFloat(b.total), 0)
                const balanceBigInt = BigInt(Math.floor(totalBalance * 10 ** 10))
                const thresholdBigInt = BigInt(Math.floor(parseFloat(proofThreshold) * 10 ** 10))
                
                if (balanceBigInt === 0n) {
                  setProofError('Portfolio value is zero. Please ensure you have balances.')
                  return
                }
                
                if (balanceBigInt <= thresholdBigInt) {
                  setProofError(`Portfolio value must exceed threshold of ${proofThreshold} DOT`)
                  return
                }
                
                // Check if manual mode - prevent proof generation
                if (isManualMode) {
                  setProofError('ZK proof generation requires a connected wallet. Manual address entry is read-only.')
                  return
                }
                
                setIsGeneratingProof(true)
                setProofError(null)
                
                try {
                  const proofTimestamp = Date.now()
                  
                  // Generate proof for current balance using native Substrate ZK
                  const zkProof = await generateSubstrateZKProof(balanceBigInt, thresholdBigInt)
                  
                  if (zkProof) {
                    const proofData = {
                      proof: zkProof,
                      publicSignals: [zkProof.publicInputs.threshold],
                      portfolioValue: (balanceBigInt / BigInt(10 ** 10)).toString(),
                      threshold: proofThreshold,
                      timestamp: proofTimestamp,
                      label: proofLabel || undefined
                    }
                    
                    setProof(proofData)
                    
                    // Gamification: Award XP and update stats
                    const proofXp = awardProofXp(thresholdBigInt)
                    const streakUpdate = updateStreak(flexStats.lastProofDate, flexStats.currentStreak)
                    const newTotalXp = userLevel.totalXp + proofXp + streakUpdate.streakBonus
                    const newLevel = calculateLevel(newTotalXp)
                    
                    const updatedStats: FlexStats = {
                      totalProofsGenerated: flexStats.totalProofsGenerated + 1,
                      highestThresholdProved: thresholdBigInt > flexStats.highestThresholdProved 
                        ? thresholdBigInt 
                        : flexStats.highestThresholdProved,
                      totalSnapshots: flexStats.totalSnapshots,
                      longestStreak: Math.max(flexStats.longestStreak, streakUpdate.currentStreak),
                      currentStreak: streakUpdate.currentStreak,
                      lastProofDate: Date.now(),
                      badges: flexStats.badges
                    }
                    
                    setFlexStats(updatedStats)
                    setUserLevel(newLevel)
                    
                    // Save to localStorage
                    if (accounts.length > 0) {
                      localStorage.setItem(`dotflex-stats-${accounts[0].address}`, JSON.stringify({
                        ...updatedStats,
                        highestThresholdProved: updatedStats.highestThresholdProved.toString()
                      }))
                      localStorage.setItem(`dotflex-xp-${accounts[0].address}`, newTotalXp.toString())
                    }
                    

                    
                    console.log('[DotFlex] ZK proof generated successfully:', zkProof)
                    console.log(`[DotFlex] Earned ${proofXp} XP (+${streakUpdate.streakBonus} streak bonus)`)
                    console.log(`[DotFlex] Level: ${newLevel.level} (${newLevel.xp}/${newLevel.xpToNextLevel} XP)`)
                  } else {
                    throw new Error('Failed to generate proof')
                  }
                } catch (err: any) {
                  console.error('[Portfolio] Proof generation error:', err)
                  setProofError(`Proof generation failed: ${err.message}`)
                } finally {
                  setIsGeneratingProof(false)
                }
              }}
              disabled={isGeneratingProof || balances.length === 0 || isManualMode}
              className="generate-proof-button"
              title={isManualMode ? 'Wallet connection required to generate ZK proofs' : undefined}
            >
              {isGeneratingProof ? 'Generating Proof...' : 'Generate ZK Proof'}
            </button>
            
            {/* Faucet button - Get testnet tokens before generating proof */}
            {!polkadotApi && (
              <div className="faucet-notice" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#fbbf24', fontWeight: 500 }}>
                  💧 Need testnet tokens to submit proofs?
                </span>
                <a
                  href="https://faucet.polkadot.io/westend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="faucet-button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#fbbf24',
                    color: '#000',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f59e0b'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fbbf24'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  🚰 Get Tokens
                </a>
              </div>
            )}
          </div>
          
          {proofError && (
            <div className="proof-error">
              <p>{proofError}</p>
            </div>
          )}
          
          {proof && (
            <div className="proof-result">
              <h4>✓ Proof Generated Successfully</h4>
              <div className="proof-details">
                {proof.label && (
                  <div className="proof-info-row">
                    <span className="proof-label">Label:</span>
                    <span className="proof-value">{proof.label}</span>
                  </div>
                )}
                <div className="proof-info-row">
                  <span className="proof-label">Portfolio Value:</span>
                  <span className="proof-value">{proof.portfolioValue} DOT</span>
                </div>
                <div className="proof-info-row">
                  <span className="proof-label">Threshold:</span>
                  <span className="proof-value">{proof.threshold} DOT</span>
                </div>
                <div className="proof-info-row">
                  <span className="proof-label">Generated:</span>
                  <span className="proof-value">{new Date(proof.timestamp).toLocaleString()}</span>
                </div>
                <div className="proof-data">
                  <details>
                    <summary>View Proof Data</summary>
                    <pre className="proof-json">
                      {JSON.stringify({
                        publicSignals: proof.publicSignals,
                        proof: proof.proof
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
                <div className="proof-actions">
                  {/* Submit to Polkadot Chain */}
                  {polkadotApi ? (
                    <div className="chain-submission">
                      {/* Privacy: Account selector for proof submission */}
                      {proof && accounts.length > 0 && (
                        <div className="privacy-notice" style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px' }}>
                          <p style={{ margin: '0 0 0.75rem 0', color: '#3b82f6', fontWeight: 500 }}>
                            🔒 Privacy: Select Account for Proof Submission
                          </p>
                          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                            Use a <strong>different account</strong> to submit the proof and avoid linking your portfolio address to the proof on-chain.
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                              Submission Account:
                            </label>
                            <select
                              value={proofSubmissionAccount || accounts[0].address}
                              onChange={(e) => setProofSubmissionAccount(e.target.value)}
                              style={{
                                padding: '0.75rem',
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                              }}
                              disabled={isSubmittingToChain}
                            >
                              {accounts.map((acc, idx) => (
                                <option key={acc.address} value={acc.address}>
                                  {acc.meta?.name || `Account ${idx + 1}`}: {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                                  {idx === 0 ? ' (Portfolio Holder)' : ' (Recommended for Privacy)'}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const currentSubmissionAccount = proofSubmissionAccount || accounts[0]?.address
                              const isSameAccount = currentSubmissionAccount === accounts[0]?.address
                              
                              if (isSameAccount && accounts.length > 1) {
                                return (
                                  <div style={{ marginTop: '0.5rem' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 500 }}>
                                      ⚠️ Warning: Using the same account as your portfolio may reveal the connection.
                                    </p>
                                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#fbbf24' }}>
                                      Please select a <strong>different account</strong> from the dropdown above to preserve privacy.
                                    </p>
                                  </div>
                                )
                              } else if (!isSameAccount && proofSubmissionAccount) {
                                return (
                                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#4ade80' }}>
                                    ✓ Good! Using a different account preserves privacy.
                                  </p>
                                )
                              } else if (accounts.length === 1) {
                                return (
                                  <div style={{ marginTop: '0.5rem' }}>
                                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 500 }}>
                                      ⚠️ Only one account available. For better privacy, add another account to your wallet.
                                    </p>
                                    <div style={{ 
                                      padding: '0.75rem', 
                                      background: 'rgba(0, 0, 0, 0.2)', 
                                      borderRadius: '8px',
                                      fontSize: '0.85rem',
                                      color: 'rgba(255, 255, 255, 0.8)'
                                    }}>
                                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: '#fbbf24' }}>
                                        How to add another account:
                                      </p>
                                      <ol style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                                        <li>Click the <strong>Polkadot Wallet extension icon</strong> in your browser toolbar</li>
                                        <li>Click the <strong>"+" button</strong> or <strong>"Add Account"</strong></li>
                                        <li>Follow the prompts to create a new account</li>
                                        <li>Come back here and click <strong>"Refresh Accounts"</strong> below</li>
                                      </ol>
                                      <button
                                        onClick={async () => {
                                          try {
                                            const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp')
                                            await web3Enable('DotFlex')
                                            const allAccounts = await web3Accounts()
                                            if (allAccounts.length > accounts.length) {
                                              // Force page reload to refresh accounts
                                              window.location.reload()
                                            } else {
                                              alert('No new accounts found. Please add an account in the Polkadot Wallet extension first.')
                                            }
                                          } catch (err: any) {
                                            console.error('[Portfolio] Failed to refresh accounts:', err)
                                            alert('Failed to refresh accounts. Please try reloading the page.')
                                          }
                                        }}
                                        style={{
                                          padding: '0.5rem 1rem',
                                          background: 'rgba(251, 191, 36, 0.2)',
                                          border: '1px solid rgba(251, 191, 36, 0.4)',
                                          borderRadius: '6px',
                                          color: '#fbbf24',
                                          fontSize: '0.85rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)'
                                        }}
                                      >
                                        🔄 Refresh Accounts
                                      </button>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          // Check if using same account
                          const currentSubmissionAccount = proofSubmissionAccount || accounts[0]?.address
                          if (currentSubmissionAccount === accounts[0]?.address && accounts.length > 1) {
                            setChainSubmissionError('Please select a different account from the dropdown above to preserve privacy before submitting.')
                            setChainSubmissionStatus('error')
                            return
                          }
                          submitProofToChain()
                        }}
                        disabled={
                          isSubmittingToChain || 
                          chainSubmissionStatus === 'success' ||
                          (() => {
                            const currentSubmissionAccount = proofSubmissionAccount || accounts[0]?.address
                            return currentSubmissionAccount === accounts[0]?.address && accounts.length > 1
                          })()
                        }
                        className="submit-chain-button"
                        title={
                          (() => {
                            const currentSubmissionAccount = proofSubmissionAccount || accounts[0]?.address
                            if (currentSubmissionAccount === accounts[0]?.address && accounts.length > 1) {
                              return 'Please select a different account to preserve privacy'
                            }
                            return 'Submit proof to Polkadot chain for on-chain verification'
                          })()
                        }
                        style={{
                          opacity: (() => {
                            const currentSubmissionAccount = proofSubmissionAccount || accounts[0]?.address
                            return (currentSubmissionAccount === accounts[0]?.address && accounts.length > 1) ? 0.5 : 1
                          })()
                        }}
                      >
                        {isSubmittingToChain ? 'Submitting...' : chainSubmissionStatus === 'success' ? '✓ Submitted to Chain' : 'Submit to Polkadot Chain'}
                      </button>
                      {chainSubmissionStatus === 'submitting' && (
                        <p className="submission-status">Submitting proof to Polkadot chain...</p>
                      )}
                      {chainSubmissionStatus === 'success' && (
                        <p className="submission-status success">✓ Proof submitted successfully to Polkadot chain!</p>
                      )}
                      {chainSubmissionError && (
                        <div className="submission-error" style={{ marginTop: '1rem' }}>
                          <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginBottom: '1rem' }}>
                            ✗ Failed to submit to chain: {chainSubmissionError}
                          </p>
                          <button
                            onClick={() => {
                              // Reset error and try again
                              setChainSubmissionError(null)
                              setChainSubmissionStatus('idle')
                              submitProofToChain()
                            }}
                            className="retry-button"
                            disabled={isSubmittingToChain}
                            style={{
                              marginTop: '0.75rem',
                              background: 'rgba(255, 107, 107, 0.2)',
                              color: '#ff6b6b',
                              border: '1px solid rgba(255, 107, 107, 0.4)',
                              padding: '0.5rem 1.5rem',
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Retry Submission
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="polkadot-hint">
                      {isConnectingPolkadot 
                        ? 'Connecting to Polkadot chain...' 
                        : 'Polkadot chain not connected. Configure VITE_POLKADOT_RPC_URL to submit proofs on-chain.'}
                    </p>
                  )}
                  
                  {/* Only show tweet button after proof is successfully submitted to Polkadot chain */}
                  {chainSubmissionStatus === 'success' && (
                    <button
                      onClick={() => {
                        if (!proof) return
                        const labelText = proof.label ? ` "${proof.label}"` : ''
                        const tweetText = `🔐 I just generated a ZK proof that my portfolio balance is above ${proof.threshold} DOT${labelText}!\n\n✨ Privacy-preserving proof without revealing my addresses or exact balances\n\n#ZKProof #ZeroKnowledge #Polkadot #Privacy #DotFlex`
                        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
                        window.open(tweetUrl, '_blank', 'noopener,noreferrer')
                      }}
                      className="tweet-button"
                      title="Share your ZK proof on Twitter"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                      Tweet
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Historical Snapshots Timeline */}
          {historicalSnapshots.length > 0 && (
            <div className="snapshots-timeline">
              <h4>Your Flex Timeline</h4>
              <div className="timeline-container">
                {historicalSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="snapshot-item">
                    <div className="snapshot-header">
                      <div className="snapshot-info">
                        <div className="snapshot-label">{snapshot.label || 'Unlabeled'}</div>
                        <div className="snapshot-date">{new Date(snapshot.timestamp).toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => {
                          setHistoricalSnapshots(historicalSnapshots.filter(s => s.id !== snapshot.id))
                        }}
                        className="delete-snapshot-button"
                        title="Delete snapshot"
                      >
                        ×
                      </button>
                    </div>
                    <div className="snapshot-proof-info">
                      <div className="snapshot-proof-row">
                        <span className="snapshot-proof-label">Flexed:</span>
                        <span className="snapshot-proof-value">
                          Balance &gt; {(Number(snapshot.threshold) / 10 ** 10).toFixed(4)} DOT
                        </span>
                      </div>
                      <div className="snapshot-proof-id">
                        Proof ID: {snapshot.id.substring(0, 16)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="achievements-section">
              <h4>Achievements</h4>
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-description">{achievement.description}</div>
                    </div>
                    {achievement.unlocked && (
                      <div className="achievement-badge">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

