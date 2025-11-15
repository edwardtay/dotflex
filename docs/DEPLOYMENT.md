# Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Polkadot.js browser extension
- Access to Polkadot network (Westend testnet for development)

## Local Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd polkadot
npm install
```

2. **Environment Configuration**
```bash
# Copy environment example
cp env.example frontend/.env
cp env.example services/.env

# Edit .env files with your configuration
```

3. **Start Development Servers**
```bash
# From root directory
npm run dev

# Or separately:
cd frontend && npm run dev    # Runs on port 3000
cd services && npm run dev     # Runs on port 3001
```

4. **Access Application**
- Frontend: http://localhost:3000
- Services API: http://localhost:3001

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Build services (if needed)
cd services && npm run build

# The dist/ folder contains production-ready files
```

## Environment Variables

### Frontend (.env)
- `VITE_POLKADOT_RPC_URL`: Polkadot RPC endpoint
- `VITE_IPFS_GATEWAY`: IPFS gateway URL

### Services (.env)
- `PORT`: Server port (default: 3001)
- `POLKADOT_RPC_URL`: Polkadot RPC endpoint
- `IPFS_API_URL`: IPFS API endpoint

## Network Configuration

### Testnet (Recommended for Development)
- RPC: `wss://westend-rpc.polkadot.io`
- Chain: Westend

### Mainnet
- RPC: `wss://rpc.polkadot.io`
- Chain: Polkadot

## Docker Deployment (Future)

```dockerfile
# Dockerfile example (to be created)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Notes

- Never commit .env files
- Use environment-specific RPC endpoints
- Ensure HTTPS in production
- Validate all user inputs
- Rate limit API endpoints

