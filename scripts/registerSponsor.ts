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
const SPONSOR_PRIVATE_KEY = '0xec7388f7c4ad1e4aa2f5708bfd99f7d341f661d1899bfc45a39f47309d84c54f'; // 赞助商私钥
const SPONSOR_REGISTRY_ADDRESS = "0x064b0dBD2E0B48001a6d93F15F7A764C460D9EB1"; // SponsorRegistry 合约地址
const BATCH_CALL_SPONSOR_ADDRESS = "0x86f37F62a60C8E90c0f22339Cc5D28dEA74962b3";
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
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "batchCallSponsor",
        "type": "address"
      }
    ],
    "name": "BatchCallSponsorSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "contractAddr",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ContractApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "GasSponsored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "SponsorDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "SponsorRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "TaskCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "name": "TaskCreated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "batchCallSponsor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxCompletions",
        "type": "uint256"
      }
    ],
    "name": "createTask",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      }
    ],
    "name": "getSponsorInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "registered",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "totalSponsored",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "balance",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "taskIds",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct ISponsorRegistry.SponsorInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserSponsors",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      }
    ],
    "name": "hasCompletedAllTasks",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "hasCompletedTask",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "contractAddr",
        "type": "address"
      }
    ],
    "name": "isContractApproved",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      }
    ],
    "name": "isSponsor",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      }
    ],
    "name": "markTaskCompleted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "approvedContracts",
        "type": "address[]"
      }
    ],
    "name": "registerSponsor",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "contractAddr",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovedContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_batchCallSponsor",
        "type": "address"
      }
    ],
    "name": "setBatchCallSponsor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "sponsorApprovedContracts",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "sponsorGas",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "sponsorTasks",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "maxCompletions",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "completions",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "sponsors",
    "outputs": [
      {
        "internalType": "bool",
        "name": "registered",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "totalSponsored",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "taskCompletions",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "taskCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userSponsors",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
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
await publicClient.waitForTransactionReceipt({ 
  hash: setBatchCallSponsorTx,
  timeout: 60000 // 60 seconds timeout
});
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
await publicClient.waitForTransactionReceipt({ hash: registerSponsorTx,timeout: 60000});
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
const createTaskReceipt = await publicClient.waitForTransactionReceipt({ hash: createTaskTx ,timeout: 60000 });
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