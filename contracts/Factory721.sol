// SPDX-License-Identifier: None
pragma solidity =0.8.17;
import 'hardhat/console.sol';

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './Pool721.sol';
import './interfaces/IRouter.sol';

contract Factory721 is Ownable {
  //STORAGE
  //@param routerAddress: address of router
  address public router;

  //@param routerFeeRatio: fee ratio of router
  uint256 public routerFeeRatio = 0.15e18;

  //EVENT
  event CreatePool(address indexed pool, address indexed collection);

  constructor(address _router, uint256 _routerFeeRatio) {
    router = _router;
    routerFeeRatio = _routerFeeRatio;
  }

  //MAIN
  //@notice create pool
  function createPool(
    address _collection,
    address _bondingCurve,
    uint128 _spotPrice,
    uint128 _delta,
    uint256 _spread
  ) external {
    require(
      IERC165(_collection).supportsInterface(type(IERC721).interfaceId),
      'OnlyERC721'
    );
    require(IRouter(router).getIsCollectionApprove(_collection) == true);
    require(IRouter(router).getIsBondingCurveApprove(_bondingCurve) == true);

    address _pool = address(
      new Pool721(
        _collection,
        _bondingCurve,
        _spotPrice,
        _delta,
        _spread,
        routerFeeRatio,
        router
      )
    );

    IRouter(router).addOtherStakePool(_pool);
    emit CreatePool(_pool, _collection);
  }

  //SET
  function setRouterAddress(address _newRouter) public onlyOwner {
    router = _newRouter;
  }

  function setRouterFeeRatio(uint256 _newRouterFeeRatio) public onlyOwner {
    routerFeeRatio = _newRouterFeeRatio;
  }
}
