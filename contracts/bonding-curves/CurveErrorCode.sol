// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.16;

contract CurveErrorCodes {
  //@notice OK: No Error
  //@notice INVALID_NUMITEMS: The numItem value is 0
  //@notice SPOT_PRICE_OVERFLOW: The updated spot price doesn't fit into 128 bits
  enum Error {
    OK,
    INVALID_NUMITEMS,
    SPOT_PRICE_OVERFLOW
  }
}
