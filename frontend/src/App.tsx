import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { usePolkadot } from './hooks/usePolkadot'
import WalletConnect from './components/WalletConnect'
import IdentityManager from './components/IdentityManager'
import PortfolioView from './components/PortfolioView'
import CredentialsManager from './components/CredentialsManager'
import './App.css'

function App() {
  const { api, accounts, selectedAccount, isConnected, isLoading, isManualMode, connectWallet, connectManualAddress } = usePolkadot()

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <h2>Loading...</h2>
          <p>Connecting to Polkadot network...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="logo-link">
              <h1>PolkaPocket</h1>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/identity">Identity</Link>
            <Link to="/portfolio">Portfolio</Link>
            <Link to="/credentials">Credentials</Link>
          </div>
          <div className="nav-wallet">
            {isConnected ? (
              <div className="wallet-info">
                <span>{selectedAccount?.meta.name || selectedAccount?.address.substring(0, 12) + '...'}</span>
              </div>
            ) : (
              <button onClick={connectWallet}>Connect Wallet</button>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/identity" 
              element={
                isConnected ? (
                  <IdentityManager api={api} account={selectedAccount} isManualMode={isManualMode} />
                ) : (
                  <WalletConnect onConnect={connectWallet} onManualConnect={connectManualAddress} />
                )
              } 
            />
            <Route 
              path="/portfolio" 
              element={
                isConnected ? (
                  <PortfolioView api={api} accounts={accounts} />
                ) : (
                  <WalletConnect onConnect={connectWallet} onManualConnect={connectManualAddress} />
                )
              } 
            />
            <Route 
              path="/credentials" 
              element={
                isConnected ? (
                  <CredentialsManager api={api} account={selectedAccount} />
                ) : (
                  <WalletConnect onConnect={connectWallet} onManualConnect={connectManualAddress} />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Home() {
  return (
    <div className="home">
      <h2>Welcome to PolkaPocket</h2>
      <p>Manage your identity and portfolio across the Polkadot ecosystem</p>
      <div className="features">
        <div className="feature-card">
          <h3>Self-Sovereign Identity</h3>
          <p>Control your identity with Polkadot's identity pallet</p>
        </div>
        <div className="feature-card">
          <h3>Cross-Chain Portfolio</h3>
          <p>Track assets across Polkadot and parachains</p>
        </div>
        <div className="feature-card">
          <h3>Privacy-Preserving</h3>
          <p>Zero-knowledge proofs for secure analytics</p>
        </div>
        <div className="feature-card">
          <h3>Decentralized Credentials</h3>
          <p>Verifiable credentials for DeFi and KYC</p>
        </div>
      </div>
    </div>
  )
}

export default App

