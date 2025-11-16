import { useState } from 'react'
import './StakingCalculator.css'

export default function StakingCalculator() {
  const [amount, setAmount] = useState('')
  const APY = 14 // 14% average staking APY

  const yearlyRewards = amount ? (parseFloat(amount) * APY / 100).toFixed(2) : '0'
  const monthlyRewards = amount ? (parseFloat(amount) * APY / 100 / 12).toFixed(2) : '0'

  return (
    <div className="staking-calculator">
      <h3>💰 Staking Calculator</h3>
      <div className="calc-input">
        <label>DOT Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter DOT amount"
          min="0"
          step="0.01"
        />
      </div>
      
      <div className="calc-results">
        <div className="calc-item">
          <span className="calc-label">Est. Monthly Rewards</span>
          <span className="calc-value">{monthlyRewards} DOT</span>
        </div>
        <div className="calc-item">
          <span className="calc-label">Est. Yearly Rewards</span>
          <span className="calc-value">{yearlyRewards} DOT</span>
        </div>
        <div className="calc-item">
          <span className="calc-label">APY</span>
          <span className="calc-value">{APY}%</span>
        </div>
      </div>
      
      <p className="calc-note">* Estimates based on ~{APY}% average staking APY. Actual rewards may vary.</p>
    </div>
  )
}
