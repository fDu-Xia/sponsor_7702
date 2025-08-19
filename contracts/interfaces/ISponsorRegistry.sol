// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISponsorRegistry
 * @dev 赞助商注册接口
 */
interface ISponsorRegistry {
    struct Task {
        uint256 id;
        string description;  // 任务描述，比如 "发推特推广我们的产品"
        uint256 reward;      // 奖励金额（可选）
        bool active;         // 任务是否激活
        uint256 maxCompletions; // 最大完成次数
        uint256 completions;    // 已完成次数
    }

    struct SponsorInfo {
        bool registered;
        string name;
        uint256 totalSponsored;  // 总赞助金额
        uint256 balance;         // 当前余额（用于支付 Gas）
        uint256[] taskIds;       // 该赞助商的任务列表
    }

    function isSponsor(address sponsor) external view returns (bool);
    function getSponsorInfo(address sponsor) external view returns (SponsorInfo memory);
    function hasCompletedTask(address user, address sponsor, uint256 taskId) external view returns (bool);
}