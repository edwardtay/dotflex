/**
 * Risk and Exposure Badge Component
 * 
 * Simple label: Conservative, Balanced, or Degen
 * Based on how much DOT is liquid vs staked
 * Provable through ZK
 */

import { useState, useEffect } from 'react'
import { getAccountInfoViaQuickNode } from '../utils/accountInfo'
import './RiskBadgeView.css'

function calculateRiskBadge(liquid: bigint, staked: bigint): 'conservative' | 'balanced' | 'degen' {
  const total = liquid + staked
  if (total === 0n) return 'balanced'
  const ratio = Number(staked) / Number(total)
  if (ratio >= 0.8) return 'conservative'
  if (ratio >= 0.4) return 'balanced'
  return 'degen'
}

interface RiskBadgeProps {
  address: string
  liquidBalance: bigint
  stakedBalance: bigint
}

export default function RiskBadgeView({ address, liquidBalance, stakedBalance }: RiskBadgeProps) {
  const [badge, setBadge] = useState<'conservative' | 'balanced' | 'degen' | null>(null)
  const [stakingInfo, setStakingInfo] = useState<any>(null)

  useEffect(() => {
    const calculatedBadge = calculateRiskBadge(liquidBalance, stakedBalance)
    setBadge(calculatedBadge)
  }, [liquidBalance, stakedBalance])

  useEffect(() => {
    // Load staking info
    getAccountInfoViaQuickNode(address).then(info => {
      if (info && info.staking) {
        setStakingInfo(info.staking)
      }
    })
  }, [address])

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'conservative': return '#28a745'
      case 'balanced': return '#ffc107'
      case 'degen': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'conservative': return '🛡️'
      case 'balanced': return '⚖️'
      case 'degen': return '🚀'
      default: return '❓'
    }
  }

  const getBadgeDescription = (badgeType: string) => {
    switch (badgeType) {
      case 'conservative':
        return '80%+ of DOT is staked. You prioritize security and passive income.'
      case 'balanced':
        return '40-80% of DOT is staked. You balance staking rewards with liquidity.'
      case 'degen':
        return 'Less than 40% staked. You prefer liquidity for active trading.'
      default:
        return ''
    }
  }

  const total = liquidBalance + stakedBalance
  const stakingRatio = total > 0n ? Number(stakedBalance) / Number(total) : 0

  return (
    <div className="risk-badge-view">
      <h2>Risk & Exposure Badge</h2>
      
      {badge && (
        <div className="badge-display">
          <div 
            className={`badge-card ${badge}`}
            style={{ borderColor: getBadgeColor(badge) }}
          >
            <div className="badge-icon">{getBadgeIcon(badge)}</div>
            <div className="badge-label">{badge.toUpperCase()}</div>
            <div className="badge-description">{getBadgeDescription(badge)}</div>
          </div>


          {/* Staking Details */}
          {stakingInfo && (
            <div className="staking-details">
              <h3>Staking Details</h3>
              <div className="detail-row">
                <span className="detail-label">Bonded:</span>
                <span className="detail-value">{stakingInfo.bonded} DOT</span>
              </div>
              {parseFloat(stakingInfo.unbonding) > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Unbonding:</span>
                  <span className="detail-value">{stakingInfo.unbonding} DOT</span>
                </div>
              )}
              {stakingInfo.isValidator && (
                <div className="badge-tag validator">Validator</div>
              )}
              {stakingInfo.isNominator && (
                <div className="badge-tag nominator">Nominator</div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

