import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  SampleNFT__factory,
  SampleNFT,
  Router__factory,
  Router,
  Factory721__factory,
  Factory721,
  LinearCurve__factory,
  LinearCurve,
  Pool721__factory,
  Pool721,
} from '../typechain-types';
import { ContractTransaction } from 'ethers';

let spotPrice = ethers.utils.parseEther('0.01');
let delta = ethers.utils.parseEther('0.001');
let spread = ethers.utils.parseEther('0.2');
let protocolFeeRatio = ethers.utils.parseEther('0.8');

describe('結合テスト', function () {
  // type of contracts
  let sampleNFT: SampleNFT;
  let sampleNFT2: SampleNFT;
  let router: Router;
  let factory721: Factory721;
  let factory7212: Factory721;
  let bondingCurve: LinearCurve;
  let bondingCurve2: LinearCurve;
  let pool721: Pool721;
  let pool7212: Pool721;

  // type of users
  let owner: SignerWithAddress;
  let stakerFT: SignerWithAddress;
  let stakerFT2: SignerWithAddress;
  let stakerNFT: SignerWithAddress;
  let stakerNFT2: SignerWithAddress;
  let swapperNFTforFT: SignerWithAddress;
  let swapperFTforNFT: SignerWithAddress;
  let supporter1: SignerWithAddress;
  let supporter2: SignerWithAddress;
  let newRouter: SignerWithAddress;
  before('デプロイ', async () => {
    [
      owner,
      stakerNFT,
      stakerNFT2,
      stakerFT,
      stakerFT2,
      swapperFTforNFT,
      swapperNFTforFT,
      supporter1,
      supporter2,
      newRouter,
    ] = await ethers.getSigners();
    const SampleNFT = (await ethers.getContractFactory(
      'SampleNFT'
    )) as SampleNFT__factory;
    sampleNFT = await SampleNFT.deploy('SampleNFT', 'SN', '');
    sampleNFT2 = await SampleNFT.deploy('SampleNFT2', 'SN2', '');
    const BondingCurve = (await ethers.getContractFactory(
      'LinearCurve'
    )) as LinearCurve__factory;
    bondingCurve = await BondingCurve.deploy();
    bondingCurve2 = await BondingCurve.deploy();
    const Router = (await ethers.getContractFactory(
      'Router'
    )) as Router__factory;
    router = await Router.deploy();
    const Factory721 = (await ethers.getContractFactory(
      'Factory721'
    )) as Factory721__factory;
    factory721 = await Factory721.deploy(
      router.address,
      ethers.utils.parseEther('0.8')
    );
    factory7212 = await Factory721.deploy(
      router.address,
      ethers.utils.parseEther('0.8')
    );

    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(stakerNFT2).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperFTforNFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(stakerNFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperNFTforFT).mint();
    await sampleNFT.connect(swapperFTforNFT).mint();
  });

  describe('Routerの初期設定(追加と削除)', () => {
    it('ボンディングカーブを追加', async () => {
      await router.setBondingCurveApprove(bondingCurve.address, true);
      expect(await router.getIsBondingCurveApprove(bondingCurve.address)).to
        .true;
    });
    it('ボンディングカーブを追加', async () => {
      await router.setBondingCurveApprove(bondingCurve2.address, true);
      expect(await router.getIsBondingCurveApprove(bondingCurve2.address)).to
        .true;
    });
    it('コレクションを追加', async () => {
      await router.setCollectionApprove(sampleNFT.address, true);
      expect(await router.getIsCollectionApprove(sampleNFT.address)).to.true;
    });
    it('コレクションを追加', async () => {
      await router.setCollectionApprove(sampleNFT2.address, true);
      expect(await router.getIsCollectionApprove(sampleNFT2.address)).to.true;
    });
    it('routerにfactoryの追加', async () => {
      await router.setFactoryApprove(factory721.address, true);
      expect(await router.getIsFactoryApprove(factory721.address)).to.true;
    });
    it('routerにfactoryの追加', async () => {
      await router.setFactoryApprove(factory7212.address, true);
      expect(await router.getIsFactoryApprove(factory7212.address)).to.true;
    });
    it('ボンディングカーブを削除', async () => {
      await router.setBondingCurveApprove(bondingCurve2.address, false);
      expect(await router.getIsBondingCurveApprove(bondingCurve2.address)).to
        .not.true;
    });
    it('コレクションを削除', async () => {
      await router.setCollectionApprove(sampleNFT2.address, false);
      expect(await router.getIsCollectionApprove(sampleNFT2.address)).to.not
        .true;
    });
    it('factoryを削除', async () => {
      await router.setFactoryApprove(factory7212.address, false);
      expect(await router.getIsFactoryApprove(factory7212.address)).to.not.true;
    });
  });

  describe('FactoryからPoolの作成', () => {
    let pool721Address: ContractTransaction;
    let pool721pend: any;
    let pool721tast: any;
    it('Factory721によるプールの作成', async function () {
      pool721Address = await factory721.createPool(
        sampleNFT.address,
        bondingCurve.address,
        spotPrice,
        delta,
        spread
      );
      pool721pend = await (await pool721Address).wait();
      await expect(pool721Address).to.emit(factory721, 'CreatePool');
    });
    it('作成したプールのアドレスを確認', async function () {
      const createPooled = pool721pend.events.find(
        (event: any) => event.event === 'CreatePool'
      );
      [pool721tast] = createPooled.args;
      expect(pool721tast).to.not.be.null;
    });
    it('プールのインスタンス化', async function () {
      const Pool721 = (await ethers.getContractFactory(
        'Pool721'
      )) as Pool721__factory;
      pool721 = (await new ethers.Contract(
        pool721tast,
        Pool721.interface.format(),
        factory721.signer
      )) as Pool721;
    });
    it('プールに追加', async function () {
      let collectionList = await router.getCollectionPoolList(
        sampleNFT.address
      );
      expect(collectionList.otherStakePools[0]).to.equal(pool721.address);
    });
  });

  describe('プールの初期状態の確認', () => {
    it('GET:ボンディングカーブは設定したアドレスに等しい', async function () {
      let bondingCurveAddress = await pool721.bondingCurve();
      expect(bondingCurveAddress).to.equal(bondingCurve.address);
    });
    it('GET:コレクションは設定したアドレスに等しい', async function () {
      let collectionAddress = await pool721.collection();
      expect(collectionAddress).to.equal(sampleNFT.address);
    });
    it('GET:Routerは設定したアドレスに等しい', async function () {
      let routerAddress = await pool721.router();
      expect(routerAddress).to.equal(router.address);
    });
    it('GET:ProtocolFeeRatioは設定した値に等しい', async function () {
      let tmpProtocolFeeRatio = await pool721.protocolFeeRatio();
      expect(tmpProtocolFeeRatio).to.equal(protocolFeeRatio);
    });
    it('GET:buyEventNumは設定した値に等しい', async function () {
      let buyEventNum = await pool721.buyEventNum();
      expect(buyEventNum).to.equal(0);
    });
    it('GET:sellEventNumは設定した値に等しい', async function () {
      let sellEventNum = await pool721.sellEventNum();
      expect(sellEventNum).to.equal(0);
    });
    it('GET:stakeNFTpriceは設定した値に等しい', async function () {
      let stakeNFTprice = await pool721.stakeNFTprice();
      expect(stakeNFTprice).to.equal(spotPrice);
    });
    it('GET:poolInfoは設定した値に等しい', async () => {
      let poolInfo = await pool721.getPoolInfo();
      expect(poolInfo.spotPrice).to.equal(spotPrice);
      expect(poolInfo.buyNum).to.equal(0);
      expect(poolInfo.sellNum).to.equal(0);
      expect(poolInfo.delta).to.equal(delta);
      expect(poolInfo.spread).to.equal(spread);
    });
    it('GET:他のユーザーはステークできる(isOtherStakeはtrue)', async function () {
      let isOtherStake = await pool721.isOtherStake();
      expect(isOtherStake).to.true;
    });
  });

  let spotPrice1 = ethers.utils.parseEther('0.01');
  describe('ボンディングカーブの計算が正しいか検証', () => {
    it('GET:適切な計算がされる', async () => {
      let totalFee = await pool721.getCalcSellInfo(4, spotPrice1);
      expect(totalFee).to.equal(ethers.utils.parseEther('0.024'));
    });
    it('GET:適切な計算がされる', async () => {
      let totalFee = await pool721.getCalcBuyInfo(4, spotPrice1);
      expect(totalFee).to.equal(ethers.utils.parseEther('0.046'));
    });
    it('GET:個数が多すぎて元の数を割る場合は0に近い形で調整される', async () => {
      let totalFee = await pool721.getCalcSellInfo(12, spotPrice1);
      expect(totalFee).to.equal(ethers.utils.parseEther('0.0352'));
    });
    it('GET:個数が0だとエラーが出て全て0になる', async () => {
      let totalFee = await pool721.getCalcSellInfo(0, spotPrice1);
      expect(totalFee).to.equal(ethers.utils.parseEther('0'));
    });
    it('GET:個数が0だとエラーが出て全て0になる', async () => {
      let totalFee = await pool721.getCalcBuyInfo(0, spotPrice1);
      expect(totalFee).to.equal(ethers.utils.parseEther('0'));
    });
    let maxSpotPrice = ethers.utils.parseEther('1000000000000000000');
    it('GET:過剰に大きな数を入れるとエラーが出て全て0になる', async () => {
      let totalFee = await pool721.getCalcBuyInfo(0, maxSpotPrice);
      expect(totalFee).to.equal(ethers.utils.parseEther('0'));
    });
  });

  // describe('Factory721の初期設定', () => {
  //   it('新しいRouterに変更して元に戻す', async () => {
  //     expect(await factory721.router()).to.equal(router.address);
  //     await factory721.setRouterAddress(newRouter.address);
  //     expect(await factory721.router()).to.equal(newRouter.address);
  //     await factory721.setRouterAddress(router.address);
  //   });
  //   it('手数料の%を変更する', async () => {
  //     expect(await factory721.routerFeeRatio()).to.equal(
  //       ethers.utils.parseEther('0.2')
  //     );
  //     await factory721.setRouterFeeRatio(ethers.utils.parseEther('0.1'));
  //     expect(await factory721.routerFeeRatio()).to.equal(
  //       ethers.utils.parseEther('0.1')
  //     );
  //     await factory721.setRouterFeeRatio(ethers.utils.parseEther('0.2'));
  //   });
  // });

  describe('NFTをステーキング → 流動性解除', () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it('ステーキングする前はStakerNFTが所有者である', async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(stakerNFT.address);
    });
    it('NFTをステーキングするとEventが発行される', async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 1);
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ['1'])
      ).to.emit(pool721, 'StakeNFT');
    });
    it('ステーキングしたので所有者がプールになる', async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(pool721.address);
    });
    it('ステーキングしたのでNFTポイントが追加される', async () => {
      let userInfo = pool721.getUserInfo(stakerNFT.address);
      expect((await userInfo).userNFTpoint).to.equal(
        ethers.utils.parseEther('0.01')
      );
    });
    it('ステーキングしたのでユーザーのステーキング中プールリストに入る', async () => {
      let poolList = await router.getUserStakePoolList(stakerNFT.address);
      expect(poolList.stakeNFTpools[0]).to.equal(pool721.address);
    });
    it('NFTの流動性を解除するとEventが発行される', async () => {
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ['1'])
      ).to.emit(pool721, 'WithdrawNFT');
    });
    it('ステーキングを解除したのでNFTポイントが0になる', async () => {
      let userInfo = pool721.getUserInfo(stakerNFT.address);
      expect((await userInfo).userNFTpoint).to.equal(
        ethers.utils.parseEther('0')
      );
    });
    it('ステーキングを解除したので所有者がStakerNFTに戻る', async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(stakerNFT.address);
    });
    it('ステーキングを解除したのでユーザーのステーキング中プールから削除される', async () => {
      let poolList = await router.getUserStakePoolList(stakerNFT.address);
      expect(poolList.stakeNFTpools[0]).to.not.equal(pool721.address);
    });
    it('ステーキングを解除したのでユーザーのステーキング中プールから削除される', async () => {
      let poolList = await router.getCollectionPoolList(sampleNFT.address);
      expect(poolList.otherStakePools[0]).to.not.equal(pool721.address);
    });
  });

  describe('NFTをステーキング → FTでスワップ → 流動性解除', () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.01
    //stakeNFTprice: 0.01
    it('NFTをステーキングするとEventが発行される', async () => {
      await expect(
        router.connect(stakerNFT).stakeNFT(pool721.address, ['1'])
      ).to.revertedWith('ERC721: caller is not token owner nor approved');
    });
    it('NFTをステーキングするとEventが発行される', async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 1);
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ['1'])
      ).to.emit(pool721, 'StakeNFT');
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
    it('ステーキングをしたのでNFTの所有者はプールになる', async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(pool721.address);
    });
    it('FTからNFTにスワップをするとEventが発行される', async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ['1'], ethers.constants.AddressZero, {
            value: ethers.utils.parseEther('0.01'),
          })
      ).to.emit(pool721, 'SwapFTforNFT');
    });
    it('スワップによってNFTの所有者がswapperFTforNFTになる', async () => {
      expect(await sampleNFT.ownerOf(1)).to.equal(swapperFTforNFT.address);
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
    it('NFTの流動性を解除するとEventが発行される', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, [])
      ).to.emit(pool721, 'WithdrawNFT');
      let afterBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':Stakerが受け取った量'
      );
    });
    it('ステーキングを解除したのでNFTポイントが0になる', async () => {
      let userInfo = pool721.getUserInfo(stakerNFT.address);
      expect((await userInfo).userNFTpoint).to.equal(
        ethers.utils.parseEther('0')
      );
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
  });

  describe('NFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除', () => {
    //spotPrice: 0.01
    //sellNum: 0
    //buyNum: 0
    //stakeFTprice: 0.011
    //stakeNFTprice: 0.011
    it('NFTをステーキングするとEventが発行される', async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 2);
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ['2'])
      ).to.emit(pool721, 'StakeNFT');
    });
    it('FTからNFTにスワップをするとEventが発行される', async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ['2'], supporter1.address, {
            value: ethers.utils.parseEther('0.011'),
          })
      ).to.emit(pool721, 'SwapFTforNFT');
    });
    it('FTからNFTにスワップするとEventが発行される', async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 3);
      expect(
        await router
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            pool721.address,
            ['3'],
            ethers.utils.parseEther('0.0088'),
            supporter1.address
          )
      ).to.emit(pool721, 'SwapNFTforFT');
    });
    it('NFTの流動性を解除すると流動性報酬が入り残高が増える', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ['3'])
      ).to.emit(pool721, 'WithdrawNFT');
      let afterBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() +
          ':Stakerが受け取った流動性報酬'
      );
    });
    it('サポーターを追加', async () => {
      await router.setSupporterApprove(supporter1.address, true);
      expect(await router.getIsSupporterApprove(supporter1.address)).to.true;
    });
    it('サポーターFeeが適切にもらえる', async () => {
      await expect(
        router.connect(supporter2).withdrawSupportFee()
      ).to.revertedWith('Not Fee');
    });
    it('ルーター内残高', async () => {
      let balance = await ethers.provider.getBalance(router.address);
      console.log(balance.toString() + ':Router内の残高');
    });
    it('サポーターFeeが適切にもらえる', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        supporter1.address
      );
      await router.connect(supporter1).withdrawSupportFee();
      let afterBalance: any = await ethers.provider.getBalance(
        supporter1.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':サポーターが受け取る量'
      );
    });
    it('ProtocolFeeが適切にもらえる', async () => {
      let beforBalance = await ethers.provider.getBalance(owner.address);
      await router.withdrawProtocolFee();
      let afterBalance = await ethers.provider.getBalance(owner.address);
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':プロトコルが受け取る量'
      );
    });
    it('ルーター内残高', async () => {
      let balance = await ethers.provider.getBalance(router.address);
      console.log(balance.toString() + ':Router内の残高');
    });
  });

  describe('2人がNFTをステーキング → FTからNFTにスワップ → NFTからFTにスワップ → 流動性解除', () => {
    it('NFTをステーキングするとEventが発行される', async () => {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 5);
      expect(
        await router.connect(stakerNFT).stakeNFT(pool721.address, ['5'])
      ).to.emit(pool721, 'StakeNFT');
    });
    it('NFTをステーキングするとEventが発行される', async () => {
      await sampleNFT.connect(stakerNFT2).approve(pool721.address, 6);
      expect(
        await router.connect(stakerNFT2).stakeNFT(pool721.address, ['6'])
      ).to.emit(pool721, 'StakeNFT');
    });
    it('FTからNFTにスワップをする際に総金額が足りてないとrevertする', async () => {
      await expect(
        router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ['5', '6'], supporter1.address, {
            value: ethers.utils.parseEther('0.001'),
          })
      ).to.revertedWith('Not enough value');
    });
    it('FTからNFTにスワップをするとEventが発行される', async () => {
      expect(
        await router
          .connect(swapperFTforNFT)
          .swapFTforNFT(pool721.address, ['5', '6'], supporter1.address, {
            value: ethers.utils.parseEther('0.023'),
          })
      ).to.emit(pool721, 'SwapFTforNFT');
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
    it('NFTからFTにスワップをするとEventが発行される', async () => {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 13);
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 14);
      expect(
        await router
          .connect(swapperNFTforFT)
          .swapNFTforFT(
            pool721.address,
            ['13', '14'],
            ethers.utils.parseEther('0.0184'),
            supporter1.address
          )
      ).to.emit(pool721, 'SwapNFTforFT');
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
    it('NFTをステーキングした数より多くのNFTを選択して解除しようとするとrevertする', async () => {
      await expect(
        router.connect(stakerNFT).withdrawNFT(pool721.address, ['13', '14'])
      ).to.revertedWith('Something is wrong.');
    });
    it('NFTの流動性を解除すると報酬が入り残高が増える', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(
        await router.connect(stakerNFT).withdrawNFT(pool721.address, ['13'])
      ).to.emit(pool721, 'WithdrawNFT');
      let afterBalance: any = await ethers.provider.getBalance(
        stakerNFT.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(afterBalance.sub(beforBalance).toString() + ':流動性報酬');
    });
    it('NFTの流動性を解除すると報酬が入り残高が増える', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        stakerNFT2.address
      );
      expect(
        await router.connect(stakerNFT2).withdrawNFT(pool721.address, ['14'])
      ).to.emit(pool721, 'WithdrawNFT');
      let afterBalance: any = await ethers.provider.getBalance(
        stakerNFT2.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(afterBalance.sub(beforBalance).toString() + ':流動性報酬');
    });
    it('プール内残高', async () => {
      let balance = await ethers.provider.getBalance(pool721.address);
      console.log(balance.toString() + ':Pool内の残高');
    });
    it('ルーター内残高', async () => {
      let balance = await ethers.provider.getBalance(router.address);
      console.log(balance.toString() + ':Router内の残高');
    });
    it('サポーターFeeが適切にもらえる', async () => {
      let beforBalance: any = await ethers.provider.getBalance(
        supporter1.address
      );
      await router.connect(supporter1).withdrawSupportFee();
      let afterBalance: any = await ethers.provider.getBalance(
        supporter1.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':サポーターが受け取る量'
      );
    });
    it('ProtocolFeeが適切にもらえる', async () => {
      let beforBalance = await ethers.provider.getBalance(owner.address);
      await router.withdrawProtocolFee();
      let afterBalance = await ethers.provider.getBalance(owner.address);
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':プロトコルが受け取る量'
      );
    });
    it('ルーター内残高', async () => {
      let balance = await ethers.provider.getBalance(router.address);
      console.log(balance.toString() + ':Router内の残高');
    });
  });

  describe('NFTを2プールにステーク → FTを2プールにステーク', () => {
    let pool721Address2: ContractTransaction;
    let pool721pend2: any;
    let pool721tast2: any;
    it('Factory721によるプールの作成', async function () {
      pool721Address2 = await factory721.createPool(
        sampleNFT.address,
        bondingCurve.address,
        spotPrice,
        delta,
        spread
      );
      pool721pend2 = await (await pool721Address2).wait();
      await expect(pool721Address2).to.emit(factory721, 'CreatePool');
    });
    it('作成したプールのアドレスを確認', async function () {
      const createPooled = pool721pend2.events.find(
        (event: any) => event.event === 'CreatePool'
      );
      [pool721tast2] = createPooled.args;
      expect(pool721tast2).to.not.be.null;
    });
    it('プールのインスタンス化', async function () {
      const Pool721 = (await ethers.getContractFactory(
        'Pool721'
      )) as Pool721__factory;
      pool7212 = (await new ethers.Contract(
        pool721tast2,
        Pool721.interface.format(),
        factory721.signer
      )) as Pool721;
    });
    it('2プールに2つのNFTをステーク', async function () {
      await sampleNFT.connect(stakerNFT).approve(pool721.address, 15);
      await sampleNFT.connect(stakerNFT).approve(pool7212.address, 16);
      await router
        .connect(stakerNFT)
        .batchStakeNFT(
          [pool721.address, pool7212.address],
          [[['15']], [['16']]]
        );
    });
    it('NFTはプールが持っている', async function () {
      expect(await sampleNFT.ownerOf(15)).to.equal(pool721.address);
      expect(await sampleNFT.ownerOf(16)).to.equal(pool7212.address);
    });
    it('2プールからFT->NFT', async function () {
      await router
        .connect(swapperFTforNFT)
        .batchSwapFTforNFT(
          [pool721.address, pool7212.address],
          [[['15']], [['16']]],
          owner.address,
          {
            value: ethers.utils.parseEther('0.021'),
          }
        );
    });
    it('2プールからNFT->FT', async function () {
      await sampleNFT.connect(swapperNFTforFT).approve(pool721.address, 17);
      await sampleNFT.connect(swapperNFTforFT).approve(pool7212.address, 18);
      let beforBalance: any = await ethers.provider.getBalance(
        swapperNFTforFT.address
      );
      await router
        .connect(swapperNFTforFT)
        .batchSwapNFTforFT(
          [pool721.address, pool7212.address],
          [[['17']], [['18']]],
          [ethers.utils.parseEther('0.008'), ethers.utils.parseEther('0.008')],
          owner.address
        );
      let afterBalance: any = await ethers.provider.getBalance(
        swapperNFTforFT.address
      );
      expect(afterBalance.sub(beforBalance)).to.above(0);
      console.log(
        afterBalance.sub(beforBalance).toString() + ':swapperが受け取った量'
      );
    });
    it('2プール', async function () {
      let poolList = await router.getCollectionPoolList(sampleNFT.address);
      expect(poolList.otherStakePools[0]).to.equal(pool7212.address);
      // expect(poolList.otherStakePools[1]).to.equal(pool7212.address);
    });
  });
});
