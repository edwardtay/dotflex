# Security Policy

## Environment Variables

This application requires the following environment variables:

- `VITE_POLKADOT_RPC_URL` - Polkadot RPC endpoint
- `VITE_SUBSCAN_API_KEY` - Optional Subscan API key for enhanced data
- `VITE_QUICKNODE_URL` - Optional QuickNode endpoint for better reliability

**Never commit `.env` files to the repository.** Use `.env.example` as a template.

## API Keys

- Subscan API keys are free and can be obtained from https://docs.subscan.io/
- QuickNode endpoints can be obtained from https://www.quicknode.com/

## Wallet Security

- This application uses Polkadot.js extension for wallet connections
- Private keys never leave your browser or wallet extension
- Manual address entry is read-only and does not require wallet access
- All blockchain queries are read-only operations

## Data Privacy

- All data is queried directly from public blockchain RPCs
- No user data is stored on any server
- Portfolio data remains in your browser's local storage
- Social sharing is opt-in and user-controlled

## Smart Contract Security

- VRF lottery contract is deployed on Polkadot
- Contract addresses are configurable via environment variables
- Always verify contract addresses before interacting

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.
