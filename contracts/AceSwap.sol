// SPDX-License-Identifier: None
pragma solidity =0.8.16;
import 'hardhat/console.sol';

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract AceSwap {
  using Counters for Counters.Counter;
  Counters.Counter private totalStake;

  // test

  //STORAGE
  //@param protocolFeeRatio: to calculate fee
  uint256 public protocolFeeRatio = 20 * 1000;

  //@param spotBuyPrice: The price of the purchase calculated at that time
  uint256 public spotPrice;

  //@param delta: Rate of change that fluctuates each time a trade is made
  uint256 public delta;

  //@param collectionAddress: Addresses collections that can be staked in the pool
  address public collectionAddress;

  //@param protocolAddress: Protocol address from which fees can be withdrawn
  address public protocolAddress;

  //@param createAddress: Pool creator's address
  address public createrAddress;

  //@param totalLPoint: total Point of LP
  uint256 public totalLPoint;

  //@param totalFee: Fee of Pool
  uint256 public totalFee;

  //@param initBuyNum: Number of pieces initially staked
  uint256 public initBuyNum;

  //@param buyNum: NFT->FT num
  uint256 public buyNum;

  //@param sellNum: FT->NFT num
  uint256 public sellNum;

  //@param buyEventNum: NFT->FT event num
  uint256 public buyEventNum;

  //@param sellEventNum: FT->NFT event num
  uint256 public sellEventNum;

  //@param userBuyNum: user per initial buy num
  mapping(address => uint256) userInitBuyNum;

  //@param userLPoint: user per LP Point
  mapping(address => uint256) userLPoint;

  //@param eventId
  uint256 public eventId;

  //EVENT
  event StakeNFT(
    address indexed staker,
    uint256[] tokenIds,
    uint256 LP,
    uint256 eventId
  );
  event SwapNFTforFT(
    address indexed swapper,
    uint256[] tokenIds,
    uint256 totalFee,
    uint256 eventId
  );
  event SwapFTforNFT(
    address indexed swapper,
    uint256[] tokenIds,
    uint256 totalFee,
    uint256 eventId
  );
  event RemoveLP(
    address indexed staker,
    uint256[] tokenIds,
    uint256 removeLP,
    uint256 eventId
  );

  //CONSTRUCTOR
  //@notice initialization setting
  constructor(
    uint256 _spotPrice,
    uint256 _delta,
    address _collectionAddress,
    address _protocolAddress,
    address _createAddress
  ) {
    spotPrice = _spotPrice;
    delta = _delta;
    collectionAddress = _collectionAddress;
    protocolAddress = _protocolAddress;
    createrAddress = _createAddress;
    eventId = 0;
  }

  //@notice Staking of NFT
  function stakeNFT(uint256[] memory tokenIds) public {
    uint256 _tmpNum = tokenIds.length;

    //check
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        require(
          IERC721(collectionAddress).ownerOf(tokenIds[i]) == msg.sender,
          'you are not owner'
        );
      }
    }

    //effect
    uint256 _LP = _calcLP(_tmpNum);
    userLPoint[msg.sender] += _LP;
    totalLPoint += _LP;

    userInitBuyNum[msg.sender] += _tmpNum;
    buyNum += _tmpNum;
    initBuyNum += _tmpNum;

    //intaraction
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        IERC721(collectionAddress).safeTransferFrom(
          msg.sender,
          address(this),
          tokenIds[i],
          ''
        );
      }
    }

    eventId += 1;
    emit StakeNFT(msg.sender, tokenIds, _LP, eventId);
  }

  //@notice swap FT for NFT
  function swapFTforNFT(uint256[] memory tokenIds) public payable {
    uint256 _tmpNum = tokenIds.length;
    (uint256 _totalFee, uint256 _newSpotPrice) = _calcBuyInfo(
      _tmpNum,
      spotPrice,
      delta
    );

    //check
    require(_tmpNum > 0, 'Must ask for > 0 NFTs');
    require(_tmpNum <= buyNum, 'buy position not enough liquidity');
    require(msg.value >= _totalFee, 'not enough value');
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        require(
          IERC721(collectionAddress).ownerOf(tokenIds[i]) == address(this)
        );
      }
    }

    //effect
    buyEventNum += _tmpNum;
    buyNum -= _tmpNum;
    sellNum += _tmpNum;
    if (spotPrice != _newSpotPrice) {
      spotPrice = _newSpotPrice;
    }

    //intaraction
    payable(msg.sender).transfer(msg.value - _totalFee);
    unchecked {
      for (uint256 i = 0; i < tokenIds.length; i++) {
        IERC721(collectionAddress).safeTransferFrom(
          address(this),
          msg.sender,
          tokenIds[i],
          ''
        );
      }
    }

    eventId += 1;
    emit SwapFTforNFT(msg.sender, tokenIds, _totalFee, eventId);
  }

  //@notice swap NFT for FT
  function swapNFTforFT(uint256[] memory tokenIds, uint256 minExpectFee)
    public
    payable
  {
    uint256 _tmpNum = tokenIds.length;
    (uint256 _totalFee, uint256 _newSpotPrice) = _calcSellInfo(
      _tmpNum,
      spotPrice,
      delta
    );

    //check
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        require(IERC721(collectionAddress).ownerOf(tokenIds[i]) == msg.sender);
      }
    }
    require(
      _totalFee >= minExpectFee,
      'The amount you get is lower than expected.'
    );
    require(address(this).balance >= _totalFee, 'this contract is not enough');
    require(_tmpNum <= sellNum, 'sell position not enough liquidity');

    //effect
    sellEventNum += _tmpNum;
    sellNum -= _tmpNum;
    buyNum += _tmpNum;

    if (buyEventNum >= sellEventNum) {
      totalFee += sellEventNum * delta;
      buyEventNum -= sellEventNum;
      sellEventNum = 0;
    }

    if (spotPrice != _newSpotPrice) {
      spotPrice = _newSpotPrice;
    }

    //intaraction
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        IERC721(collectionAddress).safeTransferFrom(
          msg.sender,
          address(this),
          tokenIds[i],
          ''
        );
      }
    }
    payable(msg.sender).transfer(_totalFee);

    //event
    eventId += 1;
    emit SwapNFTforFT(msg.sender, tokenIds, _totalFee, eventId);
  }

  //@notice withdraw nft and fee (when pool have user's initial buy num)
  function withdrawNFTAndFee(uint256[] memory tokenIds) public payable {
    uint256 _tmpNum = tokenIds.length;
    uint256 _userFee = _calcRemoveLP(_tmpNum, msg.sender);

    //check
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        require(
          IERC721(collectionAddress).ownerOf(tokenIds[i]) == address(this)
        );
      }
    }
    require(userInitBuyNum[msg.sender] == _tmpNum, 'Your NFT is remain yet');
    require(buyNum >= _tmpNum, 'Pool not enough NFT');

    //effect
    buyNum -= userInitBuyNum[msg.sender];
    initBuyNum -= userInitBuyNum[msg.sender];
    userInitBuyNum[msg.sender] = 0;
    totalLPoint -= userLPoint[msg.sender];
    userLPoint[msg.sender] = 0;

    //intaraction
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        IERC721(collectionAddress).safeTransferFrom(
          address(this),
          msg.sender,
          tokenIds[i],
          ''
        );
      }
    }

    if (_userFee > 0) {
      payable(msg.sender).transfer(_userFee);
    }

    //event
    eventId += 1;
    emit RemoveLP(msg.sender, tokenIds, userLPoint[msg.sender], eventId);
  }

  //@notice withdraw nft and fee (when pool don't have user's initial buy num)
  function withdrawNFTAndFTAndFee(uint256[] memory tokenIds) public payable {
    uint256 _tmpNum = tokenIds.length;
    uint256 _userFee = _calcRemoveLP(userInitBuyNum[msg.sender], msg.sender);

    //check
    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        require(
          IERC721(collectionAddress).ownerOf(tokenIds[i]) == address(this)
        );
      }
    }
    require(userInitBuyNum[msg.sender] > buyNum, 'Pool NFT is remain yet');
    require(buyNum == tokenIds.length, 'You would forgot NFT');

    //effect
    buyNum -= tokenIds.length;
    sellNum -= userInitBuyNum[msg.sender] - tokenIds.length;
    initBuyNum -= userInitBuyNum[msg.sender];
    userInitBuyNum[msg.sender] = 0;
    totalLPoint -= userLPoint[msg.sender];
    userLPoint[msg.sender] = 0;

    //intaraction
    payable(msg.sender).transfer(_userFee);

    unchecked {
      for (uint256 i = 0; i < _tmpNum; i++) {
        IERC721(collectionAddress).safeTransferFrom(
          address(this),
          msg.sender,
          tokenIds[i],
          ''
        );
      }
    }

    //event
    eventId += 1;
    emit RemoveLP(msg.sender, tokenIds, userLPoint[msg.sender], eventId);
  }

  //CALCULATION
  //@notice calculation LP
  function _calcLP(uint256 _num) internal view returns (uint256) {
    uint256 _LP;

    if (totalLPoint == 0) {
      _LP = _num * spotPrice;
    } else {
      _LP =
        (totalLPoint * (_num * spotPrice)) /
        (initBuyNum * spotPrice + totalFee);
    }

    return _LP;
  }

  //@notice calculation LP per Fee
  function _calcRemoveLP(uint256 _num, address _user)
    internal
    view
    returns (uint256 _userFee)
  {
    uint256 _tmpLP = ((initBuyNum * spotPrice + totalFee) * userLPoint[_user]) /
      totalLPoint;
    uint256 _tokenLP = spotPrice * _num;
    if (_tmpLP > _tokenLP) {
      _userFee = _tmpLP - _tokenLP;
    } else {
      _userFee = 0;
    }
  }

  //@notice calculation total buy fee
  function _calcBuyInfo(
    uint256 _numItems,
    uint256 _spotPrice,
    uint256 _delta
  ) internal pure returns (uint256 totalFee, uint256 newSpotPrice) {
    totalFee =
      _numItems *
      _spotPrice +
      (_numItems * (_numItems - 1) * _delta) /
      2;

    newSpotPrice = _spotPrice + _numItems * _delta;
  }

  //@notice calculation total sell fee
  function _calcSellInfo(
    uint256 _numItems,
    uint256 _spotPrice,
    uint256 _delta
  ) internal pure returns (uint256 totalFee, uint256 newSpotPrice) {
    totalFee =
      _numItems *
      (_spotPrice - _delta * 2) -
      (_numItems * (_numItems - 1) * _delta) /
      2;

    newSpotPrice = _spotPrice - _numItems * _delta;
  }

  //GET
  //@notice get user per LP
  function getUserLPoint(address user) external view returns (uint256) {
    return userLPoint[user];
  }

  //@notice get user per buy num
  function getUserInitBuyNum(address user) external view returns (uint256) {
    return userInitBuyNum[user];
  }

  //@notice get total buy price
  function getCalcBuyInfo(uint256 _numItems)
    external
    view
    returns (uint256 totalFee)
  {
    totalFee =
      _numItems *
      spotPrice +
      (_numItems * (_numItems - 1) * delta) /
      2;
    console.log(totalFee);
  }

  //@notice get total sell price
  function getCalcSellInfo(uint256 _numItems)
    external
    view
    returns (uint256 totalFee)
  {
    totalFee =
      _numItems *
      (spotPrice - delta * 2) -
      (_numItems * (_numItems - 1) * delta) /
      2;
    console.log(totalFee);
  }

  //notice get user per Fee
  function getUserFee(address _user) external view returns (uint256 _userFee) {
    uint256 _tmpLP = ((initBuyNum * spotPrice + totalFee) * userLPoint[_user]) /
      totalLPoint;
    uint256 _tokenLP = spotPrice * userInitBuyNum[_user];
    if (_tmpLP > _tokenLP) {
      _userFee = _tmpLP - _tokenLP;
    } else {
      _userFee = 0;
    }
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
