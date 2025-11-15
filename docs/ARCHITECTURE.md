# Architecture Overview

## System Components

### Frontend (`frontend/`)
- **Technology**: React + TypeScript + Vite
- **Polkadot Integration**: @polkadot/api, @polkadot/extension-dapp
- **State Management**: React hooks + Zustand (for complex state)
- **Routing**: React Router

### Services (`services/`)
- **Technology**: Node.js + Express
- **Purpose**: Backend API for portfolio aggregation and identity verification
- **Port**: 3001 (configurable via PORT env var)

### Libraries (`libs/`)
- **polkadot-utils**: Shared utilities for Polkadot API interactions
- Reusable functions for balance formatting, identity queries, etc.

## Data Flow

1. **Wallet Connection**: User connects via Polkadot.js extension
2. **Identity Management**: Query/register identity via Polkadot identity pallet
3. **Portfolio Aggregation**: 
   - Query balances from connected accounts
   - Aggregate across multiple chains (future: XCM integration)
4. **Credentials**: Verifiable credentials system (W3C standard)

## Privacy Features

- Zero-knowledge proofs for portfolio analytics (planned)
- Selective disclosure of identity attributes
- User-controlled data sharing permissions
- Decentralized storage via IPFS (planned)

## Cross-Chain Support

- Current: Single chain (Polkadot/Westend)
- Future: XCM for cross-chain asset tracking
- Parachain integration via multi-chain queries

## Security Considerations

- All transactions require user signature via Polkadot.js extension
- No private keys stored in application
- Identity data stored on-chain (Polkadot identity pallet)
- Credentials follow W3C Verifiable Credentials standard

