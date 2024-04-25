// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWBTC is ERC20 {
  constructor() ERC20("Wrapped BTC", "WBTC") {
    _mint(msg.sender, 100_000_000_000);
  }

  function decimals() public pure override returns (uint8) {
    return 8;
  }

  function balanceOf(address account) public view override returns (uint256) {
    return super.balanceOf(account);
  }

  function totalSupply() public view override returns (uint256) {
    return super.totalSupply();
  }

  function transfer(address to, uint256 value) public override returns (bool) {
    return super.transfer(to, value);
  }

  function transferFrom(address from, address to, uint256 value) public override returns (bool) {
    return super.transferFrom(from, to, value);
  }
}
