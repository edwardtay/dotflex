import { useState } from 'react'
import { ApiPromise } from '@polkadot/api'
import { web3FromAddress } from '@polkadot/extension-dapp'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './IdentityRegistrationForm.css'

interface IdentityRegistrationFormProps {
  api: ApiPromise | null
  account: InjectedAccountWithMeta | null
  onSuccess: () => void
  onCancel: () => void
}

interface IdentityFormData {
  display: string
  email: string
  twitter: string
  web: string
  legal: string
  riot: string
}

export default function IdentityRegistrationForm({
  api,
  account,
  onSuccess,
  onCancel
}: IdentityRegistrationFormProps) {
  const [formData, setFormData] = useState<IdentityFormData>({
    display: '',
    email: '',
    twitter: '',
    web: '',
    legal: '',
    riot: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txStatus, setTxStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleInputChange = (field: keyof IdentityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const buildIdentityInfo = () => {
    const info: Record<string, { raw: string } | { none: null }> = {}

    if (formData.display.trim()) {
      info.display = { raw: formData.display.trim() }
    } else {
      info.display = { none: null }
    }

    if (formData.email.trim()) {
      info.email = { raw: formData.email.trim() }
    } else {
      info.email = { none: null }
    }

    if (formData.twitter.trim()) {
      info.twitter = { raw: formData.twitter.trim() }
    } else {
      info.twitter = { none: null }
    }

    if (formData.web.trim()) {
      info.web = { raw: formData.web.trim() }
    } else {
      info.web = { none: null }
    }

    if (formData.legal.trim()) {
      info.legal = { raw: formData.legal.trim() }
    } else {
      info.legal = { none: null }
    }

    if (formData.riot.trim()) {
      info.riot = { raw: formData.riot.trim() }
    } else {
      info.riot = { none: null }
    }

    return info
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!api || !account) {
      setError('API or account not available')
      return
    }

    // At least display name should be provided
    if (!formData.display.trim()) {
      setError('Display name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setTxStatus('Preparing transaction...')

      console.log('Building identity info:', formData)
      const identityInfo = buildIdentityInfo()

      // Get the injector for signing
      setTxStatus('Requesting signature from extension...')
      const injector = await web3FromAddress(account.address)

      if (!injector.signer) {
        throw new Error('No signer available from extension')
      }

      // Create the transaction
      setTxStatus('Creating transaction...')
      const tx = api.tx.identity.setIdentity(identityInfo)

      // Estimate fees
      const paymentInfo = await tx.paymentInfo(account.address)
      console.log('Transaction fees:', paymentInfo.partialFee.toString())

      // Sign and send the transaction
      setTxStatus('Waiting for signature...')
      const txHash = await tx.signAndSend(
        account.address,
        { signer: injector.signer },
        ({ status, events }) => {
          console.log('Transaction status:', status.type)

          if (status.isInBlock) {
            setTxStatus('Transaction in block, finalizing...')
            console.log('Transaction included in block:', status.asInBlock.toString())
          }

          if (status.isFinalized) {
            setTxStatus('Transaction finalized!')
            console.log('Transaction finalized in block:', status.asFinalized.toString())

            // Check for errors
            events.forEach(({ event }) => {
              if (api.events.system.ExtrinsicFailed.is(event)) {
                const [error] = event.data
                console.error('Transaction failed:', error.toString())
                throw new Error(`Transaction failed: ${error.toString()}`)
              }
            })

            // Success - reload identity after a short delay
            setTimeout(() => {
              onSuccess()
            }, 1000)
          }
        }
      )

      console.log('Transaction hash:', txHash.toString())
      setTxStatus(`Transaction submitted: ${txHash.toString().substring(0, 16)}...`)

    } catch (err: any) {
      console.error('Failed to register identity:', err)
      setError(err.message || 'Failed to register identity. Please try again.')
      setTxStatus('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="identity-registration-form">
      <h3>Register Identity</h3>
      <p className="form-description">
        Register your on-chain identity. At minimum, a display name is required.
        All fields are optional except display name.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="display">
            Display Name <span className="required">*</span>
          </label>
          <input
            id="display"
            type="text"
            value={formData.display}
            onChange={(e) => handleInputChange('display', e.target.value)}
            placeholder="Your display name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="twitter">Twitter</label>
          <input
            id="twitter"
            type="text"
            value={formData.twitter}
            onChange={(e) => handleInputChange('twitter', e.target.value)}
            placeholder="@yourhandle"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="web">Website</label>
          <input
            id="web"
            type="url"
            value={formData.web}
            onChange={(e) => handleInputChange('web', e.target.value)}
            placeholder="https://yourwebsite.com"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="legal">Legal Name</label>
          <input
            id="legal"
            type="text"
            value={formData.legal}
            onChange={(e) => handleInputChange('legal', e.target.value)}
            placeholder="Legal name"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="riot">Riot/Matrix</label>
          <input
            id="riot"
            type="text"
            value={formData.riot}
            onChange={(e) => handleInputChange('riot', e.target.value)}
            placeholder="@yourname:matrix.org"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {txStatus && (
          <div className="tx-status">
            {txStatus}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.display.trim()}
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Register Identity'}
          </button>
        </div>
      </form>

      <div className="info-box">
        <p><strong>Note:</strong></p>
        <ul>
          <li>Identity registration requires a deposit (varies by network)</li>
          <li>You'll need to sign the transaction in Polkadot.js extension</li>
          <li>Transaction fees will be deducted from your account</li>
          <li>You can update your identity later</li>
        </ul>
      </div>
    </div>
  )
}

