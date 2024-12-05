// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  console.log(" Iniciando deploy do contrato Lock...");

  const lock = await hre.ethers.deployContract("Lock");
  await lock.waitForDeployment();

  const address = await lock.getAddress();
  console.log(` Contrato Lock deployado com sucesso no endereço: ${address}`);

  // Verificar o contrato no Etherscan (se não for rede local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log(" Verificando contrato no Etherscan...");
    await lock.deployTransaction.wait(6); // Aguardar 6 blocos
    await hre.run("verify:verify", {
      address: lock.address,
      constructorArguments: [],
    });
    console.log(" Contrato verificado no Etherscan!");
  }

  // Salvar o endereço do contrato para o frontend
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ Lock: address }, undefined, 2)
  );

  console.log(" Endereço do contrato salvo em: ", contractsDir + "/contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(" Erro no deploy:", error);
    process.exit(1);
  });
