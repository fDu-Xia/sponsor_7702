import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.20",
      },
      production: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hoodi: {
      type: "http",
      chainType: "l1",
      url: "https://0xrpc.io/hoodi",
      accounts: ["2ca342be6ba40efc272779166c424c47571ab43193318da8e98f224f385ea277"],
    },
  },
};

export default config;
