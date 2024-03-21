// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

interface IWBTC {
  function totalSupply() external view returns (uint256);
  function balanceOf(address _who) external view returns (uint256);
  function transfer(address _to, uint256 _value) external returns (bool);
  function transferFrom(address from_, address _to, uint256 _value) external returns (bool);
}
