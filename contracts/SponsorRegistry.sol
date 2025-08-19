// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISponsorRegistry.sol";

/**
 * @title SponsorRegistry
 * @dev 管理赞助商注册和任务系统
 */
contract SponsorRegistry is ISponsorRegistry, Ownable, ReentrancyGuard {
    // 赞助商映射
    mapping(address => SponsorInfo) public sponsors;

    // 任务映射：sponsor => taskId => Task
    mapping(address => mapping(uint256 => Task)) public sponsorTasks;

    // 用户任务完成状态：user => sponsor => taskId => completed
    mapping(address => mapping(address => mapping(uint256 => bool))) public taskCompletions;

    // 用户与赞助商的关系：user => sponsor[]
    mapping(address => address[]) public userSponsors;

    // 任务计数器
    mapping(address => uint256) public taskCounter;

    event SponsorRegistered(address indexed sponsor, string name);
    event SponsorDeposited(address indexed sponsor, uint256 amount);
    event TaskCreated(address indexed sponsor, uint256 taskId, string description);
    event TaskCompleted(address indexed user, address indexed sponsor, uint256 taskId);
    event GasSponsored(address indexed sponsor, address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 注册成为赞助商
     */
    function registerSponsor(string memory name) external payable {
        require(!sponsors[msg.sender].registered, "Already registered");
        require(msg.value >= 0.01 ether, "Minimum deposit required");

        sponsors[msg.sender] = SponsorInfo({
            registered: true,
            name: name,
            totalSponsored: 0,
            balance: msg.value,
            taskIds: new uint256[](0)
        });

        emit SponsorRegistered(msg.sender, name);
        emit SponsorDeposited(msg.sender, msg.value);
    }

    /**
     * @dev 赞助商充值
     */
    function depositFunds() external payable {
        require(sponsors[msg.sender].registered, "Not a sponsor");
        sponsors[msg.sender].balance += msg.value;
        emit SponsorDeposited(msg.sender, msg.value);
    }

    /**
     * @dev 创建任务
     */
    function createTask(
        string memory description,
        uint256 reward,
        uint256 maxCompletions
    ) external returns (uint256 taskId) {
        require(sponsors[msg.sender].registered, "Not a sponsor");

        taskId = ++taskCounter[msg.sender];

        sponsorTasks[msg.sender][taskId] = Task({
            id: taskId,
            description: description,
            reward: reward,
            active: true,
            maxCompletions: maxCompletions,
            completions: 0
        });

        sponsors[msg.sender].taskIds.push(taskId);

        emit TaskCreated(msg.sender, taskId, description);
    }

    function markTaskCompleted(address user, address sponsor, uint256 taskId) external {
        require(sponsors[sponsor].registered, "Invalid sponsor");
        require(sponsorTasks[sponsor][taskId].active, "Task not active");
        require(!taskCompletions[user][sponsor][taskId], "Task already completed");
        require(
            sponsorTasks[sponsor][taskId].completions < sponsorTasks[sponsor][taskId].maxCompletions,
            "Max completions reached"
        );

        taskCompletions[user][sponsor][taskId] = true;
        sponsorTasks[sponsor][taskId].completions++;

        // 记录用户与赞助商的关系
        bool alreadyLinked = false;
        for (uint i = 0; i < userSponsors[user].length; i++) {
            if (userSponsors[user][i] == sponsor) {
                alreadyLinked = true;
                break;
            }
        }
        if (!alreadyLinked) {
            userSponsors[user].push(sponsor);
        }

        // 如果有奖励，发送给用户
        uint256 reward = sponsorTasks[sponsor][taskId].reward;
        if (reward > 0 && sponsors[sponsor].balance >= reward) {
            sponsors[sponsor].balance -= reward;
            payable(user).transfer(reward);
        }

        emit TaskCompleted(user, sponsor, taskId);
    }

    /**
     * @dev 检查是否是赞助商
     */
    function isSponsor(address sponsor) external view returns (bool) {
        return sponsors[sponsor].registered;
    }

    /**
     * @dev 获取赞助商信息
     */
    function getSponsorInfo(address sponsor) external view returns (SponsorInfo memory) {
        return sponsors[sponsor];
    }

    /**
     * @dev 检查用户是否完成了任务
     */
    function hasCompletedTask(address user, address sponsor, uint256 taskId) external view returns (bool) {
        return taskCompletions[user][sponsor][taskId];
    }

    /**
     * @dev 获取用户的赞助商列表
     */
    function getUserSponsors(address user) external view returns (address[] memory) {
        return userSponsors[user];
    }

    /**
     * @dev 用于支付 Gas 费用
     */
    function sponsorGas(address sponsor, address user, uint256 amount) external {
        require(sponsors[sponsor].registered, "Not a sponsor");
        require(sponsors[sponsor].balance >= amount, "Insufficient balance");

        sponsors[sponsor].balance -= amount;
        sponsors[sponsor].totalSponsored += amount;

        emit GasSponsored(sponsor, user, amount);
    }
}