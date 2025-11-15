import { useState } from 'react'
import './WalletConnect.css'

interface WalletConnectProps {
  onConnect: () => void
  onManualConnect: (address: string) => void
}

export default function WalletConnect({ onConnect, onManualConnect }: WalletConnectProps) {
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualAddress.trim()) {
      alert('Please enter an address')
      return
    }
    setIsConnecting(true)
    const success = onManualConnect(manualAddress.trim())
    if (success) {
      setManualAddress('')
      setShowManualEntry(false)
    }
    setIsConnecting(false)
  }

  return (
    <div className="wallet-connect">
      <h2>Connect Your Wallet</h2>
      <p>Connect your Polkadot.js extension wallet or enter an address manually</p>
      
      {!showManualEntry ? (
        <>
          <div className="connect-options">
            <button onClick={onConnect} className="connect-button">
              Connect Wallet Extension
            </button>
            <div className="divider">
              <span>OR</span>
            </div>
            <button 
              onClick={() => setShowManualEntry(true)} 
              className="manual-button"
            >
              Enter Address Manually
            </button>
          </div>
          <div className="instructions">
            <h3>Don't have a wallet?</h3>
            <ol>
              <li>Install <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer">Polkadot.js Extension</a></li>
              <li>Create or import an account</li>
              <li>Or enter an address manually to view identity and portfolio</li>
            </ol>
          </div>
        </>
      ) : (
        <form onSubmit={handleManualSubmit} className="manual-entry-form">
          <div className="form-group">
            <label htmlFor="address">Polkadot Address</label>
            <input
              id="address"
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter Polkadot address (e.g., 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY)"
              required
              disabled={isConnecting}
              className="address-input"
            />
            <small className="input-hint">
              You can view identity and portfolio, but transactions require wallet connection
            </small>
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(false)
                setManualAddress('')
              }}
              disabled={isConnecting}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting || !manualAddress.trim()}
              className="submit-button"
            >
              {isConnecting ? 'Connecting...' : 'Connect Address'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

