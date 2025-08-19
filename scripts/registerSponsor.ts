import { network } from "hardhat";
import { createWalletClient, http, parseEther } from "viem";
import { hoodi } from 'viem/chains'
import { privateKeyToAccount } from "viem/accounts";

const { viem } = await network.connect({
  network: "hoodi",
});

console.log("Starting sponsor registration and setup process...");

const publicClient = await viem.getPublicClient();

// 配置地址
const SPONSOR_PRIVATE_KEY = '0x...'; // 赞助商私钥
const BATCH_CALL_SPONSOR_ADDRESS = "0x8a6bAd23D41c167bE650Bd458933492361580760";
const SPONSOR_REGISTRY_ADDRESS = "0x..."; // SponsorRegistry 合约地址
const COUNTER_ADDRESS = "0x8bE4FEAcc2c5353A75eA6deaB2ac6131dae97359";
const USER_ADDRESS = "0xb74FC85Da1416359a00d24c8c726F2E5A5790BeD";

// 创建赞助商钱包
const sponsorAccount = privateKeyToAccount(SPONSOR_PRIVATE_KEY);
const sponsorWallet = createWalletClient({
  account: sponsorAccount,
  chain: hoodi,
  transport: http(),
});

// SponsorRegistry 合约 ABI
const SPONSOR_REGISTRY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_batchCallSponsor",
        type: "address"
      }
    ],
    name: "setBatchCallSponsor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "address[]",
        name: "approvedContracts",
        type: "address[]"
      }
    ],
    name: "registerSponsor",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "description",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "maxCompletions",
        type: "uint256"
      }
    ],
    name: "createTask",
    outputs: [
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        internalType: "address",
        name: "sponsor",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "taskId",
        type: "uint256"
      }
    ],
    name: "markTaskCompleted",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

console.log("Step 1: Setting BatchCallSponsor contract address");
const setBatchCallSponsorTx = await sponsorWallet.writeContract({
  address: SPONSOR_REGISTRY_ADDRESS,
  abi: SPONSOR_REGISTRY_ABI,
  functionName: "setBatchCallSponsor",
  args: [BATCH_CALL_SPONSOR_ADDRESS],
});

console.log("Waiting for setBatchCallSponsor transaction...");
await publicClient.waitForTransactionReceipt({ hash: setBatchCallSponsorTx });
console.log("✅ BatchCallSponsor address set:", BATCH_CALL_SPONSOR_ADDRESS);
console.log("Transaction hash:", setBatchCallSponsorTx);

console.log("Step 2: Registering sponsor with counter contract whitelist and 1 ETH deposit");
const registerSponsorTx = await sponsorWallet.writeContract({
  address: SPONSOR_REGISTRY_ADDRESS,
  abi: SPONSOR_REGISTRY_ABI,
  functionName: "registerSponsor",
  args: [
    "counter", // sponsor name
    [COUNTER_ADDRESS] // approved contracts whitelist
  ],
  value: parseEther("1"), // 1 ETH deposit
});

console.log("Waiting for registerSponsor transaction...");
await publicClient.waitForTransactionReceipt({ hash: registerSponsorTx });
console.log("✅ Sponsor registered successfully!");
console.log("  - Sponsor address:", sponsorAccount.address);
console.log("  - Sponsor name: counter");
console.log("  - Approved contracts:", [COUNTER_ADDRESS]);
console.log("  - Deposit: 1 ETH");
console.log("Transaction hash:", registerSponsorTx);

console.log("Step 3: Creating task 'test'");
const createTaskTx = await sponsorWallet.writeContract({
  address: SPONSOR_REGISTRY_ADDRESS,
  abi: SPONSOR_REGISTRY_ABI,
  functionName: "createTask",
  args: [
    "test", // task description
    0n,     // reward (0)
    1n      // maxCompletions (1)
  ],
});

console.log("Waiting for createTask transaction...");
const createTaskReceipt = await publicClient.waitForTransactionReceipt({ hash: createTaskTx });
console.log("✅ Task 'test' created successfully!");
console.log("  - Task description: test");
console.log("  - Reward: 0 ETH");
console.log("  - Max completions: 1");
console.log("  - Task ID: 1 (assuming this is the first task)");
console.log("Transaction hash:", createTaskTx);

console.log("Step 4: Marking user task as completed");
const markTaskCompletedTx = await sponsorWallet.writeContract({
  address: SPONSOR_REGISTRY_ADDRESS,
  abi: SPONSOR_REGISTRY_ABI,
  functionName: "markTaskCompleted",
  args: [
    USER_ADDRESS,           // user address
    sponsorAccount.address, // sponsor address (self)
    1n                      // taskId (1)
  ],
});

console.log("Waiting for markTaskCompleted transaction...");
await publicClient.waitForTransactionReceipt({ hash: markTaskCompletedTx });
console.log("✅ User task marked as completed!");
console.log("  - User address:", USER_ADDRESS);
console.log("  - Sponsor address:", sponsorAccount.address);
console.log("  - Task ID: 1");
console.log("Transaction hash:", markTaskCompletedTx);

console.log("\n🎉 All setup completed successfully!");
console.log("Summary:");
console.log("  1. ✅ BatchCallSponsor contract address set");
console.log("  2. ✅ Sponsor registered with counter contract whitelist and 1 ETH");
console.log("  3. ✅ Task 'test' created (ID: 1)");
console.log("  4. ✅ User marked as completed the test task");
console.log("\nNow the user can:");
console.log("  - Call selectSponsor() to choose this sponsor");
console.log("  - Use executeSponsored() for free transactions to the counter contract");