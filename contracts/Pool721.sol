// SPDX-License-Identifier: None
pragma solidity =0.8.17;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import './interfaces/ICurve.sol';
import './bonding-curves/CurveErrorCode.sol';
import './lib/FixedPointMathLib.sol';

contract Pool721 {
  using FixedPointMathLib for uint256;

  //STORAGE
  //@param protocolFeeRatio: to calculate fee
  uint256 public protocolFeeRatio;

  //@param address of collection
  address public collection;

  //@param address of bondingCurve
  address public bondingCurve;

  //@param address of router
  address public router;

  //@param buyEventNum: NFT->FT event num
  uint256 public buyEventNum;

  //@param sellEventNum: FT->NFT event num
  uint256 public sellEventNum;

  //@param totalNFTpoint: total Point of LP
  uint256 public totalNFTpoint;

  //@param stakeNFTprice
  uint128 public stakeNFTprice;

  //@param total fee of NFT
  uint256 public totalNFTfee;

  //@param isOtherStake: flg other stake
  bool public isOtherStake;

  //@param poolInfo: pool information
  PoolInfo public poolInfo;

  //@param holdIds: this address hold TokenIds
  uint256[] public holdIds;

  //@param userInfo: list info of user Staking
  mapping(address => UserInfo) userInfo;

  //STRUCT
  struct UserInfo {
    uint256 userInitBuyNum;
    uint256 userInitSellNum;
    uint256 userInitSellAmount;
    uint256 userNFTpoint;
    uint256 userFTpoint;
  }

  struct PoolInfo {
    uint128 spotPrice;
    uint128 delta;
    uint256 spread;
    uint256 buyNum;
    uint256 sellNum;
  }

  //CONSTRUCTOR
  //@notice initialization setting
  constructor(
    address _collection,
    address _bondingCurve,
    uint128 _spotPrice,
    uint128 _delta,
    uint256 _spread,
    uint256 _protocolFeeRatio,
    address _router
  ) {
    collection = _collection;
    bondingCurve = _bondingCurve;
    poolInfo.spotPrice = _spotPrice;
    stakeNFTprice = _spotPrice;
    poolInfo.delta = _delta;
    poolInfo.spread = _spread;
    protocolFeeRatio = _protocolFeeRatio;
    router = _router;
    isOtherStake = true;
  }

  modifier onlyRouter() {
    require(router == msg.sender, 'onlyRouter');
    _;
  }

  //@notice Staking of NFT
  function stakeNFT(uint256[] calldata _tokenIds, address _user)
    external
    onlyRouter
  {
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, 'Not 0');

    //update stakeNFTprice
    (
      CurveErrorCodes.Error error,
      uint128 _newstakeNFTprice,
      uint128 _newDelta,
      ,
      uint256 _totalFee
    ) = ICurve(bondingCurve).getBuyInfo(
        stakeNFTprice,
        poolInfo.delta,
        poolInfo.spread,
        _itemNum
      );
    require(error == CurveErrorCodes.Error.OK, 'Bonding error');

    //effect
    uint256 _LP = _calcNFTpoint(_totalFee);
    userInfo[_user].userNFTpoint += _LP;
    totalNFTpoint += _LP;
    userInfo[_user].userInitBuyNum += _itemNum;
    poolInfo.buyNum += _itemNum;
    _updateStakeInfo(2, _newstakeNFTprice, _newDelta);

    //intaraction
    _sendNFTs(_tokenIds, _itemNum, _user, address(this));
  }

  //@notice swap FT for NFT
  function swapFTforNFT(uint256[] calldata _tokenIds, address _user)
    external
    payable
    onlyRouter
    returns (uint256 _protocolFee)
  {
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, 'Not 0');

    //calc total fee
    (
      CurveErrorCodes.Error error,
      uint128 _newSpotPrice,
      uint128 _newDelta,
      uint256 _newSpread,
      uint256 _totalFee
    ) = ICurve(bondingCurve).getBuyInfo(
        poolInfo.spotPrice,
        poolInfo.delta,
        poolInfo.spread,
        _itemNum
      );
    require(error == CurveErrorCodes.Error.OK, 'Bonding error');

    //check
    require(_itemNum <= poolInfo.buyNum, 'Not enough liquidity');
    require(msg.value >= _totalFee, 'Not enough value');

    //effect
    buyEventNum += _itemNum;
    poolInfo.buyNum -= _itemNum;
    poolInfo.sellNum += _itemNum;
    _protocolFee = _calcProfit();
    _updatePoolInfo(_newSpotPrice, _newDelta, _newSpread);

    //intaraction
    payable(_user).transfer(msg.value - _totalFee);
    payable(router).transfer(_protocolFee);
    _sendNFTs(_tokenIds, _tokenIds.length, address(this), _user);
  }

  //@notice swap NFT for FT
  function swapNFTforFT(
    uint256[] calldata _tokenIds,
    uint256 _minExpectFee,
    address _user
  ) external payable onlyRouter returns (uint256 _protocolFee) {
    uint256 _itemNum = _tokenIds.length;
    require(_itemNum > 0, 'Not 0');

    //calc total fee
    (
      CurveErrorCodes.Error error,
      uint128 _newSpotPrice,
      uint128 _newDelta,
      uint256 _newSpread,
      uint256 _totalFee
    ) = ICurve(bondingCurve).getSellInfo(
        poolInfo.spotPrice,
        poolInfo.delta,
        poolInfo.spread,
        _itemNum
      );
    require(error == CurveErrorCodes.Error.OK, 'Bonding error');

    //check
    require(_itemNum <= poolInfo.sellNum, 'Not enough liquidity');
    require(_totalFee >= _minExpectFee, 'Not expected value');
    require(address(this).balance >= _totalFee, 'Not enough contract balance');

    //effect
    sellEventNum += _itemNum;
    poolInfo.sellNum -= _itemNum;
    poolInfo.buyNum += _itemNum;
    _protocolFee = _calcProfit();
    _updatePoolInfo(_newSpotPrice, _newDelta, _newSpread);

    //intaraction
    _sendNFTs(_tokenIds, _itemNum, _user, address(this));

    payable(_user).transfer(_totalFee);
    payable(router).transfer(_protocolFee);
  }

  //@notice withdraw NFT
  function withdrawNFT(uint256[] calldata _tokenIds, address _user)
    external
    payable
    onlyRouter
  {
    uint256 _itemNum = _tokenIds.length;
    uint256 _userNum = userInfo[_user].userInitBuyNum;
    uint256 _userFee = _calcNFTfee(_user);

    //check
    require(poolInfo.buyNum >= _itemNum, 'Pool not enough NFT');
    require(
      userInfo[_user].userInitBuyNum == _itemNum ||
        (userInfo[_user].userInitBuyNum > _itemNum &&
          poolInfo.buyNum == _itemNum),
      'Something is wrong.'
    );

    //effect
    poolInfo.buyNum -= _itemNum;
    userInfo[_user].userInitBuyNum = 0;
    totalNFTpoint -= userInfo[_user].userNFTpoint;
    totalNFTfee -= _userFee;
    userInfo[_user].userNFTpoint = 0;

    //down stakeNFTprice
    if (_itemNum > 0) {
      (
        CurveErrorCodes.Error error,
        uint128 _newstakeNFTprice,
        uint128 _newDelta,
        ,

      ) = ICurve(bondingCurve).getSellInfo(
          stakeNFTprice,
          poolInfo.delta,
          0,
          _userNum
        );
      require(error == CurveErrorCodes.Error.OK, 'Bonding error');

      _updateStakeInfo(2, _newstakeNFTprice, _newDelta);
    }

    //if pool not liquitiy NFT
    if (_userNum > _itemNum) {
      uint256 _subItemNum = _userNum - _itemNum;

      //calc FT instead NFT
      (CurveErrorCodes.Error error, , , , uint256 _totalFee2) = ICurve(
        bondingCurve
      ).getSellInfo(stakeNFTprice, poolInfo.delta, 0, _subItemNum);
      require(error == CurveErrorCodes.Error.OK, 'Bonding error');

      poolInfo.sellNum -= _subItemNum;
      buyEventNum -= _subItemNum;

      if (_totalFee2 > 0) {
        payable(_user).transfer(_totalFee2);
      }
    }

    //intaraction
    _sendNFTs(_tokenIds, _itemNum, address(this), _user);

    if (_userFee > 0) {
      payable(_user).transfer(_userFee);
    }
  }

  //CALCULATION
  //@notice calc NFT point
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
  function _calcNFTfee(address _user) internal view returns (uint256 _userFee) {
    uint256 _tmpLP = ((totalNFTpoint + totalNFTfee) *
      userInfo[_user].userNFTpoint) / totalNFTpoint;
    if (_tmpLP > userInfo[_user].userNFTpoint) {
      _userFee = _tmpLP - userInfo[_user].userNFTpoint;
    } else {
      _userFee = 0;
    }
  }

  //@notice calc profit
  function _calcProfit() internal returns (uint256 protocolFee) {
    if (buyEventNum > 0 && sellEventNum > 0) {
      if (buyEventNum >= sellEventNum) {
        (CurveErrorCodes.Error calcProfitError, uint256 tmpFee) = ICurve(
          bondingCurve
        ).getBuyFeeInfo(
            poolInfo.spotPrice,
            poolInfo.delta,
            poolInfo.spread,
            sellEventNum
          );
        require(calcProfitError == CurveErrorCodes.Error.OK, 'Bonding error');

        protocolFee = tmpFee.fmul(protocolFeeRatio, FixedPointMathLib.WAD);
        totalNFTfee += (tmpFee - protocolFee);
        buyEventNum -= sellEventNum;
        sellEventNum = 0;
      } else if (sellEventNum > buyEventNum) {
        (CurveErrorCodes.Error calcProfitError, uint256 tmpFee) = ICurve(
          bondingCurve
        ).getSellFeeInfo(
            poolInfo.spotPrice,
            poolInfo.delta,
            poolInfo.spread,
            buyEventNum
          );
        require(calcProfitError == CurveErrorCodes.Error.OK, 'Bonding error');

        protocolFee = tmpFee.fmul(protocolFeeRatio, FixedPointMathLib.WAD);
        totalNFTfee += (tmpFee - protocolFee);
        sellEventNum -= buyEventNum;
        buyEventNum = 0;
      }
    }
  }

  //@notice update poolInfo
  function _updatePoolInfo(
    uint128 _newSpotPrice,
    uint128 _newDelta,
    uint256 _newSpread
  ) internal {
    if (poolInfo.spotPrice != _newSpotPrice) {
      poolInfo.spotPrice = _newSpotPrice;
    }
    if (poolInfo.delta != _newDelta && _newDelta != 0) {
      poolInfo.delta = _newDelta;
    }
    if (poolInfo.spread != _newSpread && _newSpread != 0) {
      poolInfo.spread = _newSpread;
    }
  }

  //@notice update StakeInfo
  function _updateStakeInfo(
    uint256 _select,
    uint128 _newStakePrice,
    uint128 _newDelta
  ) internal {
    if (stakeNFTprice != _newStakePrice && _select == 2) {
      stakeNFTprice = _newStakePrice;
    }
    if (poolInfo.delta != _newDelta && _newDelta != 0) {
      poolInfo.delta = _newDelta;
    }
  }

  //@notice batch nft transfer
  //@notice batch nft transfer
  function _sendNFTs(
    uint256[] calldata _tokenIds,
    uint256 _itemNum,
    address _from,
    address _to
  ) internal {
    unchecked {
      for (uint256 i = 0; i < _itemNum; i++) {
        IERC721(collection).safeTransferFrom(_from, _to, _tokenIds[i], '');
      }
    }
    if (_from == address(this)) {
      _removeHoldIds(_tokenIds);
    } else if (_to == address(this)) {
      _addHoldIds(_tokenIds);
    }
  }

  //@notice add tokenId to list hold token
  function _addHoldIds(uint256[] calldata _tokenIds) internal {
    for (uint256 i = 0; i < _tokenIds.length; i++) {
      holdIds.push(_tokenIds[i]);
    }
  }

  //@notice remove tokenId to list hold token
  function _removeHoldIds(uint256[] calldata _tokenIds) internal {
    for (uint256 j = 0; j < _tokenIds.length; j++) {
      uint256 _num = holdIds.length;
      for (uint256 i = 0; i < _num; i++) {
        if (holdIds[i] == _tokenIds[j]) {
          if (i != _num - 1) {
            holdIds[i] = holdIds[_num - 1];
          }
          holdIds.pop();
          break;
        }
      }
    }
  }

  //GET
  //@notice get total buy price
  function getCalcBuyInfo(uint256 _itemNum, uint128 _spotPrice)
    external
    view
    returns (uint256)
  {
    (, , , , uint256 _totalFee) = ICurve(bondingCurve).getBuyInfo(
      _spotPrice,
      poolInfo.delta,
      poolInfo.spread,
      _itemNum
    );
    return _totalFee;
  }

  //@notice get total sell price
  function getCalcSellInfo(uint256 _itemNum, uint128 _spotPrice)
    external
    view
    returns (uint256)
  {
    (, , , , uint256 _totalFee) = ICurve(bondingCurve).getSellInfo(
      _spotPrice,
      poolInfo.delta,
      poolInfo.spread,
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
