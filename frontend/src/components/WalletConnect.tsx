import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './WalletConnect.css'

interface WalletConnectProps {
  onConnectPolkadot?: () => void
  onManualConnect?: (address: string) => void
  polkadotConnected?: boolean
}

export default function WalletConnect({ 
  onConnectPolkadot, 
  onManualConnect,
  polkadotConnected = false
}: WalletConnectProps) {
  const navigate = useNavigate()
  const [manualAddress, setManualAddress] = useState('')
  const [connectingPolkadot, setConnectingPolkadot] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentPath = window.location.pathname
    if (polkadotConnected && currentPath !== '/portfolio') {
      navigate('/portfolio', { replace: true })
    }
  }, [polkadotConnected, navigate])

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAddress(e.target.value)
    setError(null)
  }

  const handleAddressAccept = () => {
    const address = manualAddress.trim()
    if (address.length > 0 && onManualConnect) {
      try {
        onManualConnect(address)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      }
    }
  }

  const handleConnectPolkadot = async () => {
    if (!onConnectPolkadot) return
    setConnectingPolkadot(true)
    setError(null)
    try {
      await onConnectPolkadot()
      setTimeout(() => {
        const currentPath = window.location.pathname
        if (currentPath !== '/portfolio') {
          navigate('/portfolio', { replace: true })
        }
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Failed to connect Polkadot wallet')
      setConnectingPolkadot(false)
    }
  }
  
  return (
    <div className="wallet-connect">
      <div className="connect-description">
        <p>See DOT balance on Polkadot chain</p>
      </div>

      {polkadotConnected && (
        <div className="wallet-status">
          <div className="status-badge polkadot">
            <span>✓</span> Polkadot Wallet Connected
          </div>
        </div>
      )}

      {error && (
        <div className="wallet-error">
          <p>{error}</p>
        </div>
      )}

      <div className="connect-options">
        {onConnectPolkadot && (
          <div className="wallet-option">
            {polkadotConnected ? (
              <div className="wallet-connected">
                <p>✓ Connected</p>
              </div>
            ) : (
              <button 
                onClick={handleConnectPolkadot} 
                className="connect-button polkadot-button"
                disabled={connectingPolkadot}
              >
                {connectingPolkadot ? 'Connecting...' : 'Connect Polkadot Wallet'}
              </button>
            )}
            <div className="wallet-install-hint">
              <small><a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer">Install Extension</a></small>
            </div>
          </div>
        )}

        {onManualConnect && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>
            <div className="wallet-option">
              <div className="form-group">
                <label htmlFor="address">Enter Polkadot Address Manually</label>
                <div className="address-input-wrapper">
                  <input
                    id="address"
                    type="text"
                    value={manualAddress}
                    onChange={handleAddressChange}
                    onBlur={handleAddressAccept}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddressAccept()
                      }
                    }}
                    placeholder="Enter Polkadot address (e.g., 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY)"
                    className="address-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddressAccept}
                    className="address-submit-indicator"
                    aria-label="Enter address"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
