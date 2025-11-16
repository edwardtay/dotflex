/**
 * Comprehensive list of all Substrate chains supported by Subscan
 * This includes Polkadot ecosystem, Kusama ecosystem, and standalone Substrate chains
 */

export interface SubscanChainInfo {
  name: string
  apiUrl: string
  token: string
  decimals: number
  rpcUrl?: string
}

/**
 * Complete list of all Substrate chains supported by Subscan API
 * Based on Subscan's supported networks (80+ chains)
 */
export const ALL_SUBSCAN_CHAINS: SubscanChainInfo[] = [
  // Polkadot Ecosystem
  { name: 'Polkadot', apiUrl: 'https://polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'Kusama', apiUrl: 'https://kusama.api.subscan.io', token: 'KSM', decimals: 12 },
  { name: 'Westend', apiUrl: 'https://westend.api.subscan.io', token: 'WND', decimals: 12 },
  { name: 'Paseo', apiUrl: 'https://paseo.api.subscan.io', token: 'PAS', decimals: 10 },
  
  // Polkadot System Parachains
  { name: 'AssetHub Polkadot', apiUrl: 'https://assethub-polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'BridgeHub Polkadot', apiUrl: 'https://bridgehub-polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'Coretime Polkadot', apiUrl: 'https://coretime-polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'Collectives Polkadot', apiUrl: 'https://collectives-polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'People Polkadot', apiUrl: 'https://people-polkadot.api.subscan.io', token: 'DOT', decimals: 10 },
  
  // Polkadot Parachains
  { name: 'Acala', apiUrl: 'https://acala.api.subscan.io', token: 'ACA', decimals: 12 },
  { name: 'Astar', apiUrl: 'https://astar.api.subscan.io', token: 'ASTR', decimals: 18 },
  { name: 'Moonbeam', apiUrl: 'https://moonbeam.api.subscan.io', token: 'GLMR', decimals: 18 },
  { name: 'Moonriver', apiUrl: 'https://moonriver.api.subscan.io', token: 'MOVR', decimals: 18 },
  { name: 'Parallel', apiUrl: 'https://parallel.api.subscan.io', token: 'PARA', decimals: 12 },
  { name: 'Interlay', apiUrl: 'https://interlay.api.subscan.io', token: 'INTR', decimals: 10 },
  { name: 'Phala', apiUrl: 'https://phala.api.subscan.io', token: 'PHA', decimals: 12 },
  { name: 'Unique', apiUrl: 'https://unique.api.subscan.io', token: 'UNQ', decimals: 18 },
  { name: 'Litentry', apiUrl: 'https://litentry.api.subscan.io', token: 'LIT', decimals: 12 },
  { name: 'Composable', apiUrl: 'https://composable.api.subscan.io', token: 'LAYR', decimals: 12 },
  { name: 'Centrifuge', apiUrl: 'https://centrifuge.api.subscan.io', token: 'CFG', decimals: 18 },
  { name: 'HydraDX', apiUrl: 'https://hydradx.api.subscan.io', token: 'HDX', decimals: 12 },
  { name: 'Bifrost', apiUrl: 'https://bifrost.api.subscan.io', token: 'BNC', decimals: 12 },
  { name: 'Manta', apiUrl: 'https://manta.api.subscan.io', token: 'MANTA', decimals: 18 },
  { name: 'Manta Atlantic', apiUrl: 'https://manta-atlantic.api.subscan.io', token: 'MANTA', decimals: 18 },
  { name: 'Avail', apiUrl: 'https://avail.api.subscan.io', token: 'AVAIL', decimals: 18 },
  { name: 'Statemint', apiUrl: 'https://statemint.api.subscan.io', token: 'DOT', decimals: 10 },
  { name: 'Energy Web X', apiUrl: 'https://energyweb.api.subscan.io', token: 'EWT', decimals: 18 },
  { name: 'Heima', apiUrl: 'https://heima.api.subscan.io', token: 'HEI', decimals: 12 },
  { name: 'Hydration', apiUrl: 'https://hydration.api.subscan.io', token: 'HYD', decimals: 12 },
  { name: 'Mythos', apiUrl: 'https://mythos.api.subscan.io', token: 'MYTH', decimals: 12 },
  
  // Kusama Parachains
  { name: 'Karura', apiUrl: 'https://karura.api.subscan.io', token: 'KAR', decimals: 12 },
  { name: 'Shiden', apiUrl: 'https://shiden.api.subscan.io', token: 'SDN', decimals: 18 },
  { name: 'Bifrost Kusama', apiUrl: 'https://bifrost-kusama.api.subscan.io', token: 'BNC', decimals: 12 },
  { name: 'Khala', apiUrl: 'https://khala.api.subscan.io', token: 'PHA', decimals: 12 },
  { name: 'Quartz', apiUrl: 'https://quartz.api.subscan.io', token: 'QTZ', decimals: 18 },
  { name: 'Calamari', apiUrl: 'https://calamari.api.subscan.io', token: 'KMA', decimals: 12 },
  { name: 'Basilisk', apiUrl: 'https://basilisk.api.subscan.io', token: 'BSX', decimals: 12 },
  { name: 'Altair', apiUrl: 'https://altair.api.subscan.io', token: 'AIR', decimals: 18 },
  { name: 'Heiko', apiUrl: 'https://heiko.api.subscan.io', token: 'HKO', decimals: 12 },
  { name: 'Kintsugi', apiUrl: 'https://kintsugi.api.subscan.io', token: 'KINT', decimals: 12 },
  { name: 'Picasso', apiUrl: 'https://picasso.api.subscan.io', token: 'PICA', decimals: 12 },
  { name: 'Crust', apiUrl: 'https://crust.api.subscan.io', token: 'CRU', decimals: 12 },
  { name: 'Robonomics', apiUrl: 'https://robonomics.api.subscan.io', token: 'XRT', decimals: 9 },
  { name: 'Statemine', apiUrl: 'https://statemine.api.subscan.io', token: 'KSM', decimals: 12 },
  
  // Standalone Substrate Chains
  { name: 'Sora', apiUrl: 'https://sora.api.subscan.io', token: 'XOR', decimals: 18 },
  { name: 'Efinity', apiUrl: 'https://efinity.api.subscan.io', token: 'EFI', decimals: 18 },
  { name: 'Nodle', apiUrl: 'https://nodle.api.subscan.io', token: 'NODL', decimals: 11 },
  { name: 'Zeitgeist', apiUrl: 'https://zeitgeist.api.subscan.io', token: 'ZTG', decimals: 10 },
  { name: 'Polimec', apiUrl: 'https://polimec.api.subscan.io', token: 'PLMC', decimals: 10 },
  { name: 'Ternoa', apiUrl: 'https://ternoa.api.subscan.io', token: 'CAPS', decimals: 18 },
  { name: 'Aventus', apiUrl: 'https://aventus.api.subscan.io', token: 'AVT', decimals: 18 },
  { name: 'Encointer', apiUrl: 'https://encointer.api.subscan.io', token: 'KSM', decimals: 12 },
  { name: 'KILT', apiUrl: 'https://spiritnet.api.subscan.io', token: 'KILT', decimals: 15 },
  { name: 'KILT Spiritnet', apiUrl: 'https://spiritnet.api.subscan.io', token: 'KILT', decimals: 15 },
  { name: 'KILT Peregrine', apiUrl: 'https://peregrine.api.subscan.io', token: 'KILT', decimals: 15 },
  { name: 'Subsocial', apiUrl: 'https://subsocial.api.subscan.io', token: 'SUB', decimals: 11 },
  { name: 'Subsocial Soonsocial', apiUrl: 'https://soonsocial.api.subscan.io', token: 'SUB', decimals: 11 },
  { name: 'ChainX', apiUrl: 'https://chainx.api.subscan.io', token: 'PCX', decimals: 8 },
  { name: 'Darwinia', apiUrl: 'https://darwinia.api.subscan.io', token: 'RING', decimals: 18 },
  { name: 'Darwinia Crab', apiUrl: 'https://crab.api.subscan.io', token: 'CRAB', decimals: 18 },
  { name: 'Edgeware', apiUrl: 'https://edgeware.api.subscan.io', token: 'EDG', decimals: 18 },
  { name: 'Kulupu', apiUrl: 'https://kulupu.api.subscan.io', token: 'KLP', decimals: 12 },
  { name: 'Polkadex', apiUrl: 'https://polkadex.api.subscan.io', token: 'PDEX', decimals: 12 },
  { name: 'RioChain', apiUrl: 'https://riochain.api.subscan.io', token: 'RIO', decimals: 18 },
  { name: 'Shibuya', apiUrl: 'https://shibuya.api.subscan.io', token: 'SBY', decimals: 18 },
  { name: 'Shibuya EVM', apiUrl: 'https://shibuya-evm.api.subscan.io', token: 'SBY', decimals: 18 },
  { name: 'Sakura', apiUrl: 'https://sakura.api.subscan.io', token: 'SKU', decimals: 18 },
  { name: 'Turing', apiUrl: 'https://turing.api.subscan.io', token: 'TUR', decimals: 10 },
  { name: 'Watr', apiUrl: 'https://watr.api.subscan.io', token: 'WATR', decimals: 18 },
  { name: 'Integritee', apiUrl: 'https://integritee.api.subscan.io', token: 'TEER', decimals: 12 },
  { name: 'Pendulum', apiUrl: 'https://pendulum.api.subscan.io', token: 'PEN', decimals: 12 },
  { name: 'Amplitude', apiUrl: 'https://amplitude.api.subscan.io', token: 'AMPE', decimals: 12 },
  { name: 'Foucoco', apiUrl: 'https://foucoco.api.subscan.io', token: 'COCO', decimals: 12 },
  { name: 'Dancebox', apiUrl: 'https://dancebox.api.subscan.io', token: 'DBX', decimals: 12 },
  { name: 'Listen', apiUrl: 'https://listen.api.subscan.io', token: 'LT', decimals: 12 },
  { name: 'Mangata', apiUrl: 'https://mangata.api.subscan.io', token: 'MGX', decimals: 18 },
  { name: 'OAK', apiUrl: 'https://oak.api.subscan.io', token: 'OAK', decimals: 10 },
  { name: 'Tinkernet', apiUrl: 'https://tinkernet.api.subscan.io', token: 'TNKR', decimals: 12 },
  { name: 'InvArch', apiUrl: 'https://invarch.api.subscan.io', token: 'INV', decimals: 12 },
  { name: 'InvArch Tinkernet', apiUrl: 'https://tinkernet.api.subscan.io', token: 'TNKR', decimals: 12 },
  { name: 'Krest', apiUrl: 'https://krest.api.subscan.io', token: 'KREST', decimals: 18 },
  { name: 'Peaq', apiUrl: 'https://peaq.api.subscan.io', token: 'PEAQ', decimals: 18 },
  { name: 'Peaq Agung', apiUrl: 'https://agung.api.subscan.io', token: 'PEAQ', decimals: 18 },
  { name: 'NeuroWeb', apiUrl: 'https://neuroweb.api.subscan.io', token: 'NEURO', decimals: 12 },
  { name: 'NeuroWeb Testnet', apiUrl: 'https://neuroweb-testnet.api.subscan.io', token: 'NEURO', decimals: 12 },
  { name: 'NeuroWeb EVM', apiUrl: 'https://neuroweb-evm.api.subscan.io', token: 'NEURO', decimals: 12 },
  { name: 'NeuroWeb EVM Testnet', apiUrl: 'https://neuroweb-evm-testnet.api.subscan.io', token: 'NEURO', decimals: 12 },
]

/**
 * Get all mainnet chains (exclude testnets)
 */
export function getMainnetChains(): SubscanChainInfo[] {
  const testnets = ['Westend', 'Paseo', 'Shibuya', 'Shibuya EVM', 'Sakura', 'KILT Peregrine', 
                    'Subsocial Soonsocial', 'Darwinia Crab', 'Foucoco', 'Dancebox', 'Krest',
                    'Peaq Agung', 'NeuroWeb Testnet', 'NeuroWeb EVM Testnet', 'InvArch Tinkernet']
  return ALL_SUBSCAN_CHAINS.filter(chain => !testnets.includes(chain.name))
}

/**
 * Get only the essential chains for portfolio queries
 * Limited to specified chains to reduce API calls and stay within rate limits
 */
export function getEssentialChains(): SubscanChainInfo[] {
  const essentialChainNames = [
    'Polkadot',
    'Kusama',
    'AssetHub Polkadot', // AssetHub Polkadot (shown in portfolio)
    'Statemine', // AssetHub Kusama (Statemine is Kusama AssetHub, shown in portfolio)
    'Moonbeam',
    'Astar',
    'Acala',
    'Manta Atlantic', // Manta Atlantic (shown in portfolio)
    'Avail', // Avail (shown in portfolio)
    'Calamari', // Calamari (shown in portfolio)
    'Centrifuge',
    'Bifrost',
    'Hydration', // Not HydraDX
    'Pendulum',
    'Phala',
    'Crust',
    'KILT',
    'Peaq',
    'Robonomics',
    'Unique',
    'Darwinia',
    'Energy Web X',
    'Heima',
    'NeuroWeb'
  ]
  
  return ALL_SUBSCAN_CHAINS.filter(chain => essentialChainNames.includes(chain.name))
}

/**
 * Get chain info by name
 */
export function getChainInfo(name: string): SubscanChainInfo | undefined {
  return ALL_SUBSCAN_CHAINS.find(chain => chain.name === name)
}

/**
 * Filter chains by category (matching Subscan dashboard filters)
 */
export function getChainsByCategory(category: 'polkadot' | 'kusama' | 'mainnets' | 'testnets' | 'all'): SubscanChainInfo[] {
  switch (category) {
    case 'polkadot':
      return ALL_SUBSCAN_CHAINS.filter(chain => 
        chain.name === 'Polkadot' ||
        chain.name.includes('Polkadot') ||
        chain.name === 'Acala' ||
        chain.name === 'Astar' ||
        chain.name === 'Moonbeam' ||
        chain.name === 'Parallel' ||
        chain.name === 'Interlay' ||
        chain.name === 'Phala' ||
        chain.name === 'Unique' ||
        chain.name === 'Litentry' ||
        chain.name === 'Composable' ||
        chain.name === 'Centrifuge' ||
        chain.name === 'HydraDX' ||
        chain.name === 'Bifrost' ||
        chain.name === 'Manta' ||
        chain.name === 'Manta Atlantic' ||
        chain.name === 'Avail' ||
        chain.name === 'Statemint' ||
        chain.name === 'Energy Web X' ||
        chain.name === 'Heima' ||
        chain.name === 'Hydration' ||
        chain.name === 'Mythos'
      )
    
    case 'kusama':
      return ALL_SUBSCAN_CHAINS.filter(chain =>
        chain.name === 'Kusama' ||
        chain.name === 'Karura' ||
        chain.name === 'Shiden' ||
        chain.name === 'Bifrost Kusama' ||
        chain.name === 'Khala' ||
        chain.name === 'Quartz' ||
        chain.name === 'Calamari' ||
        chain.name === 'Basilisk' ||
        chain.name === 'Altair' ||
        chain.name === 'Heiko' ||
        chain.name === 'Kintsugi' ||
        chain.name === 'Picasso' ||
        chain.name === 'Crust' ||
        chain.name === 'Robonomics' ||
        chain.name === 'Statemine'
      )
    
    case 'mainnets':
      return getMainnetChains()
    
    case 'testnets':
      return ALL_SUBSCAN_CHAINS.filter(chain => 
        chain.name === 'Westend' ||
        chain.name === 'Paseo' ||
        chain.name === 'Shibuya' ||
        chain.name === 'Shibuya EVM' ||
        chain.name === 'Sakura' ||
        chain.name === 'KILT Peregrine' ||
        chain.name === 'Subsocial Soonsocial' ||
        chain.name === 'Darwinia Crab' ||
        chain.name === 'Foucoco' ||
        chain.name === 'Dancebox' ||
        chain.name === 'Krest' ||
        chain.name === 'Peaq Agung' ||
        chain.name === 'NeuroWeb Testnet' ||
        chain.name === 'NeuroWeb EVM Testnet' ||
        chain.name === 'InvArch Tinkernet'
      )
    
    case 'all':
    default:
      return ALL_SUBSCAN_CHAINS
  }
}

/**
 * Search chains by name (case-insensitive)
 */
export function searchChains(query: string): SubscanChainInfo[] {
  const lowerQuery = query.toLowerCase()
  return ALL_SUBSCAN_CHAINS.filter(chain => 
    chain.name.toLowerCase().includes(lowerQuery) ||
    chain.token.toLowerCase().includes(lowerQuery)
  )
}

