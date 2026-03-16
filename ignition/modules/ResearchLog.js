const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ResearchLogModule", (m) => {
  const researchLog = m.contract("ResearchLog");

  return { researchLog };
});