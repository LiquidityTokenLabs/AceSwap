export const CHAIN = 'Astar'
export const BONDING_CURVE = 'Linear'

export const NFT_NAME = 'Astar Candy'

export const POOL_ADDRESS = '0xc8ca8fcA2C7902D2c5298c33489Cd43D1134bdF4'
export const CONTRACT_ADDRESS = '0x3002fA5EF0396700aaF3E1D2Fa74F4d7301CaD12'
export const AMEDAMA_IMG = '/images/astarCandy.jpg'

export const ASTAR_ID = 592

export const TOKEN_721_ABI = [
  'function approve(address to, uint256 tokenId) public virtual override',
  'function getAllHeldIds(address user) external view returns (uint256[] memory)',
]

export const NETWORKS = [
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
    poolAddress: POOL_ADDRESS,
    contractAddress: CONTRACT_ADDRESS,
  }
}
