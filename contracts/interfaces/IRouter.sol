// SPDX-License-Identifier: None
pragma solidity =0.8.16;
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

  function addCollectionPoolList(address collection, address pool) external;
}
