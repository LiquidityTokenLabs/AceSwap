// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.16;
import './CurveErrorCode.sol';
import '../lib/FixedPointMathLib.sol';
import 'hardhat/console.sol';

contract LinearCurve is CurveErrorCodes {
  using FixedPointMathLib for uint256;

  function getBuyInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 divergence,
    uint256 numItems
  )
    external
    pure
    returns (
      Error error,
      uint128 newSpotPrice,
      uint128 newDelta,
      uint256 newDivergence,
      uint256 totalFee
    )
  {
    //error handling
    if (numItems == 0) {
      return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);
    }

    uint256 newSpotPrice_ = spotPrice + delta * numItems;

    //error handling
    if (newSpotPrice_ > type(uint128).max) {
      return (Error.SPOT_PRICE_OVERFLOW, 0, 0, 0, 0);
    }

    newSpotPrice = uint128(newSpotPrice_);

    newDelta = delta;

    newDivergence = divergence;

    totalFee = numItems * spotPrice + (numItems * (numItems - 1) * delta) / 2;

    error = Error.OK;
  }

  function getSellInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 divergence,
    uint256 numItems
  )
    external
    pure
    returns (
      Error error,
      uint128 newSpotPrice,
      uint128 newDelta,
      uint256 newDivergence,
      uint256 totalFee
    )
  {
    //error handling
    if (numItems == 0) {
      return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);
    }

    uint256 totalPriceDecrease = delta * numItems;

    //error handling
    if (spotPrice < totalPriceDecrease) {
      newSpotPrice = 0;

      uint256 numItemsTillZeroPrice = spotPrice / delta + 1;
      numItems = numItemsTillZeroPrice;
    } else {
      newSpotPrice = spotPrice - uint128(totalPriceDecrease);
    }

    newDelta = delta;

    newDivergence = divergence;

    uint256 tmpTotalFee = numItems *
      (spotPrice - delta) -
      (numItems * (numItems - 1) * delta) /
      2;
    totalFee = tmpTotalFee.fmul(divergence, FixedPointMathLib.WAD);

    error = Error.OK;
  }

  function getBuyFeeInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 divergence,
    uint256 numItems
  ) external pure returns (Error error, uint256 totalFee) {
    uint256 a = numItems *
      (spotPrice - delta) -
      (numItems * (numItems - 1) * delta) /
      2;
    totalFee = a.fmul(
      (FixedPointMathLib.WAD - divergence),
      FixedPointMathLib.WAD
    );

    error = Error.OK;
  }

  function getSellFeeInfo(
    uint128 spotPrice,
    uint128 delta,
    uint256 divergence,
    uint256 numItems
  ) external pure returns (Error error, uint256 totalFee) {
    uint256 total = (numItems / 2) * (2 * spotPrice + (numItems - 1) * delta);
    totalFee = total.fmul(
      (FixedPointMathLib.WAD - divergence),
      FixedPointMathLib.WAD
    );

    error = Error.OK;
  }
}
