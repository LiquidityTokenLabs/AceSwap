// SPDX-License-Identifier: None
pragma solidity =0.8.17;
import '../bonding-curves/CurveErrorCode.sol';

interface ICurve {
  function getBuyInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 spread,
    uint256 numItems
  )
    external
    pure
    returns (
      CurveErrorCodes.Error error,
      uint128 newSpotPrice,
      uint128 newDelta,
      uint256 newDivergence,
      uint256 totalFee
    );

  function getSellInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 spread,
    uint256 numItems
  )
    external
    pure
    returns (
      CurveErrorCodes.Error error,
      uint128 newSpotPrice,
      uint128 newDelta,
      uint256 newDivergence,
      uint256 totalFee
    );

  function getBuyFeeInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 spread,
    uint256 numItems
  ) external pure returns (CurveErrorCodes.Error error, uint256 totalFee);

  function getSellFeeInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 spread,
    uint256 numItems
  ) external view returns (CurveErrorCodes.Error error, uint256 totalFee);
}
