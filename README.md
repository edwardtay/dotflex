# DotFlex

**Polkadot Portfolio Tracker with Gamification**

DotFlex is a portfolio tracker for Polkadot with gamification features. Track your DOT balance, staking info, transaction history, and play fun games!

## Project Overview

DotFlex provides a clean interface to view your Polkadot portfolio with detailed account information, staking status, and transaction history. Built with Subscan API integration for reliable data.

### Key Features

- **Portfolio Tracking**: View DOT balance, staking info, and transaction history
- **Polkadot Network Stats**: Live DOT price, market cap, staking rate, and validator count
- **Flex & Level Up**: Gamification system with XP, levels, and ranks (Shrimp to Whale)
- **Social Sharing**: Share your DOT holdings on Twitter
- **Fun Games**: Coin flip and dice roll games with win streaks
- **Account Insights**: Detailed breakdown of liquid, staked, and locked balances

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Polkadot Integration**: @polkadot/api, @polkadot/extension-dapp
- **Data**: Subscan API, CoinGecko API
- **Blockchain**: Polkadot mainnet

## Project Structure

```
polkadot-copy/
├── frontend/          # React frontend application
├── services/          # Backend services (optional)
├── libs/              # Shared libraries and utilities
└── docs/              # Documentation
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

1. **Connect Wallet**: Use Polkadot.js extension or enter address manually
2. **View Portfolio**: See your DOT balance, staking info, and transaction history
3. **Flex Your DOT**: Level up by flexing your holdings and sharing on Twitter
4. **Play Games**: Try coin flip and dice roll games with win streaks
5. **Track Progress**: Monitor your flex level, XP, and rank (Shrimp to Whale)

## Dependencies

See `package.json` files in respective directories for detailed dependencies.

## Contributing

Please follow the workflow outlined in `workflow.md`.

## License

MIT

## What We Built

- Portfolio tracker for Polkadot with real-time balance and staking data
- Polkadot network stats dashboard (price, market cap, staking rate)
- Gamification system with levels, XP, ranks, and social sharing
- Fun browser-based games (coin flip, dice roll) with streaks
- Clean, responsive UI with Polkadot branding throughout
- Mobile-friendly design

