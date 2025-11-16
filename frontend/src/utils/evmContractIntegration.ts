/**
 * EVM Contract Integration for Moonbeam Alpha (NativeRoulette)
 * 
 * Integration with Solidity smart contract deployed on Moonbeam Alpha testnet
 */

import { ethers } from 'ethers'

// Contract address on Moonbeam Alpha
const CONTRACT_ADDRESS = import.meta.env.VITE_MOONBEAM_CONTRACT_ADDRESS || '0x1dc962e5461ba33f5021708d15a9c5945abfa508'

// Moonbeam Alpha network configuration
export const MOONBEAM_ALPHA = {
  chainId: 1287, // Moonbase Alpha chain ID
  chainName: 'Moonbase Alpha',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18
  },
  rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
  blockExplorerUrls: ['https://moonbase.moonscan.io']
}

// NativeRoulette ABI
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "uint8", "name": "betType", "type": "uint8"}, {"internalType": "uint8", "name": "pick", "type": "uint8"}],
    "name": "placeBet",
    "outputs": [{"internalType": "uint256", "name": "betId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "betId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "outcome", "type": "uint8"},
      {"indexed": false, "internalType": "int256", "name": "payout", "type": "int256"}
    ],
    "name": "BetSettled",
    "type": "event"
  }
]

/**
 * Get provider for Moonbeam Alpha
 */
export function getMoonbeamProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(MOONBEAM_ALPHA.rpcUrls[0])
}

/**
 * Get contract instance
 */
export function getContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider)
}

/**
 * Verify contract exists
 */
export async function verifyContract(
  provider: ethers.Provider
): Promise<{ exists: boolean; error?: string }> {
  try {
    const code = await provider.getCode(CONTRACT_ADDRESS)
    const exists = code !== '0x' && code !== '0x0'
    
    if (!exists) {
      return {
        exists: false,
        error: `No contract found at address ${CONTRACT_ADDRESS}`
      }
    }
    
    return { exists: true }
  } catch (error: any) {
    return {
      exists: false,
      error: error.message || 'Failed to verify contract'
    }
  }
}

/**
 * Connect EVM wallet (MetaMask, Brave Wallet, Coinbase Wallet, etc.)
 */
export async function connectMetaMask(): Promise<{
  provider: ethers.BrowserProvider
  signer: ethers.JsonRpcSigner
  address: string
} | null> {
  try {
    // Check for any EVM wallet provider
    if (!window.ethereum) {
      throw new Error('EVM wallet not installed. Please install MetaMask, Brave Wallet, or another EVM-compatible wallet.')
    }

    const ethereum = (window as any).ethereum
    
    // Detect and prioritize Brave Wallet
    let walletProvider = ethereum
    
    // Check if multiple providers exist (e.g., both Brave and MetaMask installed)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      // Prioritize Brave Wallet if available
      const braveWallet = ethereum.providers.find((p: any) => p.isBraveWallet)
      walletProvider = braveWallet || ethereum.providers[0] || ethereum
      console.log('[EVM] Multiple providers detected, using:', braveWallet ? 'Brave Wallet' : 'First available provider')
    } else if (ethereum.isBraveWallet) {
      walletProvider = ethereum
      console.log('[EVM] Brave Wallet detected')
    } else {
      console.log('[EVM] Using default provider')
    }
    
    // Request account access directly from the wallet provider
    // This is critical for Brave Wallet to show the popup
    console.log('[EVM] Requesting account access...')
    const accounts = await walletProvider.request({ 
      method: 'eth_requestAccounts' 
    })
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet')
    }
    
    console.log('[EVM] Account access granted:', accounts[0])
    
    // Create ethers provider after accounts are approved
    const ethersProvider = new ethers.BrowserProvider(walletProvider)
    
    // Get signer
    const signer = await ethersProvider.getSigner()
    const address = await signer.getAddress()

    // Check if connected to Moonbeam Alpha
    const network = await ethersProvider.getNetwork()
    console.log('[EVM] Current network chainId:', network.chainId.toString())
    
    if (network.chainId !== BigInt(MOONBEAM_ALPHA.chainId)) {
      console.log('[EVM] Switching to Moonbeam Alpha...')
      // Try to switch network
      try {
        await walletProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${MOONBEAM_ALPHA.chainId.toString(16)}` }]
        })
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log('[EVM] Adding Moonbeam Alpha network...')
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [MOONBEAM_ALPHA]
          })
        } else {
          throw switchError
        }
      }
    }

    return { provider: ethersProvider, signer, address }
  } catch (error: any) {
    console.error('[EVM] Failed to connect EVM wallet:', error)
    // Re-throw with more context for better error messages
    if (error.code === 4001) {
      throw new Error('User rejected the connection request')
    } else if (error.code === -32002) {
      throw new Error('Connection request already pending. Please check your wallet.')
    }
    throw error
  }
}

/**
 * Check if contract exists at address
 */
async function checkContractExists(provider: ethers.Provider, address: string): Promise<boolean> {
  try {
    const code = await provider.getCode(address)
    return code !== '0x' && code !== '0x0'
  } catch (error) {
    console.error('[EVM] Failed to check contract existence:', error)
    return false
  }
}

/**
 * Decode revert reason from error data
 */
function decodeRevertReason(error: any): string | null {
  if (!error) return null
  
  // Check if error has data property
  const errorData = error.data || error.error?.data || error.reason
  
  if (!errorData) {
    // Try to extract from error message
    if (error.message) {
      // Look for revert reason in message
      const revertMatch = error.message.match(/revert\s+(.+)/i)
      if (revertMatch) {
        return revertMatch[1]
      }
      // Look for custom error in message
      const customErrorMatch = error.message.match(/execution reverted:\s*(.+)/i)
      if (customErrorMatch) {
        return customErrorMatch[1]
      }
    }
    return null
  }
  
  try {
    // Handle string data directly
    if (typeof errorData === 'string') {
      // Try to decode as Error(string)
      const errorSelector = '0x08c379a0' // Error(string) selector
      if (errorData.startsWith(errorSelector) || errorData.length > 10) {
        try {
          const iface = new ethers.Interface(['error Error(string)'])
          const decoded = iface.decodeErrorResult('Error', errorData)
          return decoded[0]
        } catch {
          // Not Error(string), try Panic
        }
      }
      
      // Try to decode as Panic(uint256)
      const panicSelector = '0x4e487b71' // Panic(uint256) selector
      if (errorData.startsWith(panicSelector) || errorData.length > 10) {
        try {
          const iface = new ethers.Interface(['error Panic(uint256)'])
          const decoded = iface.decodeErrorResult('Panic', errorData)
          const panicCode = Number(decoded[0])
          const panicMessages: Record<number, string> = {
            0x00: 'Generic panic',
            0x01: 'Assertion failed',
            0x11: 'Arithmetic underflow/overflow',
            0x12: 'Division by zero',
            0x21: 'Invalid enum value',
            0x22: 'Storage byte array incorrectly encoded',
            0x31: 'Pop on empty array',
            0x32: 'Array index out of bounds',
            0x41: 'Out of memory',
            0x51: 'Uninitialized function pointer'
          }
          return panicMessages[panicCode] || `Panic code: ${panicCode}`
        } catch {
          // Not Panic either
        }
      }
      
      // Try to decode as custom error (Error(string) with 0x prefix)
      if (errorData.startsWith('0x')) {
        // Try common error formats
        try {
          const iface = new ethers.Interface(['error Error(string)', 'error Panic(uint256)'])
          // Try Error(string) first
          if (errorData.length >= 138) { // 4 bytes selector + 32 bytes offset + 32 bytes length + string data
            try {
              const decoded = iface.decodeErrorResult('Error', errorData)
              return decoded[0]
            } catch {
              try {
                const decoded = iface.decodeErrorResult('Panic', errorData)
                const panicCode = Number(decoded[0])
                const panicMessages: Record<number, string> = {
                  0x00: 'Generic panic',
                  0x01: 'Assertion failed',
                  0x11: 'Arithmetic underflow/overflow',
                  0x12: 'Division by zero',
                  0x21: 'Invalid enum value',
                  0x22: 'Storage byte array incorrectly encoded',
                  0x31: 'Pop on empty array',
                  0x32: 'Array index out of bounds',
                  0x41: 'Out of memory',
                  0x51: 'Uninitialized function pointer'
                }
                return panicMessages[panicCode] || `Panic code: ${panicCode}`
              } catch {
                // Couldn't decode
              }
            }
          }
        } catch {
          // Decoding failed
        }
      }
    }
  } catch (e) {
    console.log('[EVM] Could not decode revert reason:', e)
  }
  
  return null
}

/**
 * Place a bet / spin the wheel
 */
export async function placeBet(
  signer: ethers.Signer,
  number: number,
  amount: string // Amount in DEV (e.g., "0.001")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const provider = signer.provider
    if (!provider) {
      throw new Error('No provider available')
    }

    // Validate inputs
    if (number < 1 || number > 100) {
      throw new Error('Bet number must be between 1 and 100')
    }

    const amountBN = ethers.parseEther(amount)
    if (amountBN <= 0n) {
      throw new Error('Bet amount must be greater than 0')
    }

    // Check balance
    const address = await signer.getAddress()
    const balance = await provider.getBalance(address)
    
    if (balance < amountBN) {
      throw new Error(`Insufficient balance. Need ${amount} DEV, have ${ethers.formatEther(balance)} DEV`)
    }

    // Check if contract exists
    const contractExists = await checkContractExists(provider, CONTRACT_ADDRESS)
    if (!contractExists) {
      console.warn(`[EVM] Contract not found at ${CONTRACT_ADDRESS}, using mock mode`)
      // Mock successful transaction for demo purposes
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      // Simulate random outcome
      const won = Math.random() < 0.01 // 1% chance
      const resultMessage = won 
        ? `🎉 Mock Win! You would have won ${parseFloat(amount) * 2} DEV` 
        : `Mock transaction - Number: ${number}, Result: Lost`
      
      setTimeout(() => {
        alert(`Mock Mode Active\n\n${resultMessage}\n\nMock TX: ${mockTxHash}\n\nNote: Deploy the contract to Moonbeam Alpha for real functionality.`)
      }, 1000)
      
      return {
        success: true,
        txHash: mockTxHash
      }
    }

    const contract = getContract(signer)
    const value = amountBN
    
    // Check contract balance first
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS)
    console.log(`[EVM] Contract balance: ${ethers.formatEther(contractBalance)} DEV`)
    
    if (contractBalance === 0n) {
      throw new Error('Contract has no funds. Cannot accept bets. Please contact the owner to fund the contract.')
    }
    
    // Use automatic gas estimation
    const txOptions = {
      value
    }
    
    console.log(`[EVM] Placing bet: ${amount} DEV`)
    
    // Call placeBet(betType, pick) - BetType.SingleNumber = 0
    console.log(`[EVM] Calling placeBet(0, ${number}) with ${ethers.formatEther(value)} DEV...`)
    
    let tx: ethers.ContractTransactionResponse
    try {
      // Call placeBet(BetType.SingleNumber=0, number) with value
      tx = await contract.placeBet(0, number, txOptions)
      console.log('[EVM] Transaction sent:', tx.hash)
    } catch (error: any) {
      console.error('[EVM] Transaction failed:', error)
      
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user')
      }
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient balance for transaction and gas fees')
      }
      
      // Check for bank empty error
      if (error.message?.includes('bank empty')) {
        throw new Error('Contract has insufficient funds to pay winnings. Please contact the owner to fund the contract.')
      }
      
      throw new Error(`Transaction failed: ${error.message}`)
    }
    
    // Wait for transaction confirmation
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('[EVM] Failed to place bet:', error)
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to place bet'
    
    if (error.code === 'CALL_EXCEPTION') {
      const revertReason = decodeRevertReason(error)
      if (revertReason) {
        errorMessage = `Transaction would revert: ${revertReason}`
      } else {
        errorMessage = 'Transaction would revert. Possible reasons: contract paused, invalid parameters, or insufficient balance.'
      }
    } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient balance. Please ensure you have enough DEV tokens for the bet and gas fees.'
    } else if (error.message?.includes('user rejected') || error.code === 4001) {
      errorMessage = 'Transaction rejected by user'
    } else if (error.message?.includes('revert')) {
      // Already has revert reason in message
      errorMessage = error.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Get last spin result
 */
export async function getLastResult(
  provider: ethers.Provider,
  address: string
): Promise<{
  number: number
  won: boolean
  reward: string
} | null> {
  // Contract settles instantly, check events
  try {
    const contract = getContract(provider)
    const filter = contract.filters.BetSettled(null, address)
    const events = await contract.queryFilter(filter, -100)
    
    if (events.length > 0) {
      const lastEvent = events[events.length - 1]
      const payout = lastEvent.args.payout
      return {
        number: Number(lastEvent.args.outcome),
        won: payout > 0,
        reward: ethers.formatEther(payout > 0 ? payout : 0)
      }
    }
  } catch (error) {
    console.error('[EVM] Failed to get last result:', error)
  }
  return null
}

/**
 * Get player statistics
 */
export async function getPlayerStats(
  provider: ethers.Provider,
  address: string
): Promise<{
  totalBets: string
  totalWins: string
} | null> {
  // Contract doesn't have player stats functions
  return {
    totalBets: '0',
    totalWins: '0'
  }
}

/**
 * Get win probability from contract
 */
export async function getWinProbability(
  provider: ethers.Provider
): Promise<number | null> {
  // Return default 1% since contract functions are not available
  return 1
}

/**
 * Format balance for display
 */
export function formatEtherBalance(balance: bigint): string {
  return ethers.formatEther(balance)
}

/**
 * Parse ether amount
 */
export function parseEther(amount: string): bigint {
  return ethers.parseEther(amount)
}

