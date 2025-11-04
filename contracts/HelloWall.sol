// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HelloWall is Ownable {
    IERC20 public immutable hwallet;
    uint256 public minTokensToPost;     // e.g. 100e18 (100 HWALL if 18 decimals)
    uint16  public feeBps;              // 50 = 0.50%
    address public treasury;

    event Follow(address indexed follower, address indexed target, bool notify);
    event Post(address indexed author, uint256 indexed id, string contentCid, uint256 feePaid);
    event Comment(address indexed author, uint256 indexed postId, uint256 indexed id, string contentCid, uint256 feePaid);
    event SettingsChanged(uint256 minTokensToPost, uint16 feeBps, address treasury);

    uint256 private _postId;
    uint256 private _commentId;

    constructor(address _token, uint256 _minTok, uint16 _feeBps, address _treasury, address _owner)
        Ownable(_owner)
    {
        require(_token != address(0) && _treasury != address(0) && _owner != address(0), "bad addr");
        require(_feeBps <= 10_000, "bps>100%");
        hwallet = IERC20(_token);
        minTokensToPost = _minTok;
        feeBps = _feeBps;
        treasury = _treasury;
        emit SettingsChanged(_minTok, _feeBps, _treasury);
    }

    // — Admin
    function setRules(uint256 _minTok, uint16 _feeBps, address _treasury) external onlyOwner {
        require(_feeBps <= 10_000, "bps>100%");
        require(_treasury != address(0), "treasury=0");
        minTokensToPost = _minTok;
        feeBps = _feeBps;
        treasury = _treasury;
        emit SettingsChanged(_minTok, _feeBps, _treasury);
    }

    // — Social
    function follow(address target, bool notify) external {
        require(target != address(0) && target != msg.sender, "bad target");
        emit Follow(msg.sender, target, notify);
    }

    // — Content (CID = IPFS/Arweave reference). Token-gated.
    function post(string calldata contentCid) external returns (uint256 id) {
        _checkGate();
        uint256 fee = _collectFee();
        id = ++_postId;
        emit Post(msg.sender, id, contentCid, fee);
    }

    function comment(uint256 postId, string calldata contentCid) external returns (uint256 id) {
        _checkGate();
        uint256 fee = _collectFee();
        id = ++_commentId;
        emit Comment(msg.sender, postId, id, contentCid, fee);
    }

    // — Internals
    function _checkGate() internal view {
        require(hwallet.balanceOf(msg.sender) >= minTokensToPost, "NEED_TOKENS");
    }

    function _collectFee() internal returns (uint256 fee) {
        // Launch with feeBps = 0 for smooth UX.
        // (If you want HWALL-based fees later, we’ll add transferFrom here.)
        return 0;
    }
}

