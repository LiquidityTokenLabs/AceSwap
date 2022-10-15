const { expect } = require("chai")
const { ethers } = require("hardhat")

let spotPrice = ethers.utils.parseEther("0.01")
let delta = ethers.utils.parseEther("0.001")
let divergence = ethers.utils.parseEther("0.8")
let protocolFeeRatio = ethers.utils.parseEther("0.2")

describe("結合テスト", function () {
  before("デプロイ", async () => {
    ;[
      owner,
      stakerNFT,
      stakerNFT2,
      stakerFT,
      stakerFT2,
      swapperFTforNFT,
      swapperNFTforFT,
    ] = await ethers.getSigners()
    SampleNFT = await ethers.getContractFactory("SampleNFT")
    sampleNFT = await SampleNFT.deploy("SampleNFT", "SN", "")
    BondingCurve = await ethers.getContractFactory("LinerCurve")
    bondingCurve = await BondingCurve.deploy()
    Router = await ethers.getContractFactory("Router")
    router = await Router.deploy()
    Factory721 = await ethers.getContractFactory("Factory721")
    factory721 = await Factory721.deploy(
      router.address,
      ethers.utils.parseEther("0.2")
    )

    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(stakerNFT2).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperFTforNFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
  })
  describe("poolの作成", () => {
    it("NFTをステーキングするとEventが発行される", async () => {
      await router
        .connect(owner)
        .setBondingCurveApprove(bondingCurve.address, true)
      await router.connect(owner).setCollectionApprove(sampleNFT.address, true)
      expect(await router.getIsCollectionApprove(sampleNFT.address)).to.true
      expect(await router.getIsBondingCurveApprove(bondingCurve.address)).to
        .true
    })
    it("Factory721によるプールの作成", async function () {
      pool721Address = await factory721.createPool(
        sampleNFT.address,
        bondingCurve.address,
        spotPrice,
        delta,
        divergence
      )
      pool721pend = await (await pool721Address).wait()
      await expect(pool721Address).to.emit(factory721, "CreatePool")
    })
    it("作成したプールのアドレスを確認", async function () {
      const createPooled = pool721pend.events.find(
        (event) => event.event === "CreatePool"
      )
      ;[pool721tast] = createPooled.args
      expect(pool721tast).to.not.be.null
    })
    it("プールのインスタンス化", async function () {
      const Pool721 = await ethers.getContractFactory("Pool721")
      pool721 = await new ethers.Contract(
        pool721tast,
        Pool721.interface.format(),
        factory721.signer
      )
    })
  })

  describe("NFTをステーキング → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("NFTはstakerAが持っている", async function () {
      expect(await sampleNFT.ownerOf(1)).to.equal(stakerNFT.address)
    })
    it("NFTを0個でステーキングしようとするとrevertする", async () => {
      await expect(
        pool721.connect(stakerNFT).stakeNFT([], stakerNFT.address)
      ).to.be.revertedWith("Not 0")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 1)
      expect(
        await pool721.connect(stakerNFT).stakeNFT(["1"], stakerNFT.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userInitBuyNum).to.equal(1)
      expect(userInfo.userInitSellNum).to.equal(0)
      expect(userInfo.userNFTpoint).to.equal(ethers.utils.parseEther("0.01"))
    })
    it("ステーキングによってtotalNFTpointが増える", async () => {
      expect(await pool721.totalNFTpoint()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    it("プールのBuyNumが1つ増える", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(1)
    })
    it("ステーキングの基準価格(stakeNFTprice)が増加する", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("NFTの所有者がプールになる", async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(pool721.address)
    })
    it("NFTを0個で流動性解除しようとするとrevertする", async () => {
      await expect(
        pool721.connect(stakerNFT).withdrawNFT([], stakerNFT.address)
      ).to.be.revertedWith("Something is wrong.")
    })
    it("プールに存在するNFTよりも多い数で流動性を解除しようとするとrevertする", async () => {
      await expect(
        pool721.connect(stakerNFT).withdrawNFT(["1", "2"], stakerNFT.address)
      ).to.be.revertedWith("Pool not enough NFT")
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerNFT).withdrawNFT(["1"], stakerNFT.address)
      ).to.emit(pool721, "WithdrawNFT")
    })
    it("プールのtotalNFTpointが減る", async () => {
      expect(await pool721.totalNFTpoint()).to.equal(
        ethers.utils.parseEther("0")
      )
    })
    it("NFTが元の所有者であるstakerAになる", async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(stakerNFT.address)
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userInitBuyNum).to.equal(0)
      expect(userInfo.userNFTpoint).to.equal(0)
    })
    it("プールのspotPrice", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.01"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userInitBuyNum).to.equal(0)
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
  })

  describe("NFTをステーキング → FTでスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 1)
      expect(
        await pool721.connect(stakerNFT).stakeNFT(["1"], stakerNFT.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("FTからNFTにスワップする際に指定価格より安い金額を送るとrevertする", async () => {
      await expect(
        pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["1"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.001"),
          })
      ).to.be.revertedWith("Not enough value")
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["1"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.01"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("買いのイベント数(buyEventNum)が1増える", async () => {
      expect(await pool721.connect(stakerNFT).buyEventNum()).to.equal(1)
    })
    it("NFTの所有者がswapperAになる", async () => {
      expect(await sampleNFT.connect(swapperFTforNFT).ownerOf(1)).to.equal(
        swapperFTforNFT.address
      )
    })
    it("プールの買枠(BuyNum)が1減る", async () => {
      const poolInfo = await pool721.connect(stakerNFT).getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
    })
    it("プールの売枠(SellNum)が1増える", async () => {
      const poolInfo = await pool721.connect(stakerNFT).getPoolInfo()
      expect(poolInfo.sellNum).to.equal(1)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await pool721.connect(stakerNFT).withdrawNFT([], stakerNFT.address)
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
    })
    it("買いのイベント数(buyEventNum)が1減る", async () => {
      expect(await pool721.connect(stakerNFT).buyEventNum()).to.equal(0)
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userInitBuyNum).to.equal(0)
    })
    it("totalNFTpointが減る", async () => {
      expect(await pool721.connect(stakerNFT).totalNFTpoint()).to.equal(
        ethers.utils.parseEther("0")
      )
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userInitSellAmount).to.equal(ethers.utils.parseEther("0"))
    })
    it("プールのspotPrice", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
  })

  describe("NFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it("NFTの所有者はstakerBである", async function () {
      expect(await sampleNFT.connect(stakerNFT).ownerOf(2)).to.equal(
        stakerNFT.address
      )
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 2)
      expect(
        await pool721.connect(stakerNFT).stakeNFT(["2"], stakerNFT.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["2"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.011"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("プールの基準価格(spotPrice)が増加する", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.012"))
    })
    it("NFTからFTのスワップをする際に期待金額を指定価格より高くするとrevertする", async () => {
      await expect(
        pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["3"],
            ethers.utils.parseEther("0.01"),
            swapperNFTforFT.address
          )
      ).to.be.revertedWith("Not expected value")
    })
    it("プールの売枠よりも多くNFTからFTにスワップしようとするとrevertする", async () => {
      await expect(
        pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["3", "4"],
            ethers.utils.parseEther("0.01"),
            swapperNFTforFT.address
          )
      ).to.be.revertedWith("Not enough liquidity")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 3)
      expect(
        await pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["3"],
            ethers.utils.parseEther("0.0088"),
            swapperNFTforFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("プールの基準価格(spotPrice)が減少する", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("プールの売枠(SellNum)が1減る", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.sellNum).to.equal(0)
    })
    it("プールの買枠(BuyNum)が1増える", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(1)
    })
    it("NFTの所有者がプールになる", async () => {
      expect(await sampleNFT.ownerOf(3)).to.equal(pool721.address)
    })
    it("totalNFTfeeは適切である", async () => {
      expect(await pool721.connect(stakerNFT).totalNFTfee()).to.equal(
        ethers.utils.parseEther("0.00176")
      )
    })
    it("totalNFTpointは適切である", async () => {
      expect(await pool721.connect(stakerNFT).totalNFTpoint()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userNFTpoint).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("ユーザーの流動性報酬は適切である", async () => {
      expect(
        await pool721.connect(stakerNFT).getUserStakeNFTfee(stakerNFT.address)
      ).to.equal(ethers.utils.parseEther("0.00176"))
      console.log(
        await pool721.connect(stakerNFT).getUserStakeNFTfee(stakerNFT.address)
      )
    })
    it("NFTの流動性を解除すると流動性報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await pool721.connect(stakerNFT).withdrawNFT(["3"], stakerNFT.address)
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("プールの基準価格(spotPrice)が増加する", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
  })

  describe("2人がNFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 5)
      expect(
        await pool721.connect(stakerNFT).stakeNFT(["5"], stakerNFT.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT2).approve(pool721.address, 6)
      expect(
        await pool721.connect(stakerNFT2).stakeNFT(["6"], stakerNFT2.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["5", "6"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.023"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("NFTからFTにスワップをするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 13)
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 14)
      expect(
        await pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["13", "14"],
            ethers.utils.parseEther("0.0184"),
            swapperNFTforFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("プールの総LP発行量は適切である", async () => {
      expect(await pool721.connect(stakerNFT2).totalNFTpoint()).to.equal(
        ethers.utils.parseEther("0.023")
      )
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT.address)
      expect(userInfo.userNFTpoint).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerNFT2.address)
      expect(userInfo.userNFTpoint).to.equal(ethers.utils.parseEther("0.012"))
    })
    it("ユーザーの流動性報酬は適切である", async () => {
      expect(
        await pool721.connect(stakerNFT).getUserStakeNFTfee(stakerNFT.address)
      ).to.equal(ethers.utils.parseEther("0.00176"))
      console.log(
        await pool721.connect(stakerNFT).getUserStakeNFTfee(stakerNFT.address)
      )
    })
    it("ユーザーの流動性報酬は適切である", async () => {
      expect(
        await pool721.connect(stakerNFT2).getUserStakeNFTfee(stakerNFT2.address)
      ).to.equal(ethers.utils.parseEther("0.00192"))
      console.log(
        await pool721.connect(stakerNFT2).getUserStakeNFTfee(stakerNFT2.address)
      )
    })
    it("NFTの流動性を解除すると報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await pool721.connect(stakerNFT).withdrawNFT(["13"], stakerNFT.address)
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("NFTの流動性を解除すると報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT2.address)
      expect(
        await pool721
          .connect(stakerNFT2)
          .withdrawNFT(["14"], stakerNFT2.address)
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT2.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("プールの基準価格(spotPrice)が増加する", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
  })

  describe("FTをステーキング → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it("FTを0個でステーキングしようとするとrevertする", async () => {
      await expect(
        pool721.connect(stakerFT).stakeFT(0, stakerFT.address)
      ).to.be.revertedWith("Not 0")
    })
    it("FTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT).stakeFT(1, stakerFT.address, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userFTpoint).to.equal(ethers.utils.parseEther("0.008"))
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userInitSellAmount).to.equal(
        ethers.utils.parseEther("0.0080")
      )
    })
    it("ステーキングによってtotalFTpointが増える", async () => {
      expect(await pool721.connect(stakerFT).totalFTpoint()).to.equal(
        ethers.utils.parseEther("0.0080")
      )
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userInitSellNum).to.equal(1)
    })
    it("プールの状態は正しい", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.sellNum).to.equal(1)
      expect(poolInfo.buyNum).to.equal(0)
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userInitSellAmount).to.equal(
        ethers.utils.parseEther("0.0080")
      )
    })
    it("ステーキングの基準価格(stakeFTprice)が増加する", async () => {
      expect(await pool721.connect(stakerFT).stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.010")
      )
    })
    it("FTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        pool721.connect(stakerFT).withdrawFT(1, [], stakerFT.address)
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userInitSellNum).to.equal(0)
    })
    it("プールのtotalFTpointが減る", async () => {
      expect(await pool721.connect(stakerFT).totalFTpoint()).to.equal(
        ethers.utils.parseEther("0")
      )
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userFTpoint).to.equal(ethers.utils.parseEther("0"))
    })
    it("プールの基準価格(spotPrice)が増加する", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.011"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.011")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
  })

  describe("FTをステーキング → NFTからFTにスワップ  → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT).stakeFT(1, stakerFT.address, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("ユーザーのステーキング状態は正しい", async () => {
      const userInfo = await pool721.getUserInfo(stakerFT.address)
      expect(userInfo.userInitSellNum).to.equal(1)
    })
    it("プールのSellNumが1減る", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.sellNum).to.equal(1)
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 7)
      expect(
        await pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["7"],
            ethers.utils.parseEther("0.008"),
            swapperNFTforFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("プールのSellNumが1減る", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.sellNum).to.equal(0)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      await expect(
        pool721.connect(stakerFT).withdrawFT(0, ["7"], stakerFT.address)
      ).to.emit(pool721, "WithdrawFT")
    })
    it("プールのspotPrice", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.01"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
  })

  describe("FTをステーキング → NFTからFTにスワップ → FTからNFTにスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("FTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT).stakeFT(1, stakerFT.address, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperFTforNFT).approve(pool721.address, 8)
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapNFTforFT(
            ["8"],
            ethers.utils.parseEther("0.0072"),
            swapperFTforNFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["8"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.010"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("ユーザーの流動性報酬は適切である", async () => {
      expect(
        await pool721.connect(stakerFT).getUserStakeFTfee(stakerFT.address)
      ).to.equal(ethers.utils.parseEther("0.00128"))
      console.log(
        await pool721.connect(stakerFT).getUserStakeFTfee(stakerFT.address)
      )
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        pool721.connect(stakerFT).withdrawFT(1, [], stakerFT.address)
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("プールのspotPrice", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.01"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
  })

  describe("NFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT).stakeFT(1, stakerFT.address, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT2).stakeFT(1, stakerFT2.address, {
          value: ethers.utils.parseEther("0.0072"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("NFTはstakerAが持っている", async function () {
      expect(await sampleNFT.connect(swapperNFTforFT).ownerOf(9)).to.equal(
        swapperNFTforFT.address
      )
    })
    it("NFTはstakerAが持っている", async function () {
      expect(await sampleNFT.connect(swapperNFTforFT).ownerOf(10)).to.equal(
        swapperNFTforFT.address
      )
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 9)
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 10)
      expect(
        await pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["9", "10"],
            ethers.utils.parseEther("0.0136"),
            swapperNFTforFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["9", "10"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.017"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        pool721.connect(stakerFT).withdrawFT(1, [], stakerFT.address)
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT2.address)
      await expect(
        pool721.connect(stakerFT2).withdrawFT(1, [], stakerFT2.address)
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT2.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("プールのspotPrice", async () => {
      const poolInfo = await pool721.connect(stakerFT).getPoolInfo()
      expect(poolInfo.spotPrice).to.equal(ethers.utils.parseEther("0.01"))
    })
    it("プールのEventの状態は想定と同じ", async () => {
      expect(await pool721.buyEventNum()).to.equal(0)
      expect(await pool721.sellEventNum()).to.equal(0)
    })
    it("プールの状態は想定と同じ", async () => {
      const poolInfo = await pool721.getPoolInfo()
      expect(poolInfo.buyNum).to.equal(0)
      expect(poolInfo.sellNum).to.equal(0)
      expect(poolInfo.delta).to.equal(ethers.utils.parseEther("0.001"))
      expect(poolInfo.divergence).to.equal(ethers.utils.parseEther("0.8"))
    })
    it("プールのstakeFTpriceが等しい", async () => {
      expect(await pool721.stakeFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    it("プールのstakeNFTpriceが等しい", async () => {
      expect(await pool721.stakeNFTprice()).to.equal(
        ethers.utils.parseEther("0.01")
      )
    })
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
  })
  describe("NFTをステーキング → FTをステーキング → NFTからFTにスワップ → FTからNFTにスワップ → 流動性解除", () => {
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 11)
      expect(
        await pool721.connect(stakerNFT).stakeNFT(["11"], stakerNFT.address)
      ).to.emit(pool721, "StakeNFT")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await pool721.connect(stakerFT).stakeFT(1, stakerFT.address, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      expect(
        await pool721
          .connect(swapperFTforNFT)
          .swapFTforNFT(["11"], swapperFTforNFT.address, {
            value: ethers.utils.parseEther("0.010"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 12)
      expect(
        await pool721
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            ["12"],
            ethers.utils.parseEther("0.0080"),
            swapperNFTforFT.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      await expect(
        pool721.connect(stakerNFT).withdrawNFT(["12"], stakerNFT.address)
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        pool721.connect(stakerFT).withdrawFT(1, [], stakerFT.address)
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
  })
})
