const { expect } = require("chai");

describe("ResearchLog Contract", function () {

  it("Should create a research with version 1", async function () {

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const fileHash =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    await researchLog.createResearch("QmTestCID123", fileHash, false);

    const version = await researchLog.getVersion(1, 0);

    expect(version.ipfsHash).to.equal("QmTestCID123");
    expect(version.fileHash).to.equal(fileHash);

  });


  it("Should add a new version to research", async function () {

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const hash1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    const hash2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222";

    await researchLog.createResearch("QmCID1", hash1, false);

    await researchLog.addVersion(1, "QmCID2", hash2);

    const versionCount = await researchLog.getVersionCount(1);

    expect(versionCount).to.equal(2n);

  });


  it("Should prevent duplicate version in same research", async function () {

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const hash =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    await researchLog.createResearch("QmCID1", hash, false);

    await expect(
      researchLog.addVersion(1, "QmCID2", hash)
    ).to.be.revertedWith("Duplicate version");

  });


  it("Should reject version addition from non-author", async function () {

    const [owner, otherUser] = await ethers.getSigners();

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const hash1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    const hash2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222";

    await researchLog.createResearch("QmCID1", hash1);

    await expect(
      researchLog.connect(otherUser).addVersion(1, "QmCID2", hash2)
    ).to.be.revertedWith("Only author can add versions");

  });


  it("Should return correct research IDs", async function () {

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const hash1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    const hash2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222";

    await researchLog.createResearch("QmCID1", hash1, false);
    await researchLog.createResearch("QmCID2", hash2, false);

    const ids = await researchLog.getResearchIds();

    expect(ids.length).to.equal(2);

  });

  it("Should number researches per owner", async function () {

    const [owner, otherUser] = await ethers.getSigners();

    const ResearchLog = await ethers.getContractFactory("ResearchLog");
    const researchLog = await ResearchLog.deploy();

    await researchLog.waitForDeployment();

    const hash1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111";

    const hash2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222";

    const hash3 =
      "0x3333333333333333333333333333333333333333333333333333333333333333";

    await researchLog.createResearch("QmCID1", hash1, false);
    await researchLog.connect(otherUser).createResearch("QmCID2", hash2, false);
    await researchLog.createResearch("QmCID3", hash3, false);

    expect(await researchLog.ownerResearchCount(owner.address)).to.equal(2n);
    expect(await researchLog.ownerResearchCount(otherUser.address)).to.equal(1n);
    expect(await researchLog.getOwnerResearchNumber(1)).to.equal(1n);
    expect(await researchLog.getOwnerResearchNumber(2)).to.equal(1n);
    expect(await researchLog.getOwnerResearchNumber(3)).to.equal(2n);

  });
});