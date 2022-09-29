export const YOMI_CHAIN = 'Astar'
export const YOMI_CURVE = 'Linear'

export const YOMI_SAMPLE_NAME = 'Astar Candy'

export const YOMI_ASTAR_POOL = '0xc8ca8fcA2C7902D2c5298c33489Cd43D1134bdF4'
export const YOMI_ASTAR_CONTRACT = '0x3002fA5EF0396700aaF3E1D2Fa74F4d7301CaD12'
export const AMEDAMA_IMG = '/images/yomiswap_testnft.png'

export const ASTAR_ID = 592

export const TOKEN_721_ABI = [
  'function approve(address to, uint256 tokenId) public virtual override',
  'function getAllHeldIds(address user) external view returns (uint256[] memory)',
]

export const YOMI_NETWORKS = [
  {
    id: 5,
    name: 'goeri',
    src: '/icons/ethereum.png',
  },
  { id: 420, name: 'optimism goerli', src: '/icons/optimism.png' },
  { id: 592, name: 'Astar', src: '/icons/astar.jpeg' },
]

export const getNetworkInfoByChainId = (id: number) => {
  return {
    chainName: 'Astar',
    nativeCurrency: {
      name: 'Astar',
      symbol: 'ASTR',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.astar.network:8545'],
  }
}

export const getNetworkConfByChainId = (id: number) => {
  return {
    chainName: 'Astar',
    src: '/icons/astar.jpeg',
    poolAddress: YOMI_ASTAR_POOL,
    contractAddress: YOMI_ASTAR_CONTRACT,
  }
}
