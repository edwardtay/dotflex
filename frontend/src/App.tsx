import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useWallets } from './hooks/useWallets'
import WalletConnect from './components/WalletConnect'
import WalletConnection from './components/WalletConnection'
import PortfolioView from './components/PortfolioView'
import PlayView from './components/PlayView'
import MoonbeamPlayView from './components/MoonbeamPlayView'
import ApiComparison from './components/ApiComparison'
import CloudShowcase from './components/CloudShowcase'
import PolkadotStats from './components/PolkadotStats'
import StakingCalculator from './components/StakingCalculator'
import './App.css'

function AppContent() {
  const location = useLocation()
  const { 
    polkadot, 
    evm, 
    isLoading, 
    connectPolkadot, 
    connectEVM, 
    connectManualPolkadot, 
    disconnectPolkadot, 
    disconnectEVM 
  } = useWallets()
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const walletMenuRef = useRef<HTMLDivElement>(null)



  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false)
      }
    }

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWalletMenu])

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <h2>Loading...</h2>
          <p>Initializing application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="logo-link">
              <svg width="32" height="32" viewBox="0 0 1326 1410" fill="none">
                <ellipse cx="663" cy="147.33" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="663" cy="1262.7" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="663" cy="705" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="180" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="1146" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="180" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="1146" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
              </svg>
              <h1>DotFlex</h1>
            </Link>
          </div>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/portfolio" className={location.pathname === '/portfolio' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Portfolio</Link>
            <Link to="/cloud" className={location.pathname === '/cloud' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Polkadot Cloud</Link>
            <Link to="/play" className={location.pathname === '/play' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>Play</Link>
          </div>
          <div className="nav-wallet">
            {(polkadot.isConnected && !polkadot.isManualMode) ? (
              <div className="wallet-menu-container" ref={walletMenuRef}>
                <button 
                  className="wallet-info-button"
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                >
                  <div className="wallet-status-badges">
                    <span className="wallet-status-badge" title="Polkadot Wallet Connected">P</span>
                  </div>
                  <span className="wallet-menu-arrow">{showWalletMenu ? '▲' : '▼'}</span>
                </button>
                {showWalletMenu && (
                  <div className="wallet-menu">
                    <div className="wallet-status-section">
                      <div className="wallet-status-header">
                        <span className="wallet-type-icon">P</span>
                        <span className="wallet-type-name">Polkadot Wallet</span>
                        <span className="wallet-status-indicator connected">● Connected</span>
                      </div>
                      {polkadot.selectedAccount && (
                        <div className="wallet-menu-item">
                          <span className="wallet-address">{polkadot.selectedAccount.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="wallet-menu-divider"></div>
                    <button 
                      className="wallet-menu-item disconnect-button"
                      onClick={() => {
                        disconnectPolkadot()
                        setShowWalletMenu(false)
                      }}
                    >
                      Disconnect Polkadot Wallet
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={connectPolkadot} className="connect-wallet-button">
                Connect Polkadot Wallet
              </button>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/portfolio" 
              element={
                (polkadot.isConnected || polkadot.isManualMode) && polkadot.accounts.length > 0 ? (
                  <PortfolioView api={polkadot.api} accounts={polkadot.accounts} isManualMode={polkadot.isManualMode} />
                ) : (
                  <WalletConnect 
                    onConnectPolkadot={connectPolkadot}
                    onManualConnect={connectManualPolkadot}
                    polkadotConnected={polkadot.isConnected && !polkadot.isManualMode}
                  />
                )
              } 
            />
            <Route 
              path="/cloud" 
              element={<CloudShowcase api={polkadot.api} accounts={polkadot.accounts} />} 
            />
            <Route 
              path="/play" 
              element={<PlayView api={null} accounts={[]} />} 
            />
            <Route 
              path="/api-comparison" 
              element={<ApiComparison />} 
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>
              <svg width="16" height="16" viewBox="0 0 1326 1410" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <ellipse cx="663" cy="147.33" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="663" cy="1262.7" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="663" cy="705" rx="254" ry="147.33" fill="#E6007A"/>
                <ellipse cx="180" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="1146" cy="426.16" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="180" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
                <ellipse cx="1146" cy="983.84" rx="180" ry="104.16" fill="#E6007A"/>
              </svg>
              Powered by{' '}
              <a href="https://polkadot.com" target="_blank" rel="noopener noreferrer">
                Polkadot
              </a>
            </p>
            <p>
              <span>✨</span> Made by{' '}
              <a href="https://edwardtay.com" target="_blank" rel="noopener noreferrer">
                Edward
              </a>
            </p>
          </div>
        </footer>
      </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

function Home() {
  return (
    <div className="home">
      <div className="home-hero">
        <img src="/flex-hero.svg" alt="Flex Your DOT" className="flex-hero-image" />
      </div>
      <h2>Welcome to DotFlex</h2>
      <p className="home-description">Your Polkadot Portfolio Tracker with Gamification</p>
      <p>Track your DOT balance, staking info, and transaction history. Level up by flexing your holdings and play fun games!</p>
      
      <PolkadotStats />
      <StakingCalculator />
      
      <div className="features">
        <div className="feature-card">
          <h3>📊 Portfolio Tracking</h3>
          <p>View your DOT balance, staking details, and recent transfers. Connect wallet or enter address manually.</p>
        </div>
        <div className="feature-card">
          <h3>💪 Flex & Level Up</h3>
          <p>Earn XP and level up by flexing your DOT holdings. Share achievements on Twitter and climb the ranks!</p>
        </div>
        <div className="feature-card">
          <h3>🎮 Fun Games</h3>
          <p>Play coin flip and dice games with win streaks. No wallet needed - just pure fun!</p>
        </div>
      </div>

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-list">
          <div className="faq-item">
            <h4>What is DotFlex?</h4>
            <p>DotFlex is a Polkadot portfolio tracker with gamification. Track your DOT balance, staking info, and transactions. Level up by flexing your holdings and play fun games!</p>
          </div>
          <div className="faq-item">
            <h4>What can I do with DotFlex?</h4>
            <p>Track your Polkadot portfolio, view staking details and transaction history, flex your DOT to earn XP and level up, share achievements on Twitter, and play fun games like coin flip and dice roll.</p>
          </div>
          <div className="faq-item">
            <h4>How do I connect my wallet?</h4>
            <p>You can connect using the Polkadot Wallet browser extension, or manually enter your address. The app will automatically query all supported chains for your balances.</p>
          </div>
          <div className="faq-item">
            <h4>Do I need a Subscan API key?</h4>
            <p>For best results, yes. Set your Subscan API key in the environment variables. Without it, the app will fall back to direct RPC queries which may be slower and miss some chains.</p>
          </div>
          <div className="faq-item">
            <h4>What is Polkadot?</h4>
            <p>Polkadot is a next-generation blockchain protocol that connects multiple specialized blockchains into one unified network. It enables cross-chain transfers of any type of data or asset, not just tokens, making it possible to create new applications and services.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data private?</h4>
            <p>Yes. DotFlex runs entirely in your browser. Your addresses and balances are only queried locally. We never store or transmit your private data to any server.</p>
          </div>
          <div className="faq-item">
            <h4>Can I use this without a wallet?</h4>
            <p>Yes! You can manually enter any Polkadot address to view its portfolio. No wallet connection required for viewing balances.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

