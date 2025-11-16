export interface ChainEndpoint {
  name: string
  rpcUrl: string
  provider: string // e.g., "Polkadot", "Dwellir", "OnFinality", etc.
}

export interface ChainConfigWithEndpoints {
  chainName: string
  token: string
  decimals: number
  endpoints: ChainEndpoint[]
}

export const CHAINS_WITH_MULTIPLE_ENDPOINTS: ChainConfigWithEndpoints[] = [
  {
    chainName: 'Polkadot',
    token: 'DOT',
    decimals: 10,
    endpoints: [
      { name: 'Polkadot Official', rpcUrl: 'wss://rpc.polkadot.io', provider: 'Polkadot' },
      { name: 'Dwellir', rpcUrl: 'wss://polkadot-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://polkadot.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'RadiumBlock', rpcUrl: 'wss://polkadot.public.curie.radiumblock.co/ws', provider: 'RadiumBlock' },
      { name: 'Automata', rpcUrl: 'wss://1rpc.io/dot', provider: '1RPC' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/polkadot', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Kusama',
    token: 'KSM',
    decimals: 12,
    endpoints: [
      { name: 'Kusama Official', rpcUrl: 'wss://kusama-rpc.polkadot.io', provider: 'Polkadot' },
      { name: 'Dwellir', rpcUrl: 'wss://kusama-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://kusama.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'RadiumBlock', rpcUrl: 'wss://kusama.public.curie.radiumblock.co/ws', provider: 'RadiumBlock' },
      { name: 'Automata', rpcUrl: 'wss://1rpc.io/ksm', provider: '1RPC' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/kusama', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Westend',
    token: 'WND',
    decimals: 12,
    endpoints: [
      { name: 'Westend Official', rpcUrl: 'wss://westend-rpc.polkadot.io', provider: 'Polkadot' },
      { name: 'Dwellir', rpcUrl: 'wss://westend-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://westend.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'RadiumBlock', rpcUrl: 'wss://westend.public.curie.radiumblock.co/ws', provider: 'RadiumBlock' },
    ]
  },
  {
    chainName: 'Astar',
    token: 'ASTR',
    decimals: 18,
    endpoints: [
      { name: 'Astar Official', rpcUrl: 'wss://astar-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://astar.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://astar.public.blastapi.io', provider: 'Blast' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/astar', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Moonbeam',
    token: 'GLMR',
    decimals: 18,
    endpoints: [
      { name: 'Moonbeam Official', rpcUrl: 'wss://wss.api.moonbeam.network', provider: 'Moonbeam' },
      { name: 'OnFinality', rpcUrl: 'wss://moonbeam.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://moonbeam.public.blastapi.io', provider: 'Blast' },
      { name: 'Automata', rpcUrl: 'wss://1rpc.io/glmr', provider: '1RPC' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/moonbeam', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Moonriver',
    token: 'MOVR',
    decimals: 18,
    endpoints: [
      { name: 'Moonriver Official', rpcUrl: 'wss://wss.api.moonriver.moonbeam.network', provider: 'Moonbeam' },
      { name: 'OnFinality', rpcUrl: 'wss://moonriver.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://moonriver.public.blastapi.io', provider: 'Blast' },
      { name: 'Automata', rpcUrl: 'wss://1rpc.io/movr', provider: '1RPC' },
    ]
  },
  {
    chainName: 'Acala',
    token: 'ACA',
    decimals: 12,
    endpoints: [
      { name: 'Acala Official', rpcUrl: 'wss://acala-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://acala-polkadot.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://acala-polkadot.public.blastapi.io', provider: 'Blast' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/acala', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Karura',
    token: 'KAR',
    decimals: 12,
    endpoints: [
      { name: 'Karura Official', rpcUrl: 'wss://karura-rpc.dwellir.com', provider: 'Dwellir' },
      { name: 'OnFinality', rpcUrl: 'wss://karura.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://karura.public.blastapi.io', provider: 'Blast' },
      { name: 'IBP', rpcUrl: 'wss://rpc.ibp.network/karura', provider: 'IBP' },
    ]
  },
  {
    chainName: 'Bifrost',
    token: 'BNC',
    decimals: 12,
    endpoints: [
      { name: 'Bifrost Official', rpcUrl: 'wss://bifrost-rpc.liebi.com/ws', provider: 'Liebi' },
      { name: 'OnFinality', rpcUrl: 'wss://bifrost-polkadot.api.onfinality.io/public-ws', provider: 'OnFinality' },
      { name: 'Blast', rpcUrl: 'wss://bifrost-polkadot.public.blastapi.io', provider: 'Blast' },
    ]
  },
  {
    chainName: 'Polimec',
    token: 'PLMC',
    decimals: 12,
    endpoints: [
      { name: 'Polimec Official', rpcUrl: 'wss://rpc.polimec.org', provider: 'Polimec' },
      { name: 'Dwellir', rpcUrl: 'wss://polimec-rpc.dwellir.com', provider: 'Dwellir' },
    ]
  },
  {
    chainName: 'HydraDX',
    token: 'HDX',
    decimals: 12,
    endpoints: [
      { name: 'HydraDX Official', rpcUrl: 'wss://rpc.hydradx.cloud', provider: 'HydraDX' },
      { name: 'Dwellir', rpcUrl: 'wss://hydradx-rpc.dwellir.com', provider: 'Dwellir' },
    ]
  },
  {
    chainName: 'Centrifuge',
    token: 'CFG',
    decimals: 18,
    endpoints: [
      { name: 'Centrifuge Official', rpcUrl: 'wss://fullnode.centrifuge.io', provider: 'Centrifuge' },
      { name: 'Dwellir', rpcUrl: 'wss://centrifuge-rpc.dwellir.com', provider: 'Dwellir' },
    ]
  },
]

