async function main() {
  const VeryLongCNP = await ethers.getContractFactory("VeryLongCNP")

  // Start deployment, returning a promise that resolves to a contract object
  const veryLongCNP = await VeryLongCNP.deploy()
  console.log("Contract deployed to address:", veryLongCNP.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
