import { network } from "hardhat";
import { encodeFunctionData } from "viem";

const { viem } = await network.connect({
  network: "hoodi",
});

console.log("Sending sponsored transaction using the Hoodi network");

const publicClient = await viem.getPublicClient();
const [senderClient] = await viem.getWalletClients();

const COUNTER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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

const BATCH_CALL_SPONSOR_ABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "targets",
        type: "address[]"
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]"
      }
    ],
    name: "batchCall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

console.log("Preparing batch call for Counter contract functions");

const incData = encodeFunctionData({
  abi: COUNTER_ABI,
  functionName: "inc",
});

const incByData = encodeFunctionData({
  abi: COUNTER_ABI,
  functionName: "incBy",
  args: [5n],
});

const batchCallData = encodeFunctionData({
  abi: BATCH_CALL_SPONSOR_ABI,
  functionName: "batchCall",
  args: [
    [COUNTER_ADDRESS, COUNTER_ADDRESS],
    [incData, incByData]
  ],
});

console.log("Sending sponsored batch call transaction");
const batchTx = await senderClient.sendTransaction({
  to: BATCH_CALL_SPONSOR_ADDRESS,
  data: batchCallData,
});

await publicClient.waitForTransactionReceipt({ hash: batchTx });
console.log("Batch call transaction sent successfully, hash:", batchTx);
