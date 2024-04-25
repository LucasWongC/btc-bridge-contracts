// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  uint8 private immutable DECIMALS;
  constructor(string memory name, string memory symbol, uint8 _decimals) ERC20(name, symbol) {
    DECIMALS = _decimals;
  }

  function decimals() public view override returns (uint8) {
    return DECIMALS;
  }

  function mint(uint256 _amount) external {
    _mint(msg.sender, _amount);
  }
}
