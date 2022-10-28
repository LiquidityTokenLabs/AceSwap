// SPDX-License-Identifier: None
pragma solidity =0.8.17;
import 'hardhat/console.sol';

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IPool721.sol';
import './lib/FixedPointMathLib.sol';

contract Router is Ownable {
  using FixedPointMathLib for uint256;

  //STORAGE
  //@param protocolFee: total fee of protocolAmount
  uint256 public totalProtocolFee;

  //@param supportFeeRatio: support fee ratio
  uint256 public supporterFeeRatio = 30e16;

  //@param list of collection
  address[] public collectionList;

  //MAPPING
  //@param isCollectionApprove: approve of collection
  mapping(address => bool) public isCollectionApprove;

  //@param isBondingCurveApprove: approve of bondingCurve
  mapping(address => bool) public isBondingCurveApprove;

  //@param factoryApprove: approve of factory
  mapping(address => bool) public isFactoryApprove;

  //@param supporterApprove: approve of supporter
  mapping(address => bool) public isSupporterApprove;

  //@param totalSupportFeeList: list of total fee of support
  mapping(address => uint256) public supporterFee;

  //@param collectionPoolList: list pool of collection
  mapping(address => CollectionPoolList) private collectionPoolList;

  //@param userStakePoolList: list pool of user Staking
  mapping(address => UserStakePoolList) private userStakePoolList;

  //@param CollectionPoolList: pool list of collection
  struct CollectionPoolList {
    address[] otherStakePools;
    address[] nonOtherStakePools;
  }

  //@param UserStakePoolList: pool list of stake
  struct UserStakePoolList {
    address[] stakeFTpools;
    address[] stakeNFTpools;
  }

  struct input {
    uint256[] tokenIds;
  }

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

  modifier onlyFactory() {
    require(isFactoryApprove[msg.sender] == true, 'Only Factory');
    _;
  }

  //MAIN
  //@notice stake of nft
  function stakeNFT(address _pool, uint256[] calldata _tokenIds) public {
    bool _tmpBool = _checkArray(
      userStakePoolList[msg.sender].stakeNFTpools,
      _pool
    );
    if (_tmpBool == false) {
      userStakePoolList[msg.sender].stakeNFTpools.push(_pool);
    }
    IPool721(_pool).stakeNFT(_tokenIds, msg.sender);
    emit StakeNFT(msg.sender, _pool, _tokenIds.length, _tokenIds);
  }

  function batchStakeNFT(
    address[] calldata _poolList,
    input[] calldata InputArray
  ) external {
    for (uint256 i = 0; i < _poolList.length; ) {
      IPool721(_poolList[i]).stakeNFT(InputArray[i].tokenIds, msg.sender);
      emit StakeNFT(
        msg.sender,
        _poolList[i],
        InputArray[i].tokenIds.length,
        InputArray[i].tokenIds
      );
      unchecked {
        ++i;
      }
    }
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
      _poolInfo.spotPrice
    );

    uint256 profitAmount = IPool721(_pool).swapNFTforFT(
      _tokenIds,
      _minExpectFee,
      msg.sender
    );
    _updateFee(_support, profitAmount);
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
      _poolInfo.spotPrice
    );

    uint256 profitAmount = IPool721(_pool).swapFTforNFT{value: msg.value}(
      _tokenIds,
      msg.sender
    );
    _updateFee(_support, profitAmount);
    emit SwapFTforNFT(msg.sender, _pool, _tokenIds, _totalFee, _support);
  }

  //@notice batchSwapNFTforFT
  function batchSwapNFTforFT(
    address[] calldata _poolList,
    input[] calldata InputArray,
    uint256[] calldata _minExpects,
    address _supporter
  ) external payable {
    uint256 totalProfitAmount;
    for (uint256 i = 0; i < _poolList.length; ) {
      uint256 profitAmount = IPool721(_poolList[i]).swapNFTforFT(
        InputArray[i].tokenIds,
        _minExpects[i],
        msg.sender
      );
      totalProfitAmount += profitAmount;
      emit SwapNFTforFT(
        msg.sender,
        _poolList[i],
        InputArray[i].tokenIds,
        profitAmount,
        _supporter
      );
      unchecked {
        ++i;
      }
    }
    _updateFee(_supporter, totalProfitAmount);
  }

  //@notice batchSwapFTforNFT
  function batchSwapFTforNFT(
    address[] calldata _poolList,
    input[] calldata InputArray,
    address _supporter
  ) external payable {
    uint256 totalProfitAmount;
    uint256 _remainFee = msg.value;
    for (uint256 i = 0; i < _poolList.length; ) {
      IPool721.PoolInfo memory _poolInfo = IPool721(_poolList[i]).getPoolInfo();
      uint256 _totalFee = IPool721(_poolList[i]).getCalcBuyInfo(
        InputArray[i].tokenIds.length,
        _poolInfo.spotPrice
      );
      require(_remainFee >= _totalFee, 'Not Value');
      uint256 profitAmount = IPool721(_poolList[i]).swapFTforNFT{
        value: _totalFee
      }(InputArray[i].tokenIds, msg.sender);
      totalProfitAmount += profitAmount;
      _remainFee -= _totalFee;
      emit SwapFTforNFT(
        msg.sender,
        _poolList[i],
        InputArray[i].tokenIds,
        profitAmount,
        _supporter
      );
      unchecked {
        ++i;
      }
    }
    _updateFee(_supporter, totalProfitAmount);
  }

  //@notice withdraw NFT and Fee
  function withdrawNFT(address _pool, uint256[] calldata _tokenIds) public {
    address _collection = IPool721(_pool).collection();
    IPool721.UserInfo memory _userInfo = IPool721(_pool).getUserInfo(
      msg.sender
    );
    uint256 _userFee = IPool721(_pool).getUserStakeNFTfee(msg.sender);
    _removeAddress(userStakePoolList[msg.sender].stakeNFTpools, _pool);

    IPool721(_pool).withdrawNFT(_tokenIds, msg.sender);

    (bool _tmpBool, bool _isOtherStake) = _checkPool(_pool);
    if (_tmpBool == true) {
      if (_isOtherStake == true) {
        _removeAddress(collectionPoolList[_collection].otherStakePools, _pool);
      } else if (_isOtherStake == false) {
        _removeAddress(
          collectionPoolList[_collection].nonOtherStakePools,
          _pool
        );
      }
    }
    emit WithdrawNFT(
      msg.sender,
      _pool,
      _tokenIds,
      _userInfo.userInitBuyNum,
      _userFee
    );
  }

  //@notice withdraw protocol fee
  function withdrawProtocolFee() public payable onlyOwner {
    uint256 _protocolFee = totalProtocolFee;
    //check
    require(totalProtocolFee > 0, 'Not Fee');
    require(_protocolFee > 0, 'Not Fee');

    //effect
    totalProtocolFee = 0;

    //intaraction
    payable(msg.sender).transfer(_protocolFee);
  }

  //@notice withdraw support fee
  function withdrawSupportFee() external payable {
    uint256 _supporterFee = supporterFee[msg.sender];
    //check
    require(isSupporterApprove[msg.sender], 'Not Approve');
    require(_supporterFee > 0, 'Not Fee');

    //effect
    supporterFee[msg.sender] = 0;

    //intaraction
    payable(msg.sender).transfer(_supporterFee);
  }

  //GET
  //@notice get list of collection
  function getCollectionList() external view returns (address[] memory) {
    return collectionList;
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

  //@notice get approve of bonding curve
  function getIsFactoryApprove(address _factory) external view returns (bool) {
    return isFactoryApprove[_factory];
  }

  //@notice get approve of bonding curve
  function getIsSupporterApprove(address _supporter)
    external
    view
    returns (bool)
  {
    return isSupporterApprove[_supporter];
  }

  //@notice get list of collection pool
  function getCollectionPoolList(address _collection)
    external
    view
    returns (CollectionPoolList memory)
  {
    return collectionPoolList[_collection];
  }

  function getUserStakePoolList(address _user)
    external
    view
    returns (UserStakePoolList memory)
  {
    return userStakePoolList[_user];
  }

  //SET
  //@notice approve for bonding curve
  function setCollectionApprove(address _collection, bool _approve)
    public
    onlyOwner
  {
    if (_approve == true) {
      collectionList.push(_collection);
      isCollectionApprove[_collection] = _approve;
    } else if (_approve == false) {
      _removeAddress(collectionList, _collection);
      isCollectionApprove[_collection] = _approve;
    }
  }

  //@notice approve for bonding curve
  function setBondingCurveApprove(address _bondingCurve, bool _approve)
    external
    onlyOwner
  {
    isBondingCurveApprove[_bondingCurve] = _approve;
  }

  //@notice approve for bonding curve
  function setFactoryApprove(address _factory, bool _approve)
    external
    onlyOwner
  {
    isFactoryApprove[_factory] = _approve;
  }

  //@notice approve for bonding curve
  function setSupporterApprove(address _supporter, bool _approve)
    external
    onlyOwner
  {
    isSupporterApprove[_supporter] = _approve;
  }

  //@notice approve for bonding curve
  function addOtherStakePool(address _pool) external onlyFactory {
    address _collection = IPool721(_pool).collection();
    collectionPoolList[_collection].otherStakePools.push(_pool);
  }

  //@notice approve for bonding curve
  function addNonOtherStakePool(address _pool) external onlyFactory {
    address _collection = IPool721(_pool).collection();
    collectionPoolList[_collection].nonOtherStakePools.push(_pool);
  }

  //INTERNAL
  function _checkPool(address _pool)
    internal
    returns (bool _tmpBool, bool _isOtherStake)
  {
    IPool721.PoolInfo memory poolInfo = IPool721(_pool).getPoolInfo();
    _isOtherStake = IPool721(_pool).isOtherStake();
    _tmpBool = false;
    if (poolInfo.buyNum == 0 && poolInfo.sellNum == 0) {
      _tmpBool = true;
    }
  }

  //@notice check array
  function _checkArray(address[] memory _array, address _target)
    internal
    pure
    returns (bool _tmpBool)
  {
    uint256 _arrayNum = _array.length;
    _tmpBool = false;
    for (uint256 i = 0; i < _arrayNum; ) {
      if (_array[i] == _target) {
        _tmpBool = true;
      }
    }
    return _tmpBool;
  }

  //@notice calc update fee
  function _updateFee(address _supporter, uint256 _profitAmount) internal {
    if (_supporter != address(0)) {
      uint256 _supporterFee = _profitAmount.fmul(
        supporterFeeRatio,
        FixedPointMathLib.WAD
      );
      uint256 _protocolFee = _profitAmount - _supporterFee;
      totalProtocolFee += _protocolFee;
      supporterFee[_supporter] += _supporterFee;
    } else if (_supporter == address(0)) {
      totalProtocolFee += _profitAmount;
    }
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

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
