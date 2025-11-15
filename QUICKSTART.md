# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
cd services && npm install && cd ..
```

### Step 2: Set Up Environment

```bash
# Copy environment template
cp env.example frontend/.env
cp env.example services/.env
```

Edit `frontend/.env`:
```env
VITE_POLKADOT_RPC_URL=wss://westend-rpc.polkadot.io
```

### Step 3: Install Polkadot.js Extension

1. Install [Polkadot.js Extension](https://polkadot.js.org/extension/)
2. Create or import an account
3. Make sure you're on Westend testnet

### Step 4: Run the Application

```bash
# From root directory
npm run dev
```

Or run separately:
```bash
# Terminal 1: Frontend (port 3000)
cd frontend && npm run dev

# Terminal 2: Services (port 3001)
cd services && npm run dev
```

### Step 5: Open Browser

Navigate to: http://localhost:3000

### Step 6: Connect Wallet

1. Click "Connect Wallet" button
2. Select your account in Polkadot.js extension
3. Authorize the connection

## ✅ What You Can Do Now

- **View Identity**: Check if your account has an on-chain identity
- **View Portfolio**: See your account balances
- **Manage Credentials**: Explore credential management (foundation)

## 🔧 Troubleshooting

### Wallet Not Connecting
- Ensure Polkadot.js extension is installed and unlocked
- Check that you have accounts created
- Refresh the page and try again

### API Connection Issues
- Verify RPC URL in `.env` file
- Check network connectivity
- Try switching to different RPC endpoint

### Build Errors
- Ensure Node.js 18+ is installed
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version compatibility

## 📚 Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
- Review [API.md](./docs/API.md) for API details

