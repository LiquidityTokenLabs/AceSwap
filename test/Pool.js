const { expect } = require('chai')
const { ethers } = require('hardhat')
const BN = ethers.BigNumber.from

let initSpotPrice = ethers.utils.parseEther('0.01')
let initDelta = ethers.utils.parseEther('0.001')

describe('結合テスト', function () {
  before('デプロイ', async () => {
    ;[owner, staker, swaper, swaper2] = await ethers.getSigners()
    SampleNFT = await ethers.getContractFactory('SampleNFT')
    sampleNFT = await SampleNFT.deploy('SampleNFT', 'SN')
    YomiPool = await ethers.getContractFactory('AceSwap.sol')
    yomiPool = await YomiPool.deploy(
      initSpotPrice,
      initDelta,
      sampleNFT.address,
      owner.address,
      owner.address
    )

    await sampleNFT.mint(staker.address)
    await sampleNFT.mint(staker.address)
    await sampleNFT.mint(swaper2.address)
  })

  describe('NFTをステーキングして即座に流動生を解除する', function () {
    it('stakerがNFTをステーキングできる', async function () {
      await sampleNFT.connect(staker).approve(yomiPool.address, 1)
      expect(await yomiPool.connect(staker).stakeNFT(['1'])).to.emit(
        yomiPool,
        'StakeNFT'
      )
    })

    it('stakerに適切なLP数が分配されている', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(ethers.utils.parseEther('0.01'))
    })

    it('コントラクト内の総LPポイントが増える', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(
        ethers.utils.parseEther('0.01')
      )
    })

    it('コントラクト内の売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(1)
    })

    it('コントラクト内の初期売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(1)
    })

    it('ユーザー別の売り枠が増える', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(1)
    })

    it('ステーキングしたNFTのオーナーがコントラクトに変わる', async function () {
      expect(await sampleNFT.connect(staker).ownerOf(1)).to.equal(
        yomiPool.address
      )
    })

    it('stakerはNFTの流動性を解除できる', async function () {
      expect(await yomiPool.connect(staker).withdrawNFTAndFee(['1'])).to.emit(
        yomiPool,
        'RemoveLP'
      )
    })

    it('ステーキングしていたNFTのオーナーがstakerになる', async function () {
      expect(await sampleNFT.connect(staker).ownerOf(1)).to.equal(
        staker.address
      )
    })

    it('stakerは流動性を解除したのでLPは0になる', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(0)
    })

    it('コントラクト内の総LPポイントが減る', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(0)
    })

    it('コントラクト内の売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(0)
    })

    it('コントラクト内の初期売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(0)
    })

    it('ユーザー別の売り枠が減る', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(0)
    })
  })

  describe('FTをNFTにスワップして流動生を解除する', function () {
    it('NFTをステーキングしてイベントが発行される', async function () {
      await sampleNFT.connect(staker).approve(yomiPool.address, 1)
      await expect(await yomiPool.connect(staker).stakeNFT(['1'])).to.emit(
        yomiPool,
        'StakeNFT'
      )
    })

    it('stakerに適切なLP数が分配されている', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(ethers.utils.parseEther('0.01'))
    })

    it('コントラクト内の総LPポイントが増える', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(
        ethers.utils.parseEther('0.01')
      )
    })

    it('コントラクト内の売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(1)
    })

    it('コントラクト内の初期売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(1)
    })

    it('ユーザー別の売り枠が増える', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(1)
    })

    it('ステーキングしたNFTのオーナーがコントラクトに変わる', async function () {
      expect(await sampleNFT.connect(staker).ownerOf(1)).to.equal(
        yomiPool.address
      )
    })

    it('FTをNFTにスワップする', async function () {
      expect(
        await yomiPool
          .connect(swaper)
          .swapFTforNFT(['1'], { value: ethers.utils.parseEther('0.01') })
      ).to.emit(yomiPool, 'SwapFTforNFT')
    })

    it('スワップによってNFTのオーナーがswaperになる', async function () {
      expect(await sampleNFT.connect(swaper).ownerOf(1)).to.equal(
        swaper.address
      )
    })

    it('コントラクト内の売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(0)
    })

    it('コントラクト内の買い枠が増える', async function () {
      expect(await yomiPool.connect(staker).sellNum()).to.equal(1)
    })

    it('流動性を解除する', async function () {
      expect(await yomiPool.connect(staker).withdrawNFTAndFTAndFee([])).to.emit(
        yomiPool,
        'RemoveLP'
      )
    })

    it('stakerは流動性を解除したのでLPは0になる', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(0)
    })

    it('コントラクト内の総LPポイントが減る', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(0)
    })

    it('コントラクト内の売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(0)
    })

    it('コントラクト内の初期売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(0)
    })

    it('ユーザー別の売り枠が減る', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(0)
    })
  })

  describe('NFTをステーキングしてFTにスワップする', function () {
    it('stakerはNFTをステーキングできる', async function () {
      await sampleNFT.connect(staker).approve(yomiPool.address, 2)
      expect(await yomiPool.connect(staker).stakeNFT(['2'])).to.emit(
        yomiPool,
        'StakeNFT'
      )
    })

    it('stakerに適切なLP数が分配されている', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(ethers.utils.parseEther('0.011'))
    })

    it('コントラクト内の総LPポイントが増える', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(
        ethers.utils.parseEther('0.011')
      )
    })

    it('コントラクト内の売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(1)
    })

    it('コントラクト内の初期売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(1)
    })

    it('ユーザー別の売り枠が増える', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(1)
    })

    it('ステーキングしたNFTのオーナーがコントラクトに変わる', async function () {
      expect(await sampleNFT.connect(staker).ownerOf(2)).to.equal(
        yomiPool.address
      )
    })

    it('swaperはFTをNFTに交換する', async function () {
      expect(
        await yomiPool
          .connect(swaper)
          .swapFTforNFT(['2'], { value: ethers.utils.parseEther('0.011') })
      ).to.emit(yomiPool, 'SwapFTforNFT')
    })

    it('スワップによってNFTのオーナーがswaperになる', async function () {
      expect(await sampleNFT.connect(swaper).ownerOf(1)).to.equal(
        swaper.address
      )
    })

    it('コントラクト内の売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(0)
    })

    it('コントラクト内の買い枠が増える', async function () {
      expect(await yomiPool.connect(staker).sellNum()).to.equal(1)
    })

    it('FTとNFTをスワップする', async function () {
      await sampleNFT.connect(swaper2).approve(yomiPool.address, 3)
      // await yomiPool.getCalcSellInfo(1);
      expect(
        await yomiPool
          .connect(swaper2)
          .swapNFTforFT(['3'], ethers.utils.parseEther('0.01'))
      ).to.emit(yomiPool, 'SwapNFTforFT')
    })

    it('スワップによってNFTのオーナーがコントラクトになる', async function () {
      expect(await sampleNFT.connect(swaper).ownerOf(3)).to.equal(
        yomiPool.address
      )
    })

    it('コントラクト内の売り枠が増える', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(1)
    })

    it('コントラクト内の買い枠が減る', async function () {
      expect(await yomiPool.connect(staker).sellNum()).to.equal(0)
    })

    it('スワップにより利益が生まれたためtotalFeeを増やす', async function () {
      expect(await yomiPool.totalFee()).to.equal(
        ethers.utils.parseEther('0.001')
      )
    })

    it('stakerはNFTの流動性を解除できる', async function () {
      expect(await yomiPool.connect(staker).withdrawNFTAndFee(['3'])).to.emit(
        yomiPool,
        'RemoveLP'
      )
    })

    it('ステーキングしていたNFTのオーナーがstakerになる', async function () {
      expect(await sampleNFT.connect(staker).ownerOf(3)).to.equal(
        staker.address
      )
    })

    it('stakerは流動性を解除したのでLPは0になる', async function () {
      expect(
        await yomiPool.connect(staker).getUserLPoint(staker.address)
      ).to.equal(0)
    })

    it('コントラクト内の総LPポイントが減る', async function () {
      expect(await yomiPool.connect(staker).totalLPoint()).to.equal(0)
    })

    it('コントラクト内の売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).buyNum()).to.equal(0)
    })

    it('コントラクト内の初期売り枠が減る', async function () {
      expect(await yomiPool.connect(staker).initBuyNum()).to.equal(0)
    })

    it('ユーザー別の売り枠が減る', async function () {
      expect(
        await yomiPool.connect(staker).getUserInitBuyNum(staker.address)
      ).to.equal(0)
    })
  })
})
