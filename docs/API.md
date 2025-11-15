# API Documentation

## Frontend API (Polkadot.js)

### usePolkadot Hook

```typescript
const {
  api,              // ApiPromise instance
  accounts,         // Array of InjectedAccountWithMeta
  selectedAccount,  // Currently selected account
  isConnected,      // Boolean connection status
  isLoading,        // Boolean loading state
  connectWallet,    // Function to connect wallet
  setSelectedAccount // Function to change selected account
} = usePolkadot()
```

## Backend API (Express)

### Health Check
```
GET /health
Returns: { status: 'ok', timestamp: string }
```

### Portfolio Aggregation
```
GET /api/portfolio/:address
Returns: {
  address: string,
  balances: Balance[],
  chains: string[],
  totalValue: string
}
```

### Identity Verification
```
POST /api/identity/verify
Body: { address: string, credential: object }
Returns: { verified: boolean, message: string }
```

## Polkadot Chain Queries

### Identity
- `api.query.identity.identityOf(address)` - Get identity info
- `api.tx.identity.setIdentity(info)` - Register/update identity

### System
- `api.query.system.account(address)` - Get account balance
- `api.registry.chainDecimals[0]` - Get chain decimals

