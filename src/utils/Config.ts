export const CHAIN = 'Astar'
export const BONDING_CURVE = 'Linear'

export const NFT_NAME = 'Astar Candy'

export const POOL_ADDRESS = '0x1112FF8c7284Af3185102e6d0c80F764209D2d1e'
export const CONTRACT_ADDRESS = '0x2E24922cc98C5d4A38d9D435a5C5bCaB956d103F'
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
