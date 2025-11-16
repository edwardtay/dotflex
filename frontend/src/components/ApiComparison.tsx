import React, { useState, useEffect, useCallback } from 'react'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { CHAINS_WITH_MULTIPLE_ENDPOINTS } from '../config/chainsWithMultipleEndpoints'
import './ApiComparison.css'

interface TestResult {
  chainName: string
  endpointName: string
  rpcUrl: string
  provider: string
  status: 'testing' | 'success' | 'failed' | 'not_tested'
  connectionTime?: number
  balance?: {
    free: string
    reserved: string
    total: string
    token: string
  }
  error?: string
  decimals: number
}

const DEFAULT_TEST_ADDRESS = '5F5522o328T8MNsjDBTWXjfJvtdQsnUne2wjGvwLC4dLdmBC'

export default function ApiComparison() {
  const [testAddress, setTestAddress] = useState(DEFAULT_TEST_ADDRESS)
  const [results, setResults] = useState<TestResult[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [testProgress, setTestProgress] = useState({ current: 0, total: 0 })

  const initializeResults = useCallback(() => {
    const initialResults: TestResult[] = []
    CHAINS_WITH_MULTIPLE_ENDPOINTS.forEach(chain => {
      chain.endpoints.forEach(endpoint => {
        initialResults.push({
          chainName: chain.chainName,
          endpointName: endpoint.name,
          rpcUrl: endpoint.rpcUrl,
          provider: endpoint.provider,
          status: 'not_tested',
          decimals: chain.decimals
        })
      })
    })
    setResults(initialResults)
  }, [])

  useEffect(() => {
    initializeResults()
  }, [initializeResults])

  const testEndpoint = useCallback(async (result: TestResult, address: string): Promise<TestResult> => {
    const startTime = Date.now()
    let api: ApiPromise | null = null

    try {
      console.log(`[API Test] Testing ${result.chainName} - ${result.endpointName} (${result.rpcUrl})`)
      
      const provider = new WsProvider(result.rpcUrl, 5000)
      api = await Promise.race([
        ApiPromise.create({ provider }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 20000)
        )
      ])

      await api.isReady
      const connectionTime = Date.now() - startTime

      // Try to get balance
      try {
        const accountData = await Promise.race([
          api.query.system.account(address),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 10000)
          )
        ]) as any

        if (accountData && accountData.data) {
          const balance = accountData.data
          const free = balance.free.toString()
          const reserved = balance.reserved.toString()
          const total = balance.free.add(balance.reserved).toString()

          const divisor = BigInt(10 ** result.decimals)
          const formatBalance = (value: bigint): string => {
            const wholePart = value / divisor
            const fractionalPart = value % divisor
            const fractionalStr = fractionalPart.toString().padStart(result.decimals, '0').replace(/0+$/, '')
            return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString()
          }

          const balanceResult = {
            free: formatBalance(BigInt(free)),
            reserved: formatBalance(BigInt(reserved)),
            total: formatBalance(BigInt(total)),
            token: CHAINS_WITH_MULTIPLE_ENDPOINTS.find(c => c.chainName === result.chainName)?.token || ''
          }

          await api.disconnect()
          return {
            ...result,
            status: 'success',
            connectionTime,
            balance: balanceResult
          }
        } else {
          await api.disconnect()
          return {
            ...result,
            status: 'success',
            connectionTime,
            error: 'No balance data returned'
          }
        }
      } catch (queryError: any) {
        await api.disconnect()
        return {
          ...result,
          status: 'success',
          connectionTime,
          error: `Query failed: ${queryError.message || String(queryError)}`
        }
      }
    } catch (error: any) {
      if (api) {
        try {
          await api.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      const errorMsg = error.message || String(error)
      console.error(`[API Test] Failed ${result.chainName} - ${result.endpointName}:`, errorMsg)
      return {
        ...result,
        status: 'failed',
        error: errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg
      }
    }
  }, [])

  const runAllTests = async () => {
    if (!testAddress || testAddress.trim().length === 0) {
      alert('Please enter a valid address')
      return
    }

    setIsTesting(true)
    setTestProgress({ current: 0, total: results.length })

    const updatedResults = [...results]
    
    for (let i = 0; i < updatedResults.length; i++) {
      updatedResults[i] = { ...updatedResults[i], status: 'testing' }
      setResults([...updatedResults])
      setTestProgress({ current: i + 1, total: results.length })

      const testResult = await testEndpoint(updatedResults[i], testAddress)
      updatedResults[i] = testResult
      setResults([...updatedResults])

      // Small delay between tests to avoid overwhelming endpoints
      if (i < updatedResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsTesting(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✓'
      case 'failed':
        return '✗'
      case 'testing':
        return '⋯'
      default:
        return '○'
    }
  }

  const getStatusClass = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'status-success'
      case 'failed':
        return 'status-failed'
      case 'testing':
        return 'status-testing'
      default:
        return 'status-not-tested'
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.chainName]) {
      acc[result.chainName] = []
    }
    acc[result.chainName].push(result)
    return acc
  }, {} as Record<string, TestResult[]>)

  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const notTestedCount = results.filter(r => r.status === 'not_tested').length

  return (
    <div className="api-comparison">
      <h2>API Endpoint Comparison</h2>
      <div className="comparison-header">
        <div className="test-info">
          <div className="address-input-group">
            <label htmlFor="test-address"><strong>Test Address:</strong></label>
            <input
              id="test-address"
              type="text"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Enter Polkadot address"
              disabled={isTesting}
              className="address-input"
            />
          </div>
          <p><strong>Total Endpoints:</strong> {results.length}</p>
        </div>
        <div className="test-stats">
          <div className="stat-item success">
            <span className="stat-label">Success:</span>
            <span className="stat-value">{successCount}</span>
          </div>
          <div className="stat-item failed">
            <span className="stat-label">Failed:</span>
            <span className="stat-value">{failedCount}</span>
          </div>
          <div className="stat-item not-tested">
            <span className="stat-label">Not Tested:</span>
            <span className="stat-value">{notTestedCount}</span>
          </div>
        </div>
        <div className="test-controls">
          <button 
            onClick={runAllTests} 
            disabled={isTesting}
            className="test-button"
          >
            {isTesting ? `Testing... (${testProgress.current}/${testProgress.total})` : 'Run All Tests'}
          </button>
          <button 
            onClick={initializeResults} 
            disabled={isTesting}
            className="reset-button"
          >
            Reset
          </button>
        </div>
      </div>

      {isTesting && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
          />
        </div>
      )}

      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Endpoint Name</th>
              <th>Provider</th>
              <th>RPC URL</th>
              <th>Status</th>
              <th>Connection Time</th>
              <th>Balance</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedResults).map(([chainName, chainResults]) => (
              <React.Fragment key={chainName}>
                {chainResults.map((result, index) => (
                  <tr key={`${chainName}-${index}`} className={getStatusClass(result.status)}>
                    {index === 0 && (
                      <td rowSpan={chainResults.length} className="chain-name-cell">
                        <strong>{chainName}</strong>
                      </td>
                    )}
                    <td>{result.endpointName}</td>
                    <td>{result.provider}</td>
                    <td className="rpc-url-cell">
                      <code>{result.rpcUrl}</code>
                    </td>
                    <td className="status-cell">
                      <span className={`status-indicator ${getStatusClass(result.status)}`}>
                        {getStatusIcon(result.status)}
                      </span>
                      <span>{result.status}</span>
                    </td>
                    <td>
                      {result.connectionTime !== undefined 
                        ? `${result.connectionTime}ms` 
                        : '-'}
                    </td>
                    <td className="balance-cell">
                      {result.balance 
                        ? `${result.balance.total} ${result.balance.token}`
                        : result.status === 'success' && result.error
                        ? 'N/A'
                        : '-'}
                    </td>
                    <td className="error-cell">
                      {result.error ? (
                        <span title={result.error}>{result.error}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          {Object.entries(groupedResults).map(([chainName, chainResults]) => {
            const chainSuccess = chainResults.filter(r => r.status === 'success').length
            const chainFailed = chainResults.filter(r => r.status === 'failed').length
            const bestEndpoint = chainResults
              .filter(r => r.status === 'success' && r.connectionTime !== undefined)
              .sort((a, b) => (a.connectionTime || Infinity) - (b.connectionTime || Infinity))[0]

            return (
              <div key={chainName} className="summary-card">
                <h4>{chainName}</h4>
                <p><strong>Working:</strong> {chainSuccess}/{chainResults.length}</p>
                <p><strong>Failed:</strong> {chainFailed}</p>
                {bestEndpoint && (
                  <p className="best-endpoint">
                    <strong>Fastest:</strong> {bestEndpoint.endpointName} ({bestEndpoint.connectionTime}ms)
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

