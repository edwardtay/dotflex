import { useState, useEffect } from 'react'
import { detectPolkadotWallets, checkWalletInstallation, WALLET_INSTALL_LINKS, type DetectedWallet } from '../utils/walletDetection'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './WalletConnection.css'

interface WalletConnectionProps {
  onAccountsChange: (accounts: InjectedAccountWithMeta[]) => void
  selectedAccounts: InjectedAccountWithMeta[]
}

export default function WalletConnection({ onAccountsChange, selectedAccounts }: WalletConnectionProps) {
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletList, setShowWalletList] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for installed wallets on component mount
  useEffect(() => {
    const { hasWallets, installedWallets } = checkWalletInstallation()
    console.log('[WalletConnection] Installed wallets:', installedWallets)
  }, [])

  const connectWallets = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const wallets = await detectPolkadotWallets()
      setDetectedWallets(wallets)
      
      if (wallets.length === 0) {
        setError('No Polkadot wallets found. Please install a wallet extension.')
        return
      }
      
      // Collect all accounts from all wallets
      const allAccounts = wallets.flatMap(wallet => wallet.accounts)
      onAccountsChange(allAccounts)
      
      console.log('[WalletConnection] Connected wallets:', wallets.map(w => w.displayName))
      console.log('[WalletConnection] Total accounts:', allAccounts.length)
      
    } catch (err: any) {
      console.error('[WalletConnection] Connection failed:', err)
      setError(`Failed to connect: ${err.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const getWalletIcon = (walletName: string): string => {
    const name = walletName.toLowerCase()
    if (name.includes('polkadot')) return '🟣'
    if (name.includes('talisman')) return '🔮'
    if (name.includes('subwallet')) return '🔷'
    if (name.includes('nova')) return '⭐'
    if (name.includes('fearless')) return '🦁'
    if (name.includes('enkrypt')) return '🔐'
    if (name.includes('polkagate')) return '🚪'
    return '👛'
  }

  const totalAccounts = selectedAccounts.length
  const connectedWallets = detectedWallets.filter(w => w.accounts.length > 0)

  return (
    <div className="wallet-connection">
      <div className="wallet-status">
        {totalAccounts > 0 ? (
          <div className="connected-status">
            <div className="status-header">
              <span className="status-icon">✅</span>
              <span className="status-text">
                {totalAccounts} account{totalAccounts !== 1 ? 's' : ''} connected
              </span>
              <button 
                className="wallet-details-btn"
                onClick={() => setShowWalletList(!showWalletList)}
                title="View wallet details"
              >
                {showWalletList ? '▼' : '▶'}
              </button>
            </div>
            
            {showWalletList && (
              <div className="wallet-list">
                {connectedWallets.map((wallet, idx) => (
                  <div key={wallet.name} className="wallet-item">
                    <div className="wallet-header">
                      <span className="wallet-icon">{getWalletIcon(wallet.name)}</span>
                      <span className="wallet-name">{wallet.displayName}</span>
                      <span className="account-count">
                        {wallet.accounts.length} account{wallet.accounts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="wallet-accounts">
                      {wallet.accounts.map((account, accIdx) => (
                        <div key={account.address} className="account-item">
                          <span className="account-name">
                            {account.meta?.name || `Account ${accIdx + 1}`}
                          </span>
                          <span className="account-address">
                            {account.address.slice(0, 8)}...{account.address.slice(-6)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="disconnected-status">
            <span className="status-icon">🔌</span>
            <span className="status-text">No wallets connected</span>
          </div>
        )}
      </div>

      <div className="wallet-actions">
        {totalAccounts === 0 ? (
          <button 
            className="connect-wallet-btn primary"
            onClick={connectWallets}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner">⏳</span>
                Detecting Wallets...
              </>
            ) : (
              <>
                <span>🔗</span>
                Connect Polkadot Wallet
              </>
            )}
          </button>
        ) : (
          <button 
            className="connect-wallet-btn secondary"
            onClick={connectWallets}
            disabled={isConnecting}
          >
            {isConnecting ? 'Refreshing...' : '🔄 Refresh Wallets'}
          </button>
        )}
      </div>

      {error && (
        <div className="wallet-error">
          <p>{error}</p>
          <div className="install-wallets">
            <p><strong>Install a Polkadot wallet:</strong></p>
            <div className="wallet-install-links">
              {Object.entries(WALLET_INSTALL_LINKS).map(([key, url]) => (
                <a 
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="install-link"
                >
                  {getWalletIcon(key)} {key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalAccounts > 0 && (
        <div className="wallet-info">
          <p className="hint">
            💡 Your accounts are ready for portfolio tracking and ZK proof generation
          </p>
        </div>
      )}
    </div>
  )
}