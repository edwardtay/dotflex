import { useState, useEffect } from 'react'
import { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import IdentityRegistrationForm from './IdentityRegistrationForm'
import './IdentityManager.css'

interface IdentityManagerProps {
  api: ApiPromise | null
  account: InjectedAccountWithMeta | null
  isManualMode?: boolean
}

interface IdentityInfo {
  display?: string
  email?: string
  twitter?: string
  web?: string
  legal?: string
  riot?: string
  hasIdentity: boolean
}

export default function IdentityManager({ api, account, isManualMode = false }: IdentityManagerProps) {
  const [identity, setIdentity] = useState<IdentityInfo>({ hasIdentity: false })
  const [isLoading, setIsLoading] = useState(true)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)

  useEffect(() => {
    if (api && account) {
      loadIdentity()
    }
  }, [api, account])

  const loadIdentity = async () => {
    if (!api || !account) return

    try {
      setIsLoading(true)
      console.log('Loading identity for account:', account.address)
      
      const identityInfo = await api.query.identity.identityOf(account.address)
      
      if (identityInfo.isSome) {
        const identityData = identityInfo.unwrap()
        const info = identityData.info
        
        setIdentity({
          display: info.display.asRaw.toUtf8() || undefined,
          email: info.email.asRaw.toUtf8() || undefined,
          twitter: info.twitter.asRaw.toUtf8() || undefined,
          web: info.web.asRaw.toUtf8() || undefined,
          legal: info.legal.asRaw.toUtf8() || undefined,
          riot: info.riot.asRaw.toUtf8() || undefined,
          hasIdentity: true
        })
        console.log('Identity loaded:', identity)
      } else {
        setIdentity({ hasIdentity: false })
        console.log('No identity found for account')
      }
    } catch (error) {
      console.error('Failed to load identity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false)
    // Reload identity after successful registration
    loadIdentity()
  }

  if (isLoading) {
    return <div className="identity-manager">Loading identity...</div>
  }

  return (
    <div className="identity-manager">
      <h2>Identity Management</h2>
      <div className="account-info">
        <p><strong>Account:</strong> {account?.address}</p>
        <p><strong>Name:</strong> {account?.meta.name || 'Unnamed'}</p>
      </div>

      {isManualMode && (
        <div className="manual-mode-notice">
          <p><strong>Manual Mode:</strong> You're viewing this address in read-only mode. To register or update identity, please connect your wallet.</p>
        </div>
      )}

      {showRegistrationForm ? (
        isManualMode ? (
          <div className="manual-mode-error">
            <h3>Wallet Connection Required</h3>
            <p>To register or update identity, you need to connect your Polkadot.js extension wallet. Manual address entry is read-only.</p>
            <button onClick={() => setShowRegistrationForm(false)} className="back-button">
              Go Back
            </button>
          </div>
        ) : (
          <IdentityRegistrationForm
            api={api}
            account={account}
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistrationForm(false)}
          />
        )
      ) : identity.hasIdentity ? (
        <div className="identity-display">
          <h3>Your Identity</h3>
          <div className="identity-fields">
            {identity.display && (
              <div className="field">
                <label>Display Name:</label>
                <span>{identity.display}</span>
              </div>
            )}
            {identity.email && (
              <div className="field">
                <label>Email:</label>
                <span>{identity.email}</span>
              </div>
            )}
            {identity.twitter && (
              <div className="field">
                <label>Twitter:</label>
                <span>{identity.twitter}</span>
              </div>
            )}
            {identity.web && (
              <div className="field">
                <label>Website:</label>
                <span>{identity.web}</span>
              </div>
            )}
            {identity.legal && (
              <div className="field">
                <label>Legal Name:</label>
                <span>{identity.legal}</span>
              </div>
            )}
            {identity.riot && (
              <div className="field">
                <label>Riot/Matrix:</label>
                <span>{identity.riot}</span>
              </div>
            )}
          </div>
          <div className="identity-actions">
            <button onClick={loadIdentity} className="refresh-button">
              Refresh Identity
            </button>
            {!isManualMode && (
              <button 
                onClick={() => setShowRegistrationForm(true)}
                className="update-button"
              >
                Update Identity
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-identity">
          <h3>No Identity Registered</h3>
          <p>Register an on-chain identity to get started with self-sovereign identity management.</p>
          {!isManualMode && (
            <button 
              onClick={() => setShowRegistrationForm(true)}
              className="register-button"
            >
              Register Identity
            </button>
          )}
          <div className="info-box">
            <p><strong>Note:</strong> Identity registration requires:</p>
            <ul>
              <li>A deposit (varies by network)</li>
              <li>Transaction signing via Polkadot.js extension</li>
              <li>Optional: Judgement from registrars for verified identity</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

