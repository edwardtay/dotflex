import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Portfolio aggregation endpoint (placeholder)
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params
    console.log('Fetching portfolio for address:', address)
    
    // TODO: Implement cross-chain portfolio aggregation
    res.json({
      address,
      balances: [],
      chains: [],
      totalValue: '0'
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    res.status(500).json({ error: 'Failed to fetch portfolio' })
  }
})

// Identity verification endpoint (placeholder)
app.post('/api/identity/verify', async (req, res) => {
  try {
    const { address, credential } = req.body
    console.log('Verifying identity for address:', address)
    
    // TODO: Implement identity verification
    res.json({
      verified: false,
      message: 'Identity verification not yet implemented'
    })
  } catch (error) {
    console.error('Error verifying identity:', error)
    res.status(500).json({ error: 'Failed to verify identity' })
  }
})

app.listen(PORT, () => {
  console.log(`Services running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

