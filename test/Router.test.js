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
      supporter1,
      newRouter,
    ] = await ethers.getSigners()
    SampleNFT = await ethers.getContractFactory("SampleNFT")
    sampleNFT = await SampleNFT.deploy("SampleNFT", "SN", "")
    sampleNFT2 = await SampleNFT.deploy("SampleNFT", "SN", "")
    BondingCurve = await ethers.getContractFactory("LinearCurve")
    bondingCurve = await BondingCurve.deploy()
    bondingCurve2 = await BondingCurve.deploy()
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
    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(stakerNFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperNFTforFT).mint()
    await sampleNFT.connect(swapperFTforNFT).mint()
  })

  describe("Routerの初期設定", () => {
    it("ボンディングカーブを追加", async () => {
      await router
        .connect(owner)
        .setBondingCurveApprove(bondingCurve.address, true)
      expect(await router.getIsBondingCurveApprove(bondingCurve.address)).to
        .true
    })
    it("ボンディングカーブを追加", async () => {
      await router
        .connect(owner)
        .setBondingCurveApprove(bondingCurve2.address, true)
      expect(await router.getIsBondingCurveApprove(bondingCurve2.address)).to
        .true
    })
    it("コレクションを追加", async () => {
      await router.connect(owner).setCollectionApprove(sampleNFT.address, true)
      expect(await router.getIsCollectionApprove(sampleNFT.address)).to.true
    })
    it("コレクションを追加", async () => {
      await router.connect(owner).setCollectionApprove(sampleNFT2.address, true)
      expect(await router.getIsCollectionApprove(sampleNFT2.address)).to.true
    })
    it("ボンディングカーブが追加されたことを確認", async () => {
      const bondingCurveList = await router.getBondingCurveList()
      expect(bondingCurveList[0]).to.equal(bondingCurve.address)
    })
    it("ボンディングカーブが追加されたことを確認", async () => {
      const bondingCurveList = await router.getBondingCurveList()
      expect(bondingCurveList[1]).to.equal(bondingCurve2.address)
    })
    it("コレクションが追加されたことを確認", async () => {
      const collectionList = await router.getCollectionList()
      expect(collectionList[0]).to.equal(sampleNFT.address)
    })
    it("コレクションが追加されたことを確認", async () => {
      const collectionList = await router.getCollectionList()
      expect(collectionList[1]).to.equal(sampleNFT2.address)
    })
    it("ボンディングカーブを削除", async () => {
      await router
        .connect(owner)
        .setBondingCurveApprove(bondingCurve2.address, false)
      expect(await router.getIsBondingCurveApprove(bondingCurve2.address)).to
        .not.true
    })
    it("コレクションを追加", async () => {
      await router
        .connect(owner)
        .setCollectionApprove(sampleNFT2.address, false)
      expect(await router.getIsCollectionApprove(sampleNFT2.address)).to.not
        .true
    })
    it("routerにfactoryの追加", async () => {
      await router.connect(owner).setFactory(factory721.address)
      expect(await router.factory()).to.equal(factory721.address)
    })
  })

  describe("Factory721の初期設定", () => {
    it("新しいRouterに変更して元に戻す", async () => {
      expect(await factory721.router()).to.equal(router.address)
      await factory721.connect(owner).setRouterAddress(newRouter.address)
      expect(await factory721.router()).to.equal(newRouter.address)
      await factory721.connect(owner).setRouterAddress(router.address)
    })
    it("手数料の%を変更する", async () => {
      expect(await factory721.routerFeeRatio()).to.equal(
        ethers.utils.parseEther("0.2")
      )
      await factory721
        .connect(owner)
        .setRouterFeeRatio(ethers.utils.parseEther("0.1"))
      expect(await factory721.routerFeeRatio()).to.equal(
        ethers.utils.parseEther("0.1")
      )
      await factory721
        .connect(owner)
        .setRouterFeeRatio(ethers.utils.parseEther("0.2"))
    })
  })

  describe("poolの作成", () => {
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
    it("コレクションが追加されたことを確認", async () => {
      const poolList = await router.getCollectionPoolList(sampleNFT.address)
      expect(poolList[0]).to.equal(pool721.address)
    })
    it("routerの変更", async function () {
      expect(await pool721.router()).to.equal(router.address)
      await router
        .connect(owner)
        .setPoolRouter(pool721.address, router2.address)
      expect(await pool721.router()).to.equal(router2.address)
      await router2
        .connect(owner)
        .setPoolRouter(pool721.address, router.address)
      expect(await pool721.router()).to.equal(router.address)
    })
  })

  let spotPrice1 = ethers.utils.parseEther("0.01")
  let delta1 = ethers.utils.parseEther("0.002")
  let divergence1 = ethers.utils.parseEther("0.8")
  describe("ボンディングカーブのテスト", () => {
    it("ボンディングカーブの確認1", async () => {
      totalFee = await pool721.getCalcSellInfo(
        4,
        spotPrice1,
        delta1,
        divergence1
      )
      expect(totalFee).to.equal(ethers.utils.parseEther("0.016"))
    })
    it("ボンディングカーブの確認2", async () => {
      totalFee = await pool721.getCalcSellInfo(
        12,
        spotPrice1,
        delta1,
        divergence1
      )
      expect(totalFee).to.equal(ethers.utils.parseEther("0.0144"))
    })
    it("ボンディングカーブの確認3", async () => {
      totalFee = await pool721.getCalcSellInfo(
        0,
        spotPrice1,
        delta1,
        divergence1
      )
      expect(totalFee).to.equal(ethers.utils.parseEther("0"))
    })
    it("ボンディングカーブの確認4", async () => {
      totalFee = await pool721.getCalcBuyInfo(
        0,
        spotPrice1,
        delta1,
        divergence1
      )
      expect(totalFee).to.equal(ethers.utils.parseEther("0"))
    })
    let maxSpotPrice = ethers.utils.parseEther("1000000000000000000")
    it("ボンディングカーブの確認5", async () => {
      totalFee = await pool721.getCalcBuyInfo(
        0,
        maxSpotPrice,
        delta1,
        divergence1
      )
      expect(totalFee).to.equal(ethers.utils.parseEther("0"))
    })
  })

  describe("NFTをステーキング → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 1)
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ["1"])
      ).to.emit(pool721, "StakeNFT")
    })
    it("getUserStakeNFTPoolList", async () => {
      poolList = await router.getUserStakeNFTPoolList(stakerNFT.address)
      expect(poolList[0]).to.equal(pool721.address)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ["1"])
      ).to.emit(pool721, "WithdrawNFT")
    })
    it("getUserStakeNFTPoolList", async () => {
      poolList = await router.getUserStakeNFTPoolList(stakerNFT.address)
      expect(poolList[0]).to.not.equal(pool721.address)
    })
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
        await router.connect(stakerNFT).stakeNFT(pool721.address, ["1"])
      ).to.emit(pool721, "StakeNFT")
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ["1"], supporter1.address, {
            value: ethers.utils.parseEther("0.01"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, [])
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
    })
  })

  describe("NFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 2)
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ["2"])
      ).to.emit(pool721, "StakeNFT")
    })
    it("ユーザーのステーキングプールに追加", async () => {
      poolList = await router
        .connect(stakerNFT)
        .getUserStakeNFTPoolList(stakerNFT.address)
      expect(poolList[0]).to.equal(pool721.address)
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ["2"], supporter1.address, {
            value: ethers.utils.parseEther("0.011"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 3)
      expect(
        await router
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            pool721.address,
            ["3"],
            ethers.utils.parseEther("0.0088"),
            supporter1.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("NFTの流動性を解除すると流動性報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ["3"])
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("ユーザーのステーキングプールから削除", async () => {
      poolList = await router
        .connect(stakerNFT)
        .getUserStakeNFTPoolList(stakerNFT.address)
      expect(poolList[0]).to.not.equal(pool721.address)
    })
    it("サポーターを追加", async () => {
      await router.connect(owner).setSupporterApprove(supporter1.address, true)
      expect(await router.getIsSupporterApprove(supporter1.address)).to.true
    })
    it("サポーターFeeが適切にもらえる", async () => {
      let beforBalance = await ethers.provider.getBalance(supporter1.address)
      await router.connect(supporter1).withdrawSupportFee()
      let afterBalance = await ethers.provider.getBalance(supporter1.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("ProtocolFeeが適切にもらえる", async () => {
      let beforBalance = await ethers.provider.getBalance(owner.address)
      await router.connect(owner).withdrawProtocolFee()
      let afterBalance = await ethers.provider.getBalance(owner.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
  })

  describe("2人がNFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 5)
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ["5"])
      ).to.emit(pool721, "StakeNFT")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      await sampleNFT.connect(stakerNFT2).approve(pool721.address, 6)
      expect(
        await router.connect(stakerNFT2).stakeNFT(pool721.address, ["6"])
      ).to.emit(pool721, "StakeNFT")
    })
    it("FTからNFTにスワップをするとEventが発行される", async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ["5", "6"], supporter1.address, {
            value: ethers.utils.parseEther("0.023"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("NFTからFTにスワップをするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 13)
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 14)
      expect(
        await router
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            pool721.address,
            ["13", "14"],
            ethers.utils.parseEther("0.0184"),
            supporter1.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("NFTの流動性を解除すると報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ["13"])
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("NFTの流動性を解除すると報酬が入り残高が増える", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerNFT2.address)
      expect(
        await router.connect(stakerNFT2).withdrawNFT(pool721.address, ["14"])
      ).to.emit(pool721, "WithdrawNFT")
      let afterBalance = await ethers.provider.getBalance(stakerNFT2.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
  })

  describe("FTをステーキング → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it("FTをステーキングするとEventが発行される", async () => {
      expect(
        await router.connect(stakerFT).stakeFT(pool721.address, 1, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("FTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        router.connect(stakerFT).withdrawFT(pool721.address, 1, [])
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
  })

  describe("NFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除", () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await router.connect(stakerFT).stakeFT(pool721.address, 1, {
          value: ethers.utils.parseEther("0.0080"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("NFTをステーキングするとEventが発行される", async () => {
      expect(
        await router.connect(stakerFT2).stakeFT(pool721.address, 1, {
          value: ethers.utils.parseEther("0.0072"),
        })
      ).to.emit(pool721, "StakeFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 9)
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 10)
      expect(
        await router
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            pool721.address,
            ["9", "10"],
            ethers.utils.parseEther("0.0136"),
            supporter1.address
          )
      ).to.emit(pool721, "SwapNFTforFT")
    })
    it("FTからNFTにスワップするとEventが発行される", async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ["9", "10"], supporter1.address, {
            value: ethers.utils.parseEther("0.017"),
          })
      ).to.emit(pool721, "SwapFTforNFT")
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT.address)
      await expect(
        router.connect(stakerFT).withdrawFT(pool721.address, 1, [])
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
    it("NFTの流動性を解除するとEventが発行される", async () => {
      let beforBalance = await ethers.provider.getBalance(stakerFT2.address)
      await expect(
        router.connect(stakerFT2).withdrawFT(pool721.address, 1, [])
      ).to.emit(pool721, "WithdrawFT")
      let afterBalance = await ethers.provider.getBalance(stakerFT2.address)
      expect(afterBalance - beforBalance).to.above(0)
      console.log(afterBalance - beforBalance)
    })
  })
})
