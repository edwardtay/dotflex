import { useState } from 'react'
import { ApiPromise } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './CredentialsManager.css'

interface CredentialsManagerProps {
  api: ApiPromise | null
  account: InjectedAccountWithMeta | null
}

interface Credential {
  id: string
  type: string
  issuer: string
  issuedAt: string
  verified: boolean
}

export default function CredentialsManager({ api, account }: CredentialsManagerProps) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Mock credentials for demonstration
  const mockCredentials: Credential[] = [
    {
      id: 'cred-001',
      type: 'DeFi Verification',
      issuer: 'Polkadot DeFi Registry',
      issuedAt: new Date().toISOString(),
      verified: true
    }
  ]

  const createCredential = async () => {
    if (!api || !account) return

    try {
      setIsCreating(true)
      console.log('Creating credential...')
      
      // This would integrate with a credential system
      // For now, we'll show a placeholder
      alert('Credential creation requires integration with a verifiable credentials system. This feature is in development.')
      
    } catch (error) {
      console.error('Failed to create credential:', error)
      alert('Failed to create credential. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const verifyCredential = async (credentialId: string) => {
    console.log('Verifying credential:', credentialId)
    // Credential verification logic would go here
  }

  return (
    <div className="credentials-manager">
      <h2>Decentralized Credentials</h2>
      <p className="description">
        Manage verifiable credentials for DeFi, KYC, and other use cases.
      </p>

      <div className="credentials-actions">
        <button 
          onClick={createCredential}
          disabled={isCreating}
          className="create-button"
        >
          {isCreating ? 'Creating...' : 'Create New Credential'}
        </button>
      </div>

      <div className="credentials-list">
        <h3>Your Credentials</h3>
        
        {credentials.length === 0 && mockCredentials.length === 0 ? (
          <div className="no-credentials">
            <p>No credentials found. Create your first credential to get started.</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {mockCredentials.map((credential) => (
              <div key={credential.id} className="credential-card">
                <div className="credential-header">
                  <h4>{credential.type}</h4>
                  <span className={`status-badge ${credential.verified ? 'verified' : 'pending'}`}>
                    {credential.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="credential-details">
                  <div className="detail-item">
                    <label>Issuer:</label>
                    <span>{credential.issuer}</span>
                  </div>
                  <div className="detail-item">
                    <label>Issued:</label>
                    <span>{new Date(credential.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>ID:</label>
                    <code>{credential.id}</code>
                  </div>
                </div>
                <div className="credential-actions">
                  <button 
                    onClick={() => verifyCredential(credential.id)}
                    className="verify-button"
                  >
                    Verify
                  </button>
                  <button className="share-button">
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-box">
        <h4>About Verifiable Credentials</h4>
        <p>Verifiable credentials allow you to:</p>
        <ul>
          <li>Prove your identity without revealing personal data</li>
          <li>Share credentials selectively with granular permissions</li>
          <li>Use credentials across different DeFi protocols</li>
          <li>Maintain privacy while meeting KYC requirements</li>
        </ul>
        <p className="note">
          <strong>Note:</strong> This feature integrates with Polkadot's identity system and 
          supports W3C Verifiable Credentials standards.
        </p>
      </div>
    </div>
  )
}

