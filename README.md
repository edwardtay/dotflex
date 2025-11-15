# Decentralized Identity Portfolio Manager

A user-centric Web3 application that enables users to manage their cross-chain portfolio while maintaining privacy and self-sovereign identity using Polkadot's technology stack.

## Project Overview

The Decentralized Identity Portfolio Manager brings together identity management and portfolio tracking in a privacy-preserving, user-controlled environment. Built on Polkadot's infrastructure, it leverages cross-chain capabilities to aggregate assets across the Polkadot ecosystem while giving users complete control over their identity and financial data.

### Key Features

- **Self-Sovereign Identity**: Manage your identity using Polkadot's identity pallet with full control over your credentials
- **Cross-Chain Portfolio Aggregation**: Track assets across Polkadot, parachains, and external chains
- **Privacy-Preserving Analytics**: Zero-knowledge proofs for portfolio statistics without exposing sensitive data
- **Decentralized Credentials**: Verifiable credentials system for DeFi/KYC verification
- **User-Controlled Data Sharing**: Granular permissions for sharing portfolio and identity data

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Polkadot Integration**: @polkadot/api, @polkadot/extension-dapp
- **Identity**: Polkadot Identity Pallet
- **Cross-Chain**: XCM (Cross-Consensus Message Format)
- **Privacy**: Zero-Knowledge Proofs (zk-SNARKs)
- **Storage**: IPFS for decentralized data storage
- **Blockchain**: Substrate-based runtime

## Project Structure

```
polkadot/
├── frontend/          # React frontend application
├── services/          # Backend services and APIs
├── contracts/         # Smart contracts (if needed)
├── libs/              # Shared libraries and utilities
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Polkadot.js extension browser extension
- Access to Polkadot network (Westend testnet recommended for development)

### Installation

```bash
# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install service dependencies
cd services && npm install && cd ..
```

### Development

```bash
# Start frontend development server
cd frontend && npm run dev

# Start backend services
cd services && npm run dev
```

### Environment Variables

Create `.env` files in `frontend/` and `services/` directories:

```env
# Frontend .env
VITE_POLKADOT_RPC_URL=wss://westend-rpc.polkadot.io
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Services .env
POLKADOT_RPC_URL=wss://westend-rpc.polkadot.io
IPFS_API_URL=https://ipfs.infura.io:5001
```

## Usage

1. **Connect Wallet**: Use Polkadot.js extension to connect your wallet
2. **Set Up Identity**: Register and manage your on-chain identity
3. **Add Accounts**: Connect accounts from different parachains
4. **View Portfolio**: See aggregated portfolio across all connected chains
5. **Manage Credentials**: Create and share verifiable credentials
6. **Privacy Controls**: Configure data sharing permissions

## Dependencies

See `package.json` files in respective directories for detailed dependencies.

## Contributing

Please follow the workflow outlined in `workflow.md`.

## License

MIT

## Hackathon Submission

This project is submitted for the "Build Resilient Apps with Polkadot Cloud" hackathon under the **User-centric Apps** theme.

