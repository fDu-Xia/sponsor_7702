// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISponsorRegistry.sol";

/**
 * @title BatchCallSponsor
 * @dev EIP-7702 批量调用和赞助合约
 */
contract BatchCallSponsor is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    ISponsorRegistry public immutable sponsorRegistry;
    uint256 public nonce;

    // 用户选择的赞助商：user => sponsor
    mapping(address => address) public userSelectedSponsor;

    // 赞助商的 relayer 地址：sponsor => relayer
    mapping(address => address) public sponsorRelayers;

    event BatchExecuted(uint256 indexed nonce, Call[] calls);
    event CallExecuted(address indexed executor, address indexed to, uint256 value, bytes data);
    event SponsorSelected(address indexed user, address indexed sponsor);
    event RelayerSet(address indexed sponsor, address indexed relayer);
    event SponsoredExecution(address indexed sponsor, address indexed user, uint256 gasUsed);

    constructor(address _sponsorRegistry) {
        sponsorRegistry = ISponsorRegistry(_sponsorRegistry);
    }

    /**
     * @dev 设置 relayer 地址（由赞助商调用）
     */
    function setRelayer(address relayer) external {
        require(sponsorRegistry.isSponsor(msg.sender), "Not a sponsor");
        sponsorRelayers[msg.sender] = relayer;
        emit RelayerSet(msg.sender, relayer);
    }

    /**
     * @dev 用户选择赞助商
     */
    function selectSponsor(address sponsor, uint256 taskId) external {
        require(sponsorRegistry.isSponsor(sponsor), "Invalid sponsor");
        require(sponsorRegistry.hasCompletedTask(msg.sender, sponsor, taskId), "Task not completed");

        userSelectedSponsor[msg.sender] = sponsor;
        emit SponsorSelected(msg.sender, sponsor);
    }

    /**
     * @dev 自执行（用户有 ETH 的情况）
     */
    function execute(Call[] calldata calls) external payable nonReentrant {
        require(msg.sender == address(this), "Invalid authority");
        _executeBatch(calls, msg.sender);
    }

    /**
     * @dev 赞助执行（用户无 ETH，由赞助商代付）
     */
    function executeSponsored(
        Call[] calldata calls,
        bytes calldata signature,
        address user
    ) external payable nonReentrant {
        // 验证调用者是否是赞助商的 relayer
        address sponsor = userSelectedSponsor[user];
        require(sponsor != address(0), "No sponsor selected");
        require(sponsorRelayers[sponsor] == msg.sender, "Not authorized relayer");

        // 验证签名
        bytes memory encodedCalls = _encodeCalls(calls);
        bytes32 digest = keccak256(abi.encodePacked(nonce, user, encodedCalls));
        bytes32 ethSignedMessageHash = digest.toEthSignedMessageHash();

        address recovered = ethSignedMessageHash.recover(signature);
        require(recovered == user, "Invalid signature");

        uint256 gasStart = gasleft();
        _executeBatch(calls, user);
        uint256 gasUsed = gasStart - gasleft();

        emit SponsoredExecution(sponsor, user, gasUsed);
    }

    /**
     * @dev 执行批量调用
     */
    function _executeBatch(Call[] calldata calls, address executor) internal {
        uint256 currentNonce = nonce++;

        for (uint256 i = 0; i < calls.length; i++) {
            _executeCall(calls[i], executor);
        }

        emit BatchExecuted(currentNonce, calls);
    }

    /**
     * @dev 执行单个调用
     */
    function _executeCall(Call calldata call, address executor) internal {
        (bool success, bytes memory result) = call.to.call{value: call.value}(call.data);

        if (!success) {
            // 如果有返回数据，尝试解码错误信息
            if (result.length > 0) {
                assembly {
                    revert(add(32, result), mload(result))
                }
            } else {
                revert("Call failed");
            }
        }

        emit CallExecuted(executor, call.to, call.value, call.data);
    }

    /**
     * @dev 编码调用数据
     */
    function _encodeCalls(Call[] calldata calls) internal pure returns (bytes memory) {
        bytes memory encoded;
        for (uint256 i = 0; i < calls.length; i++) {
            encoded = abi.encodePacked(
                encoded,
                calls[i].to,
                calls[i].value,
                calls[i].data
            );
        }
        return encoded;
    }

    /**
     * @dev 获取用户的赞助商
     */
    function getUserSponsor(address user) external view returns (address) {
        return userSelectedSponsor[user];
    }

    /**
     * @dev 允许接收 ETH
     */
    receive() external payable {}
}