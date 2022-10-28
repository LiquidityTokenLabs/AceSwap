// SPDX-License-Identifier: None
pragma solidity =0.8.17;
import '../bonding-curves/CurveErrorCode.sol';

interface IRouter {
  function getIsCollectionApprove(address collection)
    external
    view
    returns (bool);

  function getIsBondingCurveApprove(address bondingCurve)
    external
    view
    returns (bool);

  function addOtherStakePool(address pool) external;
}
