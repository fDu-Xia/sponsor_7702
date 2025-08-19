import { network } from "hardhat";
import { encodeFunctionData,createWalletClient,http } from "viem";
import { hoodi } from 'viem/chains'
import {privateKeyToAccount} from "viem/accounts";

const { viem } = await network.connect({
  network: "hoodi",
});

console.log("Sending EIP-7702 batch transaction: 3x inc() + incBy(2) + incBy(3)");

const publicClient = await viem.getPublicClient();
const eoa = privateKeyToAccount('0x...')

export const walletClient = createWalletClient({
  account: eoa,
  chain: hoodi,
  transport: http(),
})

const COUNTER_ADDRESS = "0x8bE4FEAcc2c5353A75eA6deaB2ac6131dae97359";
const BATCH_CALL_SPONSOR_ADDRESS = "0x8a6bAd23D41c167bE650Bd458933492361580760";

const COUNTER_ABI = [
  {
    inputs: [],
    name: "inc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "by",
        type: "uint256"
      }
    ],
    name: "incBy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "x",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "by",
        type: "uint256"
      }
    ],
    name: "Increment",
    type: "event"
  }
];

// BatchCallAndSponsor合约的ABI (包含execute函数)
const BATCH_CALL_AND_SPONSOR_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct BatchCallAndSponsor.Call[]",
        name: "calls",
        type: "tuple[]"
      }
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

console.log("Step 1: Reading current counter value");
const currentValue = await publicClient.readContract({
  address: COUNTER_ADDRESS,
  abi: COUNTER_ABI,
  functionName: "x",
});
console.log("Current counter value:", currentValue);

console.log("Step 2: Signing EIP-7702 authorization");
// 签署EIP-7702授权，将BatchCallAndSponsor合约委托到EOA
const authorization = await walletClient.signAuthorization({
  executor: 'self', // 表示EOA自己执行交易
  contractAddress: BATCH_CALL_SPONSOR_ADDRESS,
});

console.log("Authorization signed:", authorization);

console.log("Step 3: Preparing batch calls - 3x inc(), 1x incBy(2), 1x incBy(3)");

// 编码inc()函数调用数据
const incData = encodeFunctionData({
  abi: COUNTER_ABI,
  functionName: "inc",
});

// 编码incBy(2)函数调用数据
const incBy2Data = encodeFunctionData({
  abi: COUNTER_ABI,
  functionName: "incBy",
  args: [2n],
});

// 编码incBy(3)函数调用数据
const incBy3Data = encodeFunctionData({
  abi: COUNTER_ABI,
  functionName: "incBy",
  args: [3n],
});

// 创建批量调用数组：3次inc() + 1次incBy(2) + 1次incBy(3)
const batchCalls = [
  // 前3次调用 inc()
  {
    to: COUNTER_ADDRESS,
    value: 0n,
    data: incData,
  },
  {
    to: COUNTER_ADDRESS,
    value: 0n,
    data: incData,
  },
  {
    to: COUNTER_ADDRESS,
    value: 0n,
    data: incData,
  },
  // 第4次调用 incBy(2)
  {
    to: COUNTER_ADDRESS,
    value: 0n,
    data: incBy2Data,
  },
  // 第5次调用 incBy(3)
  {
    to: COUNTER_ADDRESS,
    value: 0n,
    data: incBy3Data,
  },
];

console.log("Batch calls prepared:");
console.log("  - Call 1: inc()");
console.log("  - Call 2: inc()");
console.log("  - Call 3: inc()");
console.log("  - Call 4: incBy(2)");
console.log("  - Call 5: incBy(3)");
console.log("Total expected increase: 8");

// 编码execute函数调用数据
const executeCallData = encodeFunctionData({
  abi: BATCH_CALL_AND_SPONSOR_ABI,
  functionName: "execute",
  args: [batchCalls],
});

console.log("Step 4: Sending EIP-7702 batch transaction (3x inc + incBy(2) + incBy(3))");

// 发送EIP-7702交易
const batchTx = await walletClient.sendTransaction({
  to: walletClient.account.address,  // 发送到EOA自己的地址
  data: executeCallData,             // execute函数调用数据
  authorizationList: [authorization], // 包含EIP-7702授权
});

console.log("Waiting for transaction confirmation...");
const receipt = await publicClient.waitForTransactionReceipt({ 
  hash: batchTx,
  timeout: 60000 // 60 seconds timeout
});

console.log("✅ EIP-7702 mixed batch execution successful!");
console.log("   Executed: 3x inc() + 1x incBy(2) + 1x incBy(3)");
console.log("Transaction hash:", batchTx);
console.log("Block number:", receipt.blockNumber);

console.log("Step 5: Verifying counter value after batch execution");
const newValue = await publicClient.readContract({
  address: COUNTER_ADDRESS,
  abi: COUNTER_ABI,
  functionName: "x",
});

console.log("Previous counter value:", currentValue);
console.log("New counter value:", newValue);