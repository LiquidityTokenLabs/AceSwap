// SPDX-License-Identifier: AGPL-3.0
pragma solidity =0.8.17;

library FixedPointMathLib {
  uint256 internal constant WAD = 1e18;

  function fmul(
    uint256 x,
    uint256 y,
    uint256 baseUnit
  ) internal pure returns (uint256 z) {
    assembly {
      // Store x * y in z for now.
      z := mul(x, y)

      // Equivalent to require(x == 0 || (x * y) / x == y)
      if iszero(or(iszero(x), eq(div(z, x), y))) {
        revert(0, 0)
      }

      // If baseUnit is zero this will return zero instead of reverting.
      z := div(z, baseUnit)
    }
  }

  function fdiv(
    uint256 x,
    uint256 y,
    uint256 baseUnit
  ) internal pure returns (uint256 z) {
    assembly {
      // Store x * baseUnit in z for now.
      z := mul(x, baseUnit)

      if or(
        // Revert if y is zero to ensure we don't divide by zero below.
        iszero(y),
        // Equivalent to require(x == 0 || (x * baseUnit) / x == baseUnit)
        iszero(or(iszero(x), eq(div(z, x), baseUnit)))
      ) {
        revert(0, 0)
      }

      // We ensure y is not zero above, so there is never division by zero here.
      z := div(z, y)
    }
  }

  function fpow(
    uint256 x,
    uint256 n,
    uint256 baseUnit
  ) internal pure returns (uint256 z) {
    assembly {
      switch x
      case 0 {
        switch n
        case 0 {
          z := baseUnit
        }
        default {
          z := 0
        }
      }
      default {
        switch mod(n, 2)
        case 0 {
          z := baseUnit
        }
        default {
          z := x
        }
        let half := div(baseUnit, 2)
        for {
          n := div(n, 2)
        } n {
          n := div(n, 2)
        } {
          let xx := mul(x, x)
          if iszero(eq(div(xx, x), x)) {
            revert(0, 0)
          }
          let xxRound := add(xx, half)
          if lt(xxRound, xx) {
            revert(0, 0)
          }
          x := div(xxRound, baseUnit)
          if mod(n, 2) {
            let zx := mul(z, x)
            if and(iszero(iszero(x)), iszero(eq(div(zx, x), z))) {
              revert(0, 0)
            }
            let zxRound := add(zx, half)
            if lt(zxRound, zx) {
              revert(0, 0)
            }
            z := div(zxRound, baseUnit)
          }
        }
      }
    }
  }
}
