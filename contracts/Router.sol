// SPDX-License-Identifier: None
pragma solidity =0.8.16;
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPool721.sol";
import "./lib/FixedPointMathLib.sol";

contract Router is Ownable {
  using FixedPointMathLib for uint256;

  //STORAGE
  //@param protocolFee: total fee of protocolAmount
  uint256 public totalProtocolFee;

  //@param totalFee: total fee
  uint256 public totalFee;

  //@param supportFeeRatio: support fee ratio
  uint256 public supporterFeeRatio = 5e16;

  //@param list of bonding curve
  address[] public bondingCurveList;

  //@param list of collection
  address[] public collectionList;

  //MAPPING
  //@param collectionPoolList: list pool of collection
  mapping(address => address[]) collectionPoolList;

  //@param isCollectionApprove: approve of collection
  mapping(address => bool) isCollectionApprove;

  //@param userStakePoolList: list pool of user Staking
  mapping(address => address[]) userStakePoolList;

  //@param isBondingCurveApprove: approve of bondingCurve
  mapping(address => bool) isBondingCurveApprove;

  //@param totalSupportFeeList: list of total fee of support
  mapping(address => uint256) totalSupporterFeeList;

  //@param supporterApprove: approve of supporter
  mapping(address => bool) isSupporterApprove;

  //EVENT
  event StakeNFT(
    address indexed user,
    address indexed pool,
    uint256 userNum,
    uint256[] tokenIds
  );
  event SwapNFTforFT(
    address indexed user,
    address indexed pool,
    uint256[] tokenIds,
    uint256 totalFee,
    address support
  );
  event SwapFTforNFT(
    address indexed user,
    address indexed pool,
    uint256[] tokenIds,
    uint256 totalFee,
    address support
  );
  event WithdrawNFT(
    address indexed user,
    address indexed pool,
    uint256[] tokenIds,
    uint256 userNum,
    uint256 userFee
  );
  event WithdrawFT(
    address indexed user,
    address indexed pool,
    uint256[] tokenIds,
    uint256 userNum,
    uint256 userAmount,
    uint256 userFee
  );
  event Received(address, uint256);

  //MAIN
  //@notice stake of nft
  function stakeNFT(address _pool, uint256[] calldata _tokenIds) public {
    userStakePoolList[msg.sender].push(_pool);
    IPool721(_pool).stakeNFT(_tokenIds, msg.sender);
    emit StakeNFT(msg.sender, _pool, _tokenIds.length, _tokenIds);
  }

  //@notice swap NFT → FT
  function swapNFTforFT(
    address _pool,
    uint256[] calldata _tokenIds,
    uint256 _minExpectFee,
    address _support
  ) public payable {
    IPool721.PoolInfo memory _poolInfo = IPool721(_pool).getPoolInfo();
    uint256 _totalFee = IPool721(_pool).getCalcSellInfo(
      _tokenIds.length,
      _poolInfo.spotPrice,
      _poolInfo.divergence
    );

    uint256 profitAmount = IPool721(_pool).swapNFTforFT(
      _tokenIds,
      _minExpectFee,
      msg.sender
    );
    (uint256 protocolFee, uint256 supporterFee) = _calcFee(profitAmount);
    _updateFee(profitAmount, protocolFee, _support, supporterFee);
    emit SwapNFTforFT(msg.sender, _pool, _tokenIds, _totalFee, _support);
  }

  //@notice swap FT → NFT
  function swapFTforNFT(
    address _pool,
    uint256[] calldata _tokenIds,
    address _support
  ) public payable {
    IPool721.PoolInfo memory _poolInfo = IPool721(_pool).getPoolInfo();
    uint256 _totalFee = IPool721(_pool).getCalcBuyInfo(
      _tokenIds.length,
      _poolInfo.spotPrice,
      _poolInfo.divergence
    );

    uint256 profitAmount = IPool721(_pool).swapFTforNFT{value: msg.value}(
      _tokenIds,
      msg.sender
    );
    (uint256 protocolFee, uint256 supporterFee) = _calcFee(profitAmount);
    _updateFee(profitAmount, protocolFee, _support, supporterFee);
    emit SwapFTforNFT(msg.sender, _pool, _tokenIds, _totalFee, _support);
  }

  //@notice batchSwapNFTforFT
  function batchSwapNFTforFT(
    address[] memory _poolList,
    uint256[] calldata _tokenIds,
    uint256[] calldata _minExpects,
    address _support,
    uint256[] memory _pattern
  ) public {
    uint256 totalProfitAmount;
    for (uint256 i = 0; i < _pattern.length; i++) {
      uint256[] memory array;
      for (uint256 j = 0; j < _pattern[i]; j++) {
        array[j] = _tokenIds[i];
      }
      uint256 profitAmount = IPool721(_poolList[i]).swapNFTforFT(
        array,
        _minExpects[i],
        msg.sender
      );
      totalProfitAmount += profitAmount;
    }
    (uint256 protocolFee, uint256 supporterFee) = _calcFee(totalProfitAmount);
    _updateFee(totalProfitAmount, protocolFee, _support, supporterFee);
  }

  //@notice batchSwapFTforNFT
  function batchSwapFTforNFT(
    address[] memory _poolList,
    uint256[] calldata _tokenIds,
    address _support,
    uint256[] memory _pattern
  ) public {
    uint256 totalProfitAmount;
    for (uint256 i = 0; i < _pattern.length; i++) {
      uint256[] memory array;
      for (uint256 j = 0; j < _pattern[i]; j++) {
        array[j] = _tokenIds[i];
      }
      uint256 profitAmount = IPool721(_poolList[i]).swapFTforNFT(
        array,
        msg.sender
      );
      totalProfitAmount += profitAmount;
    }
    (uint256 protocolFee, uint256 supporterFee) = _calcFee(totalProfitAmount);
    _updateFee(totalProfitAmount, protocolFee, _support, supporterFee);
  }

  //@notice withdraw NFT and Fee
  function withdrawNFT(address _pool, uint256[] calldata _tokenIds) public {
    IPool721.UserInfo memory _userInfo = IPool721(_pool).getUserInfo(
      msg.sender
    );
    uint256 _userFee = IPool721(_pool).getUserStakeNFTfee(msg.sender);

    _removeUserStakePool(msg.sender, _pool);
    IPool721(_pool).withdrawNFT(_tokenIds, msg.sender);
    emit WithdrawNFT(
      msg.sender,
      _pool,
      _tokenIds,
      _userInfo.userInitBuyNum,
      _userFee
    );
  }

  //@notice withdraw FT and Fee
  function withdrawFT(
    address _pool,
    uint256 _userSellNum,
    uint256[] calldata _tokenIds
  ) public {
    IPool721.UserInfo memory _userInfo = IPool721(_pool).getUserInfo(
      msg.sender
    );
    uint256 _userFee = IPool721(_pool).getUserStakeFTfee(msg.sender);

    _removeUserStakePool(msg.sender, _pool);
    IPool721(_pool).withdrawFT(_userSellNum, _tokenIds, msg.sender);
    emit WithdrawFT(
      msg.sender,
      _pool,
      _tokenIds,
      _userSellNum,
      _userInfo.userInitSellAmount,
      _userFee
    );
  }

  //@notice withdraw protocol fee
  function withdrawProtocolFee() public payable onlyOwner {
    //check

    //effect
    totalProtocolFee = 0;

    //intaraction
    payable(msg.sender).transfer(totalProtocolFee);
  }

  //@notice withdraw support fee
  function withdrawSupportFee() public payable {
    //check
    require(isSupporterApprove[msg.sender], "You don't have supporter approve");

    //effect
    totalSupporterFeeList[msg.sender] = 0;

    //intaraction
    payable(msg.sender).transfer(totalSupporterFeeList[msg.sender]);
  }

  //SET
  //@notice approve for bonding curve
  function setBondingCurveApprove(address _bondingCurve, bool _approve)
    public
    onlyOwner
  {
    if (_approve == true) {
      bondingCurveList.push(_bondingCurve);
      isBondingCurveApprove[_bondingCurve] = _approve;
    } else if (_approve == false) {
      _removeBondingCurve(_bondingCurve);
      isBondingCurveApprove[_bondingCurve] = _approve;
    }
  }

  //@notice approve for bonding curve
  function setCollectionApprove(address _collection, bool _approve)
    public
    onlyOwner
  {
    if (_approve == true) {
      collectionList.push(_collection);
      isCollectionApprove[_collection] = _approve;
    } else if (_approve == false) {
      _removeCollection(_collection);
      isCollectionApprove[_collection] == _approve;
    }
  }

  function addCollectionPoolList(address _collection, address _pool) public {
    console.log(_pool);
    collectionPoolList[_collection].push(_pool);
  }

  //GET
  //@notice get list of collection
  function getCollectionList() external view returns (address[] memory) {
    return collectionList;
  }

  //@notice get list of bonding curve
  function getBondingCurveList() external view returns (address[] memory) {
    return bondingCurveList;
  }

  //@notice get approve of collection
  function getIsCollectionApprove(address _collection)
    external
    view
    returns (bool)
  {
    return isCollectionApprove[_collection];
  }

  //@notice get approve of bonding curve
  function getIsBondingCurveApprove(address _bondingCurve)
    external
    view
    returns (bool)
  {
    return isBondingCurveApprove[_bondingCurve];
  }

  //@notice get list of collection pool
  function getCollectionPoolList(address _collection)
    external
    view
    returns (address[] memory)
  {
    return collectionPoolList[_collection];
  }

  //@notice get info of pool
  function getPoolInfo(address pool)
    external
    returns (IPool721.PoolInfo memory poolInfo)
  {
    return IPool721(pool).getPoolInfo();
  }

  //@notice get info of user
  function getUserInfo(address _pool, address _user)
    external
    returns (IPool721.UserInfo memory userInfo)
  {
    return IPool721(_pool).getUserInfo(_user);
  }

  //INTERNAL
  //@notice calculate of fee
  function _calcFee(uint256 _totalProfitAmount)
    internal
    view
    returns (uint256 _protocolFee, uint256 _supporterFee)
  {
    _supporterFee = _totalProfitAmount.fmul(
      supporterFeeRatio,
      FixedPointMathLib.WAD
    );
    _protocolFee = _totalProfitAmount - _supporterFee;
  }

  //@notice update of fee
  function _updateFee(
    uint256 _addfee,
    uint256 _addProtocolFee,
    address _supporter,
    uint256 _addSupporterFee
  ) internal {
    totalFee += _addfee;
    totalProtocolFee += _addProtocolFee;
    totalSupporterFeeList[_supporter] += _addSupporterFee;
  }

  //@notice remove collection from collectionList
  function _removeCollection(address _collection) internal {
    _removeAddress(collectionList, _collection);
  }

  // @notice remove pool from collectionPool
  function _removeCollectionPool(address _pool) internal {
    address _collection = IPool721(_pool).collection();
    _removeAddress(collectionPoolList[_collection], _pool);
  }

  //@notice remove pool from userStakePoolList
  function _removeUserStakePool(address _user, address _pool) internal {
    _removeAddress(userStakePoolList[_user], _pool);
  }

  //@notice remove bondingCurve from bondingCurveList
  function _removeBondingCurve(address _bondingCurve) internal {
    _removeAddress(bondingCurveList, _bondingCurve);
  }

  //@notice remove address from address array
  function _removeAddress(address[] storage _array, address _target) internal {
    uint256 _num = _array.length;
    for (uint256 i = 0; i < _num; i++) {
      if (_array[i] == _target) {
        if (i != _num - 1) {
          _array[i] = _array[_num - 1];
        }
        _array.pop();
        break;
      }
    }
  }

  //@notice remove uint256 from uint256 array
  function _removeUint(uint256[] storage _array, uint256 _target) internal {
    uint256 _num = _array.length;
    for (uint256 i = 0; i < _num; i++) {
      if (_array[i] == _target) {
        if (i != _num - 1) {
          _array[i] = _array[_num - 1];
        }
        _array.pop();
        break;
      }
    }
  }

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
