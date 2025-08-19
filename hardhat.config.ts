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
      accounts: ["ec7388f7c4ad1e4aa2f5708bfd99f7d341f661d1899bfc45a39f47309d84c54f"],
    },
  },
};

export default config;
