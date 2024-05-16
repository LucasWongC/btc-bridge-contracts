// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Sig} from "./libraries/Structs.sol";

/**
 * @title Bridge contract
 *        bridges to another networks
 */
contract Bridge is AccessControl, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using Address for address payable;

  uint256 public chainId;
  mapping(bytes32 => bool) private used;

  /// @dev roles
  bytes32 public constant ADMIN_ROLE = keccak256("Admin");
  bytes32 public constant KEEPER_ROLE = keccak256("Keeper");

  event Deposit(bytes32 indexed key, address indexed token, uint256 amount);
  event Withdraw(bytes32 indexed key, address indexed token, uint256 amount);

  error InvalidParams();
  error InvalidAmount();

  /**
   * @dev initialize bridge
   * @param _admin admin address of bridge
   */
  constructor(address _admin) {
    uint _chainId;
    assembly {
      _chainId := chainid()
    }
    chainId = _chainId;

    _setRoleAdmin(KEEPER_ROLE, ADMIN_ROLE);
    _grantRole(ADMIN_ROLE, _admin);
  }

  /**
   * @dev deposit token to bridge. Users call this function
   * @param _key transaction key
   * @param _token deposit token
   * @param _amount token amount to bridge
   * @param _sig signature of keeper
   */
  function deposit(
    bytes32 _key,
    address _token,
    uint256 _amount,
    Sig calldata _sig
  ) external payable {
    require(!used[_key], "Key already used");
    if (!_checkDeposit(msg.sender, _key, _token, _amount, _sig)) {
      revert InvalidParams();
    }

    if (_token == address(0)) {
      if (msg.value != _amount) {
        revert InvalidAmount();
      }
    } else {
      IERC20(_token).safeTransferFrom(_msgSender(), address(this), _amount);
    }

    emit Deposit(_key, _token, _amount);
  }

  /**
   * @dev send token to user. Keepers call this function to send btc to users
   * @param _key transaction key
   * @param _to address of user
   * @param _token token to withdraw
   * @param _amount token amount to send
   */
  function withdraw(
    bytes32 _key,
    address _to,
    address _token,
    uint256 _amount
  ) external nonReentrant onlyRole(KEEPER_ROLE) {
    if (_token == address(0)) {
      payable(_to).sendValue(_amount);
    } else {
      IERC20(_token).safeTransfer(_to, _amount);
    }

    emit Withdraw(_key, _token, _amount);
  }

  /// @dev checks keeper signature
  function _checkDeposit(
    address _sender,
    bytes32 _key,
    address _token,
    uint256 _amount,
    Sig calldata _sig
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(abi.encodePacked(_sender, _key, _token, _amount, chainId));

    bytes32 ethSignedMessageHash = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );

    address signer = ecrecover(ethSignedMessageHash, _sig.v, _sig.r, _sig.s);

    return hasRole(KEEPER_ROLE, signer);
  }

  /// @dev owner can withdraw tokens of contract
  function addPool(address _token, uint256 _amount) external payable onlyRole(ADMIN_ROLE) {
    if (_token == address(0)) {
      if (msg.value != _amount) {
        revert InvalidAmount();
      }
    } else {
      IERC20(_token).safeTransferFrom(_msgSender(), address(this), _amount);
    }

    emit Deposit(bytes32(0), _token, _amount);
  }

  function withdrawPool(
    address _token,
    address _to,
    uint256 _amount
  ) external onlyRole(ADMIN_ROLE) {
    if (_token == address(0)) {
      payable(_to).sendValue(_amount);
    } else {
      IERC20(_token).safeTransfer(_to, _amount);
    }

    emit Withdraw(bytes32(0), _token, _amount);
  }

  /// @dev revert eth deposit and another calls
  fallback() external payable {
    revert("Invalid transfer");
  }

  receive() external payable {
    revert("Invalid transfer");
  }
}
