import { useState, useEffect } from 'react'
import { useWallets } from '../hooks/useWallets'
import {
  placeBet,
  getLastResult,
  getPlayerStats,
  getWinProbability,
  formatEtherBalance,
  verifyContract
} from '../utils/evmContractIntegration'
import type { ethers } from 'ethers'
import './PlayView.css'
import './animations.css'

export default function MoonbeamPlayView() {
  const { evm, connectEVM } = useWallets()
  const [isSpinning, setIsSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastWin, setLastWin] = useState<{ amount: string; number: number } | null>(null)
  const [lastResult, setLastResult] = useState<{
    number: number
    won: boolean
    reward: string
  } | null>(null)
  const [playerStats, setPlayerStats] = useState<{
    totalBets: string
    totalWins: string
  } | null>(null)
  const [betNumber, setBetNumber] = useState<number>(1)
  const [betAmount, setBetAmount] = useState<string>('0.001')
  const [balance, setBalance] = useState<string>('0')
  const [winProbability, setWinProbability] = useState<number | null>(null)
  const [contractVerified, setContractVerified] = useState<boolean>(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Load win probability from contract
  const loadWinProbability = async (prov: ethers.Provider) => {
    const prob = await getWinProbability(prov)
    if (prob !== null) {
      setWinProbability(prob)
    }
  }

  // Load player stats
  const loadStats = async (prov: ethers.Provider, addr: string) => {
    const stats = await getPlayerStats(prov, addr)
    if (stats) {
      setPlayerStats(stats)
    }
    
    const result = await getLastResult(prov, addr)
    if (result) {
      setLastResult(result)
    }
  }

  // Sync with global wallet state
  useEffect(() => {
    if (evm.isConnected && evm.provider && evm.address) {
      // Load balance
      setIsLoadingBalance(true)
      evm.provider.getBalance(evm.address).then(bal => {
        setBalance(formatEtherBalance(bal))
      }).finally(() => setIsLoadingBalance(false))
      
      // Verify contract exists
      verifyContract(evm.provider).then(verification => {
        if (!verification.exists) {
          setContractError(verification.error || 'Contract not found at configured address')
          setContractVerified(false)
        } else {
          setContractVerified(true)
          setContractError(null)
        }
      })
      
      // Load stats and win probability
      loadStats(evm.provider, evm.address)
      loadWinProbability(evm.provider)
    }
  }, [evm.isConnected, evm.provider, evm.address])

  // Connect EVM wallet using global hook
  const handleConnect = async () => {
    setError(null)
    setContractError(null)
    setIsConnecting(true)
    
    try {
      await connectEVM()
      // State will be updated via useEffect when evm.isConnected changes
    } catch (err: any) {
      setError(err.message || 'Failed to connect EVM wallet. Please install an EVM wallet extension.')
    } finally {
      setIsConnecting(false)
    }
  }

  // Place bet / spin
  const handleSpin = async () => {
    if (!evm.signer) {
      setError('Please connect EVM wallet first')
      return
    }

    if (betNumber < 1 || betNumber > 100) {
      setError('Bet number must be between 1 and 100')
      return
    }

    setIsSpinning(true)
    setError(null)

    try {
      const result = await placeBet(evm.signer, betNumber, betAmount)
      
      if (result.success && result.txHash) {
        // Wait for block confirmation
        console.log('[MoonbeamPlayView] Transaction submitted, waiting for confirmation...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Reload stats and check result
        if (evm.provider && evm.address) {
          await loadStats(evm.provider, evm.address)
          
          // Update balance
          const bal = await evm.provider.getBalance(evm.address)
          setBalance(formatEtherBalance(bal))
          
          // Check if we won by looking at the last result
          const lastResult = await getLastResult(evm.provider, evm.address)
          if (lastResult) {
            console.log('[MoonbeamPlayView] Last result:', lastResult)
            if (lastResult.won) {
              setLastWin({ amount: lastResult.reward, number: lastResult.number })
              setShowSuccess(true)
              setTimeout(() => setShowSuccess(false), 5000)
            }
            setLastResult(lastResult)
          }
        }
      } else {
        setError(result.error || 'Failed to place bet')
      }
    } catch (err: any) {
      console.error('[MoonbeamPlayView] Spin error:', err)
      let userMessage = err.message || 'Failed to place bet'
      
      // Better error messages
      if (userMessage.includes('insufficient funds')) {
        userMessage = '💰 Insufficient balance. You need more DEV tokens for this bet + gas fees.'
      } else if (userMessage.includes('user rejected') || userMessage.includes('rejected')) {
        userMessage = '🚫 Transaction cancelled. No worries, try again when ready!'
      } else if (userMessage.includes('bank empty')) {
        userMessage = '🏦 Contract needs more funds. Please contact support or try a smaller bet.'
      } else if (userMessage.includes('network')) {
        userMessage = '🌐 Network error. Check your connection and try again.'
      }
      
      setError(userMessage)
    } finally {
      setIsSpinning(false)
    }
  }

  // Win probability - use contract value if available, otherwise default to 1%
  const WIN_PROBABILITY = winProbability !== null ? winProbability : 1
  const WIN_CHANCE_TEXT = winProbability !== null 
    ? `${WIN_PROBABILITY}%` 
    : '1% (estimated)'

  return (
    <div className="play-view">
      <h2>🎰 Spin the Roulette!</h2>
      <p className="description">
        Spin the roulette for a <strong>{WIN_CHANCE_TEXT} chance to win</strong>!
      </p>

      {!evm.isConnected ? (
        <div className="no-wallet">
          <p>Connect EVM wallet to play</p>
          <button onClick={handleConnect} className="participate-button" disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect EVM Wallet'}
          </button>
          <p className="hint">
            Make sure an EVM wallet (like MetaMask) is installed and switch to Moonbase Alpha network
          </p>
        </div>
      ) : (
        <>
          <div className="wallet-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <p style={{ margin: 0 }}>Connected: {evm.address.slice(0, 6)}...{evm.address.slice(-4)}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(evm.address)
                  alert('✓ Address copied!')
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
                title="Copy address"
              >
                📋
              </button>
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Balance: {isLoadingBalance ? '⏳ Loading...' : `${balance} DEV`}
              {!isLoadingBalance && (
                <button
                  onClick={async () => {
                    if (evm.provider && evm.address) {
                      setIsLoadingBalance(true)
                      const bal = await evm.provider.getBalance(evm.address)
                      setBalance(formatEtherBalance(bal))
                      setIsLoadingBalance(false)
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.25rem'
                  }}
                  title="Refresh balance"
                >
                  🔄
                </button>
              )}
            </p>
            {playerStats && (
              <div className="stats">
                <p>Total Bets: {playerStats.totalBets} DEV</p>
                <p>Total Wins: {playerStats.totalWins} DEV</p>
              </div>
            )}
          </div>

          {lastResult && (
            <div className={`result-section ${lastResult.won ? 'won' : 'lost'}`}>
              <h3>Last Result</h3>
              <p>Number: {lastResult.number}</p>
              <p>{lastResult.won ? '🎉 You Won!' : '😔 Better Luck Next Time'}</p>
              {lastResult.won && (
                <p>Reward: {lastResult.reward} DEV</p>
              )}
            </div>
          )}

          {showSuccess && lastWin && (
            <div style={{
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              textAlign: 'center',
              animation: 'bounce 0.5s ease',
              boxShadow: '0 4px 20px rgba(74, 222, 128, 0.4)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>YOU WON!</h3>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                +{lastWin.amount} DEV
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.9)' }}>Number: {lastWin.number}</p>
            </div>
          )}

          <div className="bet-section">
            <h3>Spin the Roulette</h3>
            <p style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
              {WIN_CHANCE_TEXT} chance to win!
            </p>
            
            <div className="bet-inputs">
              <div>
                <label>Number (1-100):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={betNumber}
                  onChange={(e) => setBetNumber(parseInt(e.target.value) || 1)}
                  disabled={isSpinning}
                />
              </div>
              
              <div>
                <label>Amount (DEV):</label>
                <input
                  type="text"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={isSpinning}
                  placeholder="0.001"
                />
              </div>
            </div>

            <div className="spin-container">
              {isSpinning && (
                <div className="roulette-wheel-container">
                  <div className="roulette-wheel" style={{
                    width: '100px',
                    height: '100px',
                    border: '8px solid #e91e63',
                    borderTop: '8px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '1rem auto'
                  }}></div>
                  <p style={{ textAlign: 'center', color: '#e91e63', fontWeight: 'bold' }}>🎲 Rolling...</p>
                </div>
              )}
              <button
                onClick={handleSpin}
                disabled={isSpinning || isLoadingBalance}
                className={`draw-button ${isSpinning ? 'spinning' : ''}`}
                style={{ 
                  fontSize: '18px', 
                  padding: '15px 30px',
                  opacity: (isSpinning || isLoadingBalance) ? 0.6 : 1,
                  cursor: (isSpinning || isLoadingBalance) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSpinning ? '⏳ Spinning...' : '🎰 Spin the Roulette'}
              </button>
              
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <a 
                  href="https://faucet.moonbeam.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '8px',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  💧 Get Free DEV Tokens
                </a>
              </div>
            </div>
          </div>

          {contractError && (
            <div className="error-message">
              <p><strong>Contract Verification Failed:</strong></p>
              <p>{contractError}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                Please verify the contract is deployed at: {(import.meta as any).env?.VITE_MOONBEAM_CONTRACT_ADDRESS || '0x1dc962e5461ba33f5021708d15a9c5945abfa508'}
              </p>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444', 
              padding: '1rem', 
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '0.5rem' }}>Oops!</p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>{error}</p>
                  <button
                    onClick={() => setError(null)}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="contract-info">
            <p>Contract: {(import.meta as any).env?.VITE_MOONBEAM_CONTRACT_ADDRESS || '0x1dc962e5461ba33f5021708d15a9c5945abfa508'}</p>
            <p>Network: Moonbase Alpha</p>
            <p>Status: {contractVerified ? '✓ Verified' : contractError ? '✗ Not Found' : 'Checking...'}</p>
            <a 
              href={`https://moonbase.moonscan.io/address/${(import.meta as any).env?.VITE_MOONBEAM_CONTRACT_ADDRESS || '0x1dc962e5461ba33f5021708d15a9c5945abfa508'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Moonscan
            </a>
          </div>
        </>
      )}
    </div>
  )
}

