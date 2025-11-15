import './WalletConnect.css'

interface WalletConnectProps {
  onConnect: () => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  return (
    <div className="wallet-connect">
      <h2>Connect Your Wallet</h2>
      <p>Please connect your Polkadot.js extension wallet to continue</p>
      <button onClick={onConnect} className="connect-button">
        Connect Wallet
      </button>
      <div className="instructions">
        <h3>Don't have a wallet?</h3>
        <ol>
          <li>Install <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer">Polkadot.js Extension</a></li>
          <li>Create or import an account</li>
          <li>Refresh this page and click "Connect Wallet"</li>
        </ol>
      </div>
    </div>
  )
}

