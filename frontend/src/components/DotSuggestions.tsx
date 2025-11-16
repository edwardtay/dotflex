import './DotSuggestions.css'

export default function DotSuggestions() {
  return (
    <div className="dot-suggestions">
      <h3>💡 DOT Guide</h3>
      
      <div className="suggestions-grid">
        <div className="suggestion-card acquire">
          <div className="card-header">
            <span className="card-icon">🛒</span>
            <h4>How to Acquire DOT</h4>
          </div>
          <ul>
            <li>
              <strong>Centralized Exchanges:</strong>
              <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer">Binance</a>,
              <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer">Coinbase</a>,
              <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer">Kraken</a>
            </li>
            <li>
              <strong>Decentralized Exchanges:</strong>
              <a href="https://hydradx.io" target="_blank" rel="noopener noreferrer">HydraDX</a>,
              <a href="https://app.stellaswap.com" target="_blank" rel="noopener noreferrer">StellaSwap</a>
            </li>
            <li>
              <strong>Staking Rewards:</strong> Earn DOT by staking your existing holdings
            </li>
            <li>
              <strong>Testnet Faucet:</strong>
              <a href="https://faucet.polkadot.io/westend" target="_blank" rel="noopener noreferrer">Get Westend tokens</a> for testing
            </li>
          </ul>
        </div>

        <div className="suggestion-card usage">
          <div className="card-header">
            <span className="card-icon">⚡</span>
            <h4>What You Can Do with DOT</h4>
          </div>
          <ul>
            <li>
              <strong>Staking:</strong> Earn ~15% APY by nominating validators
            </li>
            <li>
              <strong>Governance:</strong> Vote on network upgrades and treasury proposals
            </li>
            <li>
              <strong>Parachain Auctions:</strong> Support projects via crowdloans
            </li>
            <li>
              <strong>Cross-Chain Transfers:</strong> Move assets across parachains using XCM
            </li>
            <li>
              <strong>DeFi:</strong> Provide liquidity, lend, or borrow on Polkadot DeFi platforms
            </li>
            <li>
              <strong>NFTs:</strong> Trade and collect NFTs on Polkadot marketplaces
            </li>
          </ul>
        </div>

        <div className="suggestion-card tips">
          <div className="card-header">
            <span className="card-icon">💎</span>
            <h4>Pro Tips</h4>
          </div>
          <ul>
            <li>Keep at least 1.1 DOT free for transaction fees and existential deposit</li>
            <li>Stake your DOT to earn passive income while maintaining liquidity</li>
            <li>Diversify across multiple validators to reduce risk</li>
            <li>Use nomination pools if you have less than 250 DOT</li>
            <li>Monitor governance proposals to stay informed about network changes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
