// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20}   from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HelloWallToken is ERC20, Ownable {
    constructor(address owner_, uint256 initialSupply)
        ERC20("Hello Wall", "HWALL")
        Ownable(owner_)
    {
        _mint(owner_, initialSupply); // e.g., 1_000_000_000 * 1e18
    }
}
