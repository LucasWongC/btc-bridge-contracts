// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {Sig} from "../libraries/Structs.sol";

interface IBTCBridge {
  function deposit(bytes32 key, uint256 amount, Sig calldata sig) external;

  event Deposit(bytes32 indexed key, address from);
  event Withdraw(bytes32 indexed key, address to);
}
