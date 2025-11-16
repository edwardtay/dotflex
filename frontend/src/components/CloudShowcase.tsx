import { useState, useEffect } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import './CloudShowcase.css'

interface CloudShowcaseProps {
  api: ApiPromise | null
  accounts: InjectedAccountWithMeta[]
}

export default function CloudShowcase({ api, accounts }: CloudShowcaseProps) {
  const [chainInfo, setChainInfo] = useState<any>(null)
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [blockTime, setBlockTime] = useState<number>(0)
  const [validators, setValidators] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [totalIssuance, setTotalIssuance] = useState<string>('0')
  const [activeEra, setActiveEra] = useState<number>(0)
  const [blockHash, setBlockHash] = useState<string>('')
  const [blockAuthor, setBlockAuthor] = useState<string>('')
  const [recentBlocks, setRecentBlocks] = useState<number[]>([])
  const [accountBalance, setAccountBalance] = useState<string>('0')
  const [accountNonce, setAccountNonce] = useState<number>(0)

  useEffect(() => {
    let unsubscribe: any = null

    const fetchCloudData = async () => {
      try {
        const provider = new WsProvider('wss://rpc.polkadot.io')
        const cloudApi = await ApiPromise.create({ provider })

        // Get chain info
        const [chain, nodeName, nodeVersion] = await Promise.all([
          cloudApi.rpc.system.chain(),
          cloudApi.rpc.system.name(),
          cloudApi.rpc.system.version()
        ])

        setChainInfo({
          chain: chain.toString(),
          nodeName: nodeName.toString(),
          nodeVersion: nodeVersion.toString()
        })

        // Subscribe to new blocks
        unsubscribe = await cloudApi.rpc.chain.subscribeNewHeads(async (header) => {
          const num = header.number.toNumber()
          setBlockNumber(num)
          setBlockHash(header.hash.toHex())
          
          // Get block author
          const blockData = await cloudApi.rpc.chain.getBlock(header.hash)
          const logs = blockData.block.header.digest.logs
          for (const log of logs) {
            if (log.isPreRuntime) {
              const [engine, data] = log.asPreRuntime
              if (engine.toString() === 'BABE') {
                // Extract author from BABE pre-runtime digest
                setBlockAuthor('Validator')
                break
              }
            }
          }
          
          // Track recent blocks
          setRecentBlocks(prev => [num, ...prev.slice(0, 9)])
        })

        // Get validators (active set)
        const validatorsList = await cloudApi.query.session.validators()
        const validatorCount = validatorsList.length
        console.log('[Cloud] Active validators:', validatorCount)
        setValidators(validatorCount)

        // Get block time
        const blockTimeMs = cloudApi.consts.babe?.expectedBlockTime || 
                           cloudApi.consts.timestamp?.minimumPeriod.muln(2) ||
                           6000
        const blockTimeSec = blockTimeMs.toNumber()
        console.log('[Cloud] Block time:', blockTimeSec, 'ms')
        setBlockTime(blockTimeSec)

        // Get total issuance
        const issuance = await cloudApi.query.balances.totalIssuance()
        const decimals = cloudApi.registry.chainDecimals[0] || 10
        const divisor = BigInt(10 ** decimals)
        const totalDOT = (BigInt(issuance.toString()) / divisor).toString()
        console.log('[Cloud] Total issuance:', totalDOT, 'DOT')
        setTotalIssuance(totalDOT)

        // Get active era
        const activeEraInfo = await cloudApi.query.staking.activeEra()
        if (activeEraInfo.isSome) {
          const eraIndex = activeEraInfo.unwrap().index.toNumber()
          console.log('[Cloud] Active era:', eraIndex)
          setActiveEra(eraIndex)
        }

        // Get account data if connected
        if (accounts.length > 0) {
          const accountData = await cloudApi.query.system.account(accounts[0].address)
          const balance = accountData.data.free
          const balanceDOT = (BigInt(balance.toString()) / divisor).toString()
          setAccountBalance(balanceDOT)
          setAccountNonce(accountData.nonce.toNumber())
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch cloud data:', error)
        setIsLoading(false)
      }
    }

    fetchCloudData()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="cloud-showcase">
        <h2>☁️ Polkadot Cloud Showcase</h2>
        <div className="loading">Loading real-time data...</div>
      </div>
    )
  }

  return (
    <div className="cloud-showcase">
      <h2>☁️ Polkadot Cloud Showcase</h2>
      <p className="description">Real-time blockchain data powered by Polkadot Cloud infrastructure</p>

      <div className="cloud-features">
        {/* Real-time Block Updates */}
        <div className="feature-card live">
          <div className="feature-icon">🔴</div>
          <h3>Live Block Updates</h3>
          <div className="feature-value">#{blockNumber.toLocaleString()}</div>
          <div className="feature-details">
            <div><strong>Hash:</strong> {blockHash.slice(0, 10)}...{blockHash.slice(-8)}</div>
            <div><strong>Author:</strong> {blockAuthor || 'Loading...'}</div>
          </div>
        </div>

        {/* Chain Information */}
        <div className="feature-card">
          <div className="feature-icon">⛓️</div>
          <h3>Chain Info</h3>
          <div className="feature-details">
            <div><strong>Chain:</strong> {chainInfo?.chain}</div>
            <div><strong>Node:</strong> {chainInfo?.nodeName}</div>
            <div><strong>Version:</strong> {chainInfo?.nodeVersion}</div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Network Stats</h3>
          <div className="feature-details">
            <div><strong>Active Validators:</strong> {validators.toLocaleString()}</div>
            <div><strong>Block Time:</strong> {blockTime / 1000}s</div>
            <div><strong>Active Era:</strong> {activeEra.toLocaleString()}</div>
            <div><strong>Total DOT:</strong> {parseInt(totalIssuance).toLocaleString()}</div>
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            Source: Polkadot RPC (wss://rpc.polkadot.io)
          </div>
        </div>

        {/* Account Balance (if connected) */}
        {accounts.length > 0 && (
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Your Account</h3>
            <div className="feature-details">
              <div><strong>Address:</strong> {accounts[0].address.slice(0, 8)}...{accounts[0].address.slice(-6)}</div>
              <div><strong>Balance:</strong> {parseFloat(accountBalance).toFixed(4)} DOT</div>
              <div><strong>Nonce:</strong> {accountNonce}</div>
              <div><strong>Status:</strong> <span className="status-live">● Connected</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Blocks Timeline */}
      {recentBlocks.length > 0 && (
        <div className="recent-blocks">
          <h3>📦 Recent Blocks (Live)</h3>
          <div className="blocks-timeline">
            {recentBlocks.map((block, idx) => (
              <div key={block} className="block-item" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="block-number">#{block.toLocaleString()}</div>
                <div className="block-time">{idx === 0 ? 'Just now' : `${idx * 6}s ago`}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Query Section */}
      <div className="interactive-section">
        <h3>🔍 Query Blockchain Data</h3>
        <p>Try querying real-time data from Polkadot Cloud</p>
        <div className="query-buttons">
          <button onClick={async () => {
            if (!chainInfo) return
            const provider = new WsProvider('wss://rpc.polkadot.io')
            const api = await ApiPromise.create({ provider })
            const timestamp = await api.query.timestamp.now()
            alert(`Current Timestamp: ${new Date(timestamp.toNumber()).toLocaleString()}`)
            await api.disconnect()
          }} className="query-btn">
            Get Timestamp
          </button>
          <button onClick={async () => {
            if (!chainInfo) return
            const provider = new WsProvider('wss://rpc.polkadot.io')
            const api = await ApiPromise.create({ provider })
            const hash = await api.rpc.chain.getBlockHash()
            alert(`Latest Block Hash: ${hash.toHex()}`)
            await api.disconnect()
          }} className="query-btn">
            Get Block Hash
          </button>
          <button onClick={async () => {
            if (!chainInfo) return
            const provider = new WsProvider('wss://rpc.polkadot.io')
            const api = await ApiPromise.create({ provider })
            const runtime = await api.runtimeVersion
            alert(`Runtime Version: ${runtime.specVersion.toNumber()}\nTransaction Version: ${runtime.transactionVersion.toNumber()}`)
            await api.disconnect()
          }} className="query-btn">
            Get Runtime Info
          </button>
        </div>
      </div>

      {/* Polkadot Cloud Benefits */}
      <div className="cloud-benefits">
        <h3>🚀 Powered by Polkadot Cloud</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">⚡</div>
            <h4>High Performance</h4>
            <p>Fast RPC endpoints with low latency</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🔒</div>
            <h4>Secure & Reliable</h4>
            <p>Enterprise-grade infrastructure</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🌐</div>
            <h4>Global Network</h4>
            <p>Distributed nodes worldwide</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📡</div>
            <h4>Real-time Data</h4>
            <p>WebSocket subscriptions for live updates</p>
          </div>
        </div>
      </div>

      {/* API Examples */}
      <div className="api-examples">
        <h3>💻 Polkadot Cloud APIs Used</h3>
        <div className="code-examples">
          <div className="code-block">
            <div className="code-title">WebSocket Connection</div>
            <pre><code>{`const provider = new WsProvider('wss://rpc.polkadot.io')
const api = await ApiPromise.create({ provider })`}</code></pre>
          </div>
          <div className="code-block">
            <div className="code-title">Real-time Block Subscription</div>
            <pre><code>{`api.rpc.chain.subscribeNewHeads((header) => {
  console.log('Block #', header.number.toNumber())
})`}</code></pre>
          </div>
          <div className="code-block">
            <div className="code-title">Query Chain Data</div>
            <pre><code>{`const validators = await api.query.session.validators()
const chain = await api.rpc.system.chain()`}</code></pre>
          </div>
        </div>
      </div>
    </div>
  )
}
