const { task } = require("hardhat/config");
const whitelist = require("./data/whitelist.json");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require("keccak256");

task("setMerkleRoot", "set Merkle Root on WhiteList")
  .addParam("address", "contract address")
  .setAction(
    async (taskArgs, hre) => {
      if (!ethers.utils.isAddress(taskArgs.address))
        throw Error(taskArgs.address + "is not valid.");
      const VeryLongCNP = hre.ethers.ContractFactory('VeryLongCNP')
      const veryLongCNP = VeryLongCNP.attach(taskArgs.address)
      for (const line of whitelist) {
        if (!ethers.utils.isAddress(line[0]))
          throw Error(line[0] + "is not valid.");
      }

      const leafTree = whitelist.map(
        x => ethers.utils.solidityKeccak256(['address', 'uint256'], [x[0], x[1]])
      );
      const tree = new MerkleTree(leafTree, keccak256, { sortPairs: true });
      const rootTree = tree.getRoot();

      const transactionResponse = await veryLongCNP.setMerkleRoot(rootTree);
      console.log(`Transaction Hash: ${transactionResponse.hash}`);
  }
);
task("ownerMint", "Mints from the NFT contract. (only Owner)")
  .addParam("number", "Ownermint Number")
  .addParam("to", "To address")
  .addParam("address", "contract address")
  .setAction(async function (taskArgs, hre) {
    if (!ethers.utils.isAddress(taskArgs.address))
      throw Error(taskArgs.address + "is not valid.");
    if (!ethers.utils.isAddress(taskArgs.to))
      throw Error(taskArgs.address + "is not valid.");
    const VeryLongCNP = hre.ethers.ContractFactory('VeryLongCNP')
    const veryLongCNP = VeryLongCNP.attach(taskArgs.address)
    const transactionResponse = await veryLongCNP.ownerMint(
      taskArgs.to,
      taskArgs.number,
    );
    console.log(`Transaction Hash: ${transactionResponse.hash}`);
  });