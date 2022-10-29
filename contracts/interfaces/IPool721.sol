// SPDX-License-Identifier: None
pragma solidity =0.8.17;

interface IPool721 {
  //VARIABLE
  function protocolFeeRatio() external returns (uint256);

  function collection() external returns (address);

  function bondingCurve() external returns (address);

  function isOtherStake() external returns (bool);

  function router() external returns (address);

  function sellEventNum() external returns (uint256);

  function buyEventNum() external returns (uint256);

  function totalNFTpoint() external returns (uint256);

  function stakeNFTprice() external returns (uint128);

  function totalNFTfee() external returns (uint256);

  //STRUCT
  struct UserInfo {
    uint256 userInitBuyNum;
    uint256 userInitSellNum;
    uint256 userInitSellAmount;
    uint256 userNFTpoint;
    uint256 userFTpoint;
  }

  struct PoolInfo {
    uint128 spotPrice;
    uint128 delta;
    uint256 divergence;
    uint256 buyNum;
    uint256 sellNum;
  }

  //MAIN
  function stakeNFT(uint256[] calldata tokenIds, address user) external;

  function swapNFTforFT(
    uint256[] calldata tokenIds,
    uint256 minExpectFee,
    address user
  ) external payable returns (uint256 protocolFee);

  function swapFTforNFT(uint256[] calldata tokenIds, address user)
    external
    payable
    returns (uint256 protocolFee);

  function withdrawNFT(uint256[] calldata tokenIds, address user)
    external
    payable
    returns (uint256 userFee);

  //GET
  function getAllHoldIds() external view returns (uint256[] memory);

  function getPoolInfo() external returns (PoolInfo calldata poolInfo);

  function getUserInfo(address user)
    external
    returns (UserInfo calldata userInfo);

  function getCalcBuyInfo(uint256 itemNum, uint128 spotPrice)
    external
    view
    returns (uint256);

  function getCalcSellInfo(uint256 itemNum, uint128 spotPrice)
    external
    view
    returns (uint256);

  function getUserStakeNFTfee(address user)
    external
    view
    returns (uint256 userFee);

  //SET
  function setRouter(address _newRouter) external;
}
