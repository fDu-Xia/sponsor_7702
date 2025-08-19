// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISponsorRegistry.sol";

/**
 * @title BatchCallSponsor
 * @dev EIP-7702 批量调用和赞助合约
 */
contract BatchCallSponsor is ReentrancyGuard {

    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    ISponsorRegistry public immutable sponsorRegistry;
    uint256 public nonce;

    // 用户选择的赞助商：user => sponsor
    mapping(address => address) public userSelectedSponsor;

    event BatchExecuted(uint256 indexed nonce, Call[] calls);
    event CallExecuted(address indexed executor, address indexed to, uint256 value, bytes data);
    event SponsorSelected(address indexed user, address indexed sponsor);
    event SponsoredExecution(address indexed sponsor, address indexed user, uint256 gasUsed);

    constructor(address _sponsorRegistry) {
        sponsorRegistry = ISponsorRegistry(_sponsorRegistry);
    }

    /**
     * @dev 用户选择赞助商
     */
    function selectSponsor(address sponsor) external {
        require(sponsorRegistry.isSponsor(sponsor), "Invalid sponsor");
        require(sponsorRegistry.hasCompletedAllTasks(msg.sender, sponsor), "Not all tasks completed");

        userSelectedSponsor[msg.sender] = sponsor;
        emit SponsorSelected(msg.sender, sponsor);
    }

    function execute(Call[] calldata calls) external payable nonReentrant {
        require(msg.sender == address(this), "Invalid authority");
        _executeBatch(calls, msg.sender);
    }

    function executeSponsored(Call[] calldata calls) external payable nonReentrant {
        require(msg.sender == address(this), "Invalid authority");
        
        address user = address(this); // 当前合约地址就是用户的地址（EIP-7702）
        address sponsor = userSelectedSponsor[user];
        require(sponsor != address(0), "No sponsor selected");
        
        // 验证用户是否完成了赞助商的所有任务
        require(sponsorRegistry.hasCompletedAllTasks(user, sponsor), "Not all tasks completed");
        
        // 验证所有调用的合约地址都在赞助商的批准名单中
        for (uint256 i = 0; i < calls.length; i++) {
            require(sponsorRegistry.isContractApproved(sponsor, calls[i].to), "Contract not approved by sponsor");
        }

        uint256 gasStart = gasleft();
        _executeBatch(calls, user);
        uint256 gasUsed = gasStart - gasleft();

        // 调用 sponsorGas 完成赞助，估算一个合理的 gas 费用
        uint256 gasAmount = gasUsed * tx.gasprice;
        sponsorRegistry.sponsorGas(sponsor, user, gasAmount);

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