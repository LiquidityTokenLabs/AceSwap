// SPDX-License-Identifier: None
pragma solidity =0.8.16;
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/ICurve.sol";
import "./bonding-curves/CurveErrorCode.sol";
import "./lib/FixedPointMathLib.sol";

contract Pool721 {
  using FixedPointMathLib for uint256;

  //STORAGE
  //@param protocolFeeRatio: to calculate fee
  uint256 public protocolFeeRatio;

  //@param address of collection
  address public collection;

  //@param address of router
  address public router;

  //@param buyEventNum: NFT->FT event num
  uint256 public buyEventNum;

  //@param sellEventNum: FT->NFT event num
  uint256 public sellEventNum;

  //param totalFTpoint
  uint256 public totalFTpoint;

  //@param totalNFTpoint: total Point of LP
  uint256 public totalNFTpoint;

  //@param stakeFTprice
  uint128 public stakeFTprice;

  //@param stakeNFTprice
  uint128 public stakeNFTprice;

  //@param total fee of FT
  uint256 public totalFTfee;

  //@param total fee of NFT
  uint256 public totalNFTfee;

  //@param poolInfo: pool information
  PoolInfo public poolInfo;

  //@param userInfo: list info of user Staking
  mapping(address => UserInfo) userInfo;

  //STRUCT
  struct UserInfo {
    uint256 userInitBuyNum;
    uint256 userInitSellNum;
    uint256 userInitSellAmount;
    // totalNFTpointに対するユーザーの持ち分の価値
    uint256 userNFTpoint;
    uint256 userFTpoint;
  }

  struct PoolInfo {
    address bondingCurve;
    uint128 spotPrice;
    uint128 delta;
    uint256 divergence;
    uint256 buyNum;
    uint256 sellNum;
  }

  //EVENT
  event StakeNFT(address indexed user, uint256 userNum, uint256[] tokenIds);
  event StakeFT(address indexed user, uint256 userNum, uint256 userAmount);
  event SwapNFTforFT(
    address indexed user,
    uint256[] tokenIds,
    uint256 totalFee
  );
  event SwapFTforNFT(
    address indexed user,
    uint256[] tokenIds,
    uint256 totalFee
  );
  event WithdrawNFT(
    address indexed user,
    uint256[] tokenIds,
    uint256 userNum,
    uint256 userFee
  );
  event WithdrawFT(
    address indexed user,
    uint256[] tokenIds,
    uint256 userNum,
    uint256 userAmount,
    uint256 userFee
  );

  //CONSTRUCTOR
  //@notice initialization setting
  constructor(
    address _collection,
    address _bondingCurve,
    uint128 _spotPrice,
    uint128 _delta,
    uint256 _divergence,
    uint256 _protocolFeeRatio,
    address _router
  ) {
    collection = _collection;
    poolInfo.bondingCurve = _bondingCurve;
    poolInfo.spotPrice = _spotPrice;
    stakeNFTprice = _spotPrice;
    stakeFTprice = _spotPrice;
    poolInfo.delta = _delta;
    poolInfo.divergence = _divergence;
    protocolFeeRatio = _protocolFeeRatio;
    router = _router;
  }

  modifier onlyRouter() {
    require(router == msg.sender, "onlyRouter");
    _;
  }

  // NFTをFTへ交換したいユーザーが実行したものか、Router.solが呼び出したものか
  modifier onlyOwnerOrRouter(address _user) {
    require(_user == msg.sender || msg.sender == router);
    _;
  }

  //@notice Staking of NFT
  function stakeNFT(uint256[] memory _tokenIds, address _user)
    public
    onlyOwnerOrRouter(_user)
  {
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, "Not 0");

    //update stakeNFTprice
    (
      CurveErrorCodes.Error error,
      uint128 _newstakeNFTprice,
      uint128 _newDelta,
      ,
      uint256 _totalFee
    ) = ICurve(poolInfo.bondingCurve).getBuyInfo(
        stakeNFTprice,
        poolInfo.delta,
        poolInfo.divergence,
        _itemNum
      );
    require(error == CurveErrorCodes.Error.OK, "Bonding error");

    //effect
    uint256 _LP = _calcNFTpoint(_totalFee);
    // ユーザー対NFTのステーキングに対するLPポイントを更新
    userInfo[_user].userNFTpoint += _LP;
    // 総NFTステーキングのLPポイント
    totalNFTpoint += _LP;
    // ユーザーの初期NFT流動性枠
    userInfo[_user].userInitBuyNum += _itemNum;
    // ？　初期NFT流動性枠との違い
    poolInfo.buyNum += _itemNum;
    // 価格・手数料を更新
    _updateStakeInfo(2, _newstakeNFTprice, _newDelta);

    // NFTをコントラクトへステーキングする関数　User→Pool
    //intaraction
    _sendNFTs(_tokenIds, _itemNum, _user, address(this));

    emit StakeNFT(_user, _itemNum, _tokenIds);
  }

  //@notice swap FT for NFT
  function swapFTforNFT(uint256[] memory _tokenIds, address _user)
    public
    payable
    onlyOwnerOrRouter(_user)
    returns (uint256 _protocolFee)
  {
    // 交換したいNFTの数
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, "Not 0");

    //calc total fee
    (
      CurveErrorCodes.Error error,
      uint128 _newSpotPrice,
      uint128 _newDelta,
      uint256 _newDivergence,
      uint256 _totalFee
    ) = ICurve(poolInfo.bondingCurve).getBuyInfo(
        poolInfo.spotPrice,
        poolInfo.delta,
        poolInfo.divergence,
        _itemNum
      );
    // エラー処理
    require(error == CurveErrorCodes.Error.OK, "Bonding error");

    //check
    require(_itemNum <= poolInfo.buyNum, "Not enough liquidity");
    require(msg.value >= _totalFee, "Not enough value");

    //effect
    // NFTが購入された回数を更新
    buyEventNum += _itemNum;
    // NFTの買枠更新
    poolInfo.buyNum -= _itemNum;
    // NFTの売枠更新
    poolInfo.sellNum += _itemNum;
    // ？　protocolFeeの計算方法
    _protocolFee = _calcProfit();
    _updatePoolInfo(_newSpotPrice, _newDelta, _newDivergence);

    //intaraction
    payable(_user).transfer(msg.value - _totalFee);
    payable(router).transfer(_protocolFee);
    _sendNFTs(_tokenIds, _tokenIds.length, address(this), _user);

    emit SwapFTforNFT(_user, _tokenIds, _totalFee);
  }

  //@notice swap NFT for FT
  function swapNFTforFT(
    uint256[] memory _tokenIds,
    uint256 _minExpectFee,
    address _user
  ) public payable onlyOwnerOrRouter(_user) returns (uint256 _protocolFee) {
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, "Not 0");

    //calc total fee
    (
      CurveErrorCodes.Error error,
      uint128 _newSpotPrice,
      uint128 _newDelta,
      uint256 _newDivergence,
      uint256 _totalFee
    ) = ICurve(poolInfo.bondingCurve).getSellInfo(
        poolInfo.spotPrice,
        poolInfo.delta,
        poolInfo.divergence,
        _itemNum
      );
    require(error == CurveErrorCodes.Error.OK, "Bonding error");

    //check
    require(_itemNum <= poolInfo.sellNum, "Not enough liquidity");
    // ？　minExpectFeeとは
    // NFTを売る側の利益を保証　その金額より低い場合は取引なし
    require(_totalFee >= _minExpectFee, "Not expected value");
    require(address(this).balance >= _totalFee, "Not enough contract balance");

    //effect
    // NFTが売却された回数
    sellEventNum += _itemNum;
    // 売枠の更新
    poolInfo.sellNum -= _itemNum;
    // 買枠の更新
    poolInfo.buyNum += _itemNum;
    _protocolFee = _calcProfit();
    _updatePoolInfo(_newSpotPrice, _newDelta, _newDivergence);

    //intaraction
    _sendNFTs(_tokenIds, _itemNum, _user, address(this));

    payable(_user).transfer(_totalFee);
    payable(router).transfer(_protocolFee);

    //event
    emit SwapNFTforFT(_user, _tokenIds, _totalFee);
  }

  //@notice withdraw NFT
  function withdrawNFT(uint256[] memory _tokenIds, address _user)
    public
    payable
  {
    uint256 _itemNum = _tokenIds.length;
    uint256 _userNum = userInfo[_user].userInitBuyNum;
    uint256 _userFee = _calcNFTfee(_user);

    //check
    require(poolInfo.buyNum >= _itemNum, "Pool not enough NFT");
    require(
      userInfo[_user].userInitBuyNum == _itemNum || poolInfo.buyNum == _itemNum,
      "Something is wrong."
    );

    //effect
    // ？　ひとつのPoolに複数のユーザーがステーキングできる仕組みになっているのか
    // pool内のNFTの買枠を更新
    poolInfo.buyNum -= _itemNum;
    // Pool内のユーザーの初期NFT流動性枠をゼロに
    userInfo[_user].userInitBuyNum = 0;
    // 総NFTステーキングポイントの更新（ユーザーAが引き出した分総数から引き算）
    totalNFTpoint -= userInfo[_user].userNFTpoint;
    // Pool内のNFTのTotalFeeを更新（ユーザーAが引き出した分総数から引き算）
    totalNFTfee -= _userFee;
    // ユーザーAのNFTのステーキングに対するLPポイントをゼロに
    userInfo[_user].userNFTpoint = 0;

    //down stakeNFTprice
    if (_itemNum > 0) {
      (
        CurveErrorCodes.Error error,
        uint128 _newstakeNFTprice,
        uint128 _newDelta,
        ,

      ) = ICurve(poolInfo.bondingCurve).getSellInfo(
          stakeNFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          _userNum
        );
      require(error == CurveErrorCodes.Error.OK, "Bonding error");

      _updateStakeInfo(2, _newstakeNFTprice, _newDelta);
    }

    //if pool not liquitiy NFT
    if (_userNum > _itemNum) {
      uint256 _subItemNum = _userNum - _itemNum;

      //calc FT instead NFT
      (CurveErrorCodes.Error error, , , , uint256 _totalFee2) = ICurve(
        poolInfo.bondingCurve
      ).getSellInfo(
          stakeNFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          _subItemNum
        );
      require(error == CurveErrorCodes.Error.OK, "Bonding error");

      //up stakeFTprice
      (
        CurveErrorCodes.Error error2,
        uint128 _newstakeFTprice,
        uint128 _newDelta,
        ,

      ) = ICurve(poolInfo.bondingCurve).getBuyInfo(
          stakeFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          _subItemNum
        );
      require(error2 == CurveErrorCodes.Error.OK, "Bonding error");

      _updateStakeInfo(1, _newstakeFTprice, _newDelta);

      poolInfo.sellNum -= _subItemNum;
      buyEventNum -= _subItemNum;

      if (_totalFee2 > 0) {
        payable(_user).transfer(_totalFee2);
      }
    }

    //intaraction
    _sendNFTs(_tokenIds, _itemNum, address(this), _user);

    if (_userFee > 0) {
      // ？　userFeeはPoolにあるNFTの総価値ではないのか（ユーザーAはNFTを引き出そうとしているのに対して、FTが送金されるのはなぜ）
      payable(_user).transfer(_userFee);
    }

    //event
    emit WithdrawNFT(_user, _tokenIds, _userNum, _userFee);
  }

  //@notice withdraw FT
  function withdrawFT(
    uint256 _userSellNum,
    uint256[] memory _tokenIds,
    address _user
  ) public payable {
    uint256 _itemNum = _tokenIds.length;
    uint256 _userNum = userInfo[_user].userInitSellNum;
    uint256 _userSellAmount = userInfo[_user].userInitSellAmount;
    uint256 _userFee = _calcFTfee(_user);
    uint256 _fee = 0;

    //check
    require(poolInfo.sellNum >= _userSellNum, "Pool not enough NFT");
    require(
      userInfo[_user].userInitSellNum == _userSellNum ||
        poolInfo.sellNum == _userSellNum,
      "Something is wrong."
    );
    require(userInfo[_user].userInitSellNum - _userSellNum == _itemNum, "true");

    //effect
    poolInfo.sellNum -= _userSellNum;
    userInfo[_user].userInitSellNum = 0;
    userInfo[_user].userInitSellAmount = 0;
    totalFTpoint -= userInfo[_user].userFTpoint;
    totalFTfee -= _userFee;
    userInfo[_user].userFTpoint = 0;

    //up stakeFTprice
    if (_userSellNum != 0) {
      (
        CurveErrorCodes.Error error,
        uint128 _newstakeFTprice,
        uint128 _newDelta,
        ,

      ) = ICurve(poolInfo.bondingCurve).getBuyInfo(
          stakeFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          _userSellNum
        );
      require(error == CurveErrorCodes.Error.OK, "Bonding error");

      _updateStakeInfo(1, _newstakeFTprice, _newDelta);
    }

    //if pool not liquidity FT
    if (_userSellNum < _userNum) {
      (CurveErrorCodes.Error error, , , , uint256 _totalCost) = ICurve(
        poolInfo.bondingCurve
      ).getBuyInfo(
          stakeFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          (_userNum - _userSellNum)
        );
      require(error == CurveErrorCodes.Error.OK, "Bonding error");

      (
        CurveErrorCodes.Error updateError,
        uint128 _newstakeNFTprice,
        ,
        ,

      ) = ICurve(poolInfo.bondingCurve).getSellInfo(
          stakeNFTprice,
          poolInfo.delta,
          FixedPointMathLib.WAD,
          _itemNum
        );
      require(updateError == CurveErrorCodes.Error.OK, "Bonding error");

      poolInfo.buyNum -= _itemNum;
      sellEventNum -= _itemNum;

      _updateStakeInfo(2, _newstakeNFTprice, 0);
      _sendNFTs(_tokenIds, _itemNum, address(this), _user);

      _fee = _totalCost;
    }

    if (_fee < _userSellAmount) {
      payable(_user).transfer(_userSellAmount - _fee);
    }

    if (_userFee > 0) {
      payable(_user).transfer(_userFee);
    }

    //event
    emit WithdrawFT(_user, _tokenIds, _userNum, _userSellAmount, _userFee);
  }

  //CALCULATION
  //@notice calc NFT point
  // ユーザーのNFTの価値
  function _calcNFTpoint(uint256 _totalFee)
    internal
    view
    returns (uint256 _LP)
  {
    if (totalNFTpoint == 0) {
      _LP = _totalFee;
    } else {
      _LP = (totalNFTpoint * _totalFee) / (totalNFTpoint + totalNFTfee);
    }
  }

  //@notice calc fee from NFT point
  // 流動性報酬計算
  function _calcNFTfee(address _user) internal view returns (uint256 _userFee) {
    uint256 _tmpLP = ((totalNFTpoint + totalNFTfee) *
      userInfo[_user].userNFTpoint) / totalNFTpoint;
    if (_tmpLP > userInfo[_user].userNFTpoint) {
      _userFee = _tmpLP - userInfo[_user].userNFTpoint;
    } else {
      _userFee = 0;
    }
  }

  //@notice calc fee from FT point
  function _calcFTfee(address _user) internal view returns (uint256 _userFee) {
    uint256 _tmpLP = ((totalFTpoint + totalFTfee) *
      userInfo[_user].userFTpoint) / totalFTpoint;
    if (_tmpLP > userInfo[_user].userFTpoint) {
      _userFee = _tmpLP - userInfo[_user].userFTpoint;
    } else {
      _userFee = 0;
    }
  }

  //@notice calc profit
  function _calcProfit() internal returns (uint256 protocolFee) {
    if (buyEventNum > 0 && sellEventNum > 0) {
      // 買枠＞売枠のときにプロトコルに利益
      if (buyEventNum >= sellEventNum) {
        (CurveErrorCodes.Error calcProfitError, uint256 tmpFee) = ICurve(
          poolInfo.bondingCurve
        ).getBuyFeeInfo(
            poolInfo.spotPrice,
            poolInfo.delta,
            poolInfo.divergence,
            sellEventNum
          );
        require(calcProfitError == CurveErrorCodes.Error.OK, "Bonding error");

        protocolFee = tmpFee.fmul(protocolFeeRatio, FixedPointMathLib.WAD);
        // ユーザーの分配量
        _calcDisFee(tmpFee - protocolFee);
        buyEventNum -= sellEventNum;
        sellEventNum = 0;
      } else if (sellEventNum > buyEventNum) {
        (CurveErrorCodes.Error calcProfitError, uint256 tmpFee) = ICurve(
          poolInfo.bondingCurve
        ).getSellFeeInfo(
            poolInfo.spotPrice,
            poolInfo.delta,
            poolInfo.divergence,
            buyEventNum
          );
        require(calcProfitError == CurveErrorCodes.Error.OK, "Bonding error");

        protocolFee = tmpFee.fmul(protocolFeeRatio, FixedPointMathLib.WAD);
        _calcDisFee(tmpFee - protocolFee);
        sellEventNum -= buyEventNum;
        buyEventNum = 0;
      }
    }
  }

  function _calcDisFee(uint256 tmpTotalFee) internal {
    if (totalFTpoint == 0) {
      totalNFTfee += tmpTotalFee;
    } else if (totalNFTpoint == 0) {
      totalFTfee += tmpTotalFee;
    } else {
      // FTのステーキングしている人がいたら（1人でも）、NFT/FTが半分ずつ
      totalFTfee += tmpTotalFee / 2;
      totalNFTfee += tmpTotalFee - tmpTotalFee / 2;
    }
  }

  //@notice update poolInfo
  function _updatePoolInfo(
    uint128 _newSpotPrice,
    uint128 _newDelta,
    uint256 _newDivergence
  ) internal {
    if (poolInfo.spotPrice != _newSpotPrice) {
      poolInfo.spotPrice = _newSpotPrice;
    }
    if (poolInfo.delta != _newDelta && _newDelta != 0) {
      poolInfo.delta = _newDelta;
    }
    if (poolInfo.divergence != _newDivergence && _newDivergence != 0) {
      poolInfo.divergence = _newDivergence;
    }
  }

  //@notice update StakeInfo
  function _updateStakeInfo(
    uint256 _select,
    uint128 _newStakePrice,
    uint128 _newDelta
  ) internal {
    if (stakeFTprice != _newStakePrice && _select == 1) {
      stakeFTprice = _newStakePrice;
    }
    if (stakeNFTprice != _newStakePrice && _select == 2) {
      stakeNFTprice = _newStakePrice;
    }
    if (poolInfo.delta != _newDelta && _newDelta != 0) {
      poolInfo.delta = _newDelta;
    }
  }

  //@notice batch nft transfer
  function _sendNFTs(
    uint256[] memory _tokenIds,
    uint256 _itemNum,
    address _from,
    address _to
  ) internal {
    unchecked {
      for (uint256 i = 0; i < _itemNum; i++) {
        IERC721(collection).safeTransferFrom(_from, _to, _tokenIds[i], "");
      }
    }
  }

  //GET
  //@notice get total buy price
  function getCalcBuyInfo(
    uint256 _itemNum,
    uint128 _spotPrice,
    uint256 _divergence
  ) external view returns (uint256) {
    (, , , , uint256 _totalFee) = ICurve(poolInfo.bondingCurve).getBuyInfo(
      _spotPrice,
      poolInfo.delta,
      _divergence,
      _itemNum
    );
    return _totalFee;
  }

  //@notice get total sell price
  function getCalcSellInfo(
    uint256 _itemNum,
    uint128 _spotPrice,
    uint256 _divergence
  ) external view returns (uint256) {
    (, , , , uint256 _totalFee) = ICurve(poolInfo.bondingCurve).getSellInfo(
      _spotPrice,
      poolInfo.delta,
      _divergence,
      _itemNum
    );
    return _totalFee;
  }

  //notice get user per Fee
  function getUserStakeNFTfee(address _user)
    external
    view
    returns (uint256 _userFee)
  {
    uint256 _tmpLP = ((totalNFTpoint + totalNFTfee) *
      userInfo[_user].userNFTpoint) / totalNFTpoint;
    if (_tmpLP > userInfo[_user].userNFTpoint) {
      _userFee = _tmpLP - userInfo[_user].userNFTpoint;
    } else {
      _userFee = 0;
    }
  }

  function getUserStakeFTfee(address _user)
    external
    view
    returns (uint256 _userFee)
  {
    uint256 _tmpLP = ((totalFTpoint + totalFTfee) *
      userInfo[_user].userFTpoint) / totalFTpoint;
    if (_tmpLP > userInfo[_user].userFTpoint) {
      _userFee = _tmpLP - userInfo[_user].userFTpoint;
    } else {
      _userFee = 0;
    }
  }

  function getPoolInfo() external view returns (PoolInfo memory) {
    return poolInfo;
  }

  function getUserInfo(address _user) external view returns (UserInfo memory) {
    return userInfo[_user];
  }

  function setRouter(address _newRouter) public onlyRouter {
    router = _newRouter;
  }

  //RECEIVED
  //@notice receive関数
  function onERC721Received(
    address,
    address,
    uint256,
    bytes memory
  ) public virtual returns (bytes4) {
    return this.onERC721Received.selector;
  }
}
