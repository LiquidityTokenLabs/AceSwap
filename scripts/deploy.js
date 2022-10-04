const hre = require('hardhat')

let initSpotPrice = ethers.utils.parseEther('0.01')
let initDelta = ethers.utils.parseEther('0.001')

async function main() {
  const SampleToken = await hre.ethers.getContractFactory('SampleNFT')
  const AceSwap = await hre.ethers.getContractFactory('YomiPool')
  const sampletoken = await SampleToken.deploy('SampleToken', 'ST')
  const aceswap = await AceSwap.sol.deploy(
    initSpotPrice,
    initDelta,
    sampletoken.address,
    '0x93ab41e27756C9987a66f9d9FBd895dDD60641A1',
    '0x93ab41e27756C9987a66f9d9FBd895dDD60641A1'
  )

  await aceswap.deployed()

  console.log('address' + aceswap.address)
}
