import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SponsorSystemModule", (m) => {
  // 部署 SponsorRegistry 合约
  const sponsorRegistry = m.contract("SponsorRegistry");

  // 部署 BatchCallSponsor 合约，传入 SponsorRegistry 地址作为构造参数
  const batchCallSponsor = m.contract("BatchCallSponsor", [sponsorRegistry]);

  return {
    sponsorRegistry,
    batchCallSponsor
  };
});
