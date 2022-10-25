// SPDX-License-Identifier: None
pragma solidity =0.8.17;

interface IPool721 {
  //VARIABLE
  function protocolFeeRatio() external returns (uint256);

  function collection() external returns (address);

  function router() external returns (address);

  function sellEventNum() external returns (uint256);

  function buyEventNum() external returns (uint256);

  function totalFTpoint() external returns (uint256);

  function totalNFTpoint() external returns (uint256);

  function stakeFTprice() external returns (uint128);

  function stakeNFTprice() external returns (uint128);

  function totalFTfee() external returns (uint256);

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
    address bondingCurve;
    uint128 spotPrice;
    uint128 delta;
    uint256 divergence;
    uint256 buyNum;
    uint256 sellNum;
  }

  //EVENT
  event StakeNFT(address user, uint256[] tokenIds);
  event SwapNFTforFT(address user, uint256[] tokenIds, uint256 totalFee);
  event SwapFTforNFT(address user, uint256[] tokenIds);
  event WithdrawNFTandFee(address user, uint256[] tokenIds, uint256 userFee);
  event WithdrawNFTandFTandFee(
    address user,
    uint256[] tokenIds,
    uint256 userFee
  );
  event WithdrawFTandFee(address user, uint256 userSellAmount, uint256 userFee);
  event WithdrawFTandNFTandFee(
    address user,
    uint256 userSellAmount,
    uint256[] tokenIds,
    uint256 userFee
  );

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
    payable;

  function withdrawFT(
    uint256 userSellNum,
    uint256[] calldata tokenIds,
    address user
  ) external payable;

  //GET
  function getPoolInfo() external returns (PoolInfo calldata poolInfo);

  function getUserInfo(address user)
    external
    returns (UserInfo calldata userInfo);

  function getCalcBuyInfo(
    uint256 itemNum,
    uint128 spotPrice,
    uint256 divergence
  ) external view returns (uint256);

  function getCalcSellInfo(
    uint256 itemNum,
    uint128 spotPrice,
    uint256 divergence
  ) external view returns (uint256);

  function getUserStakeNFTfee(address user)
    external
    view
    returns (uint256 userFee);

  function getUserStakeFTfee(address user)
    external
    view
    returns (uint256 userFee);

  //SET
  function setRouterAddress(address newRouter) external;
}
