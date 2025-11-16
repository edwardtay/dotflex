import { useState, useEffect } from 'react'
import { getPolkadotStats, type PolkadotStats as Stats } from '../utils/polkadotStats'
import './PolkadotStats.css'

export default function PolkadotStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPolkadotStats().then(data => {
      setStats(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="polkadot-stats loading">
        <div className="stats-spinner"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="polkadot-stats">
      <div className="stats-header">
        <svg width="24" height="24" viewBox="0 0 1326 1410" fill="none">
          <ellipse cx="663" cy="147.33" rx="254" ry="147.33" fill="#E6007A"/>
          <ellipse cx="663" cy="1262.7" rx="254" ry="147.33" fill="#E6007A"/>
          <ellipse cx="663" cy="705" rx="254" ry="147.33" fill="#E6007A"/>
          <ellipse cx="180" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
          <ellipse cx="1146" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
          <ellipse cx="180" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
          <ellipse cx="1146" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
        </svg>
        <h3>Polkadot Network</h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">DOT Price</div>
          <div className="stat-value">${stats.price.toFixed(2)}</div>
          <div className={`stat-change ${stats.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
            {stats.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(stats.priceChange24h).toFixed(2)}%
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Market Cap</div>
          <div className="stat-value">${(stats.marketCap / 1e9).toFixed(2)}B</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Est. Staking APY</div>
          <div className="stat-value">~14%</div>
        </div>
      </div>

      <a 
        href="https://polkadot.network" 
        target="_blank" 
        rel="noopener noreferrer"
        className="learn-more"
      >
        Learn More About Polkadot →
      </a>
    </div>
  )
}
