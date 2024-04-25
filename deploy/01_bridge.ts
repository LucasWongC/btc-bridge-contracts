import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { Bridge, Bridge__factory } from "../types";

const OPERATOR_ROLE = "0x4f78afe9dfc9a0cb0441c27b9405070cd2a48b490636a7bdd09f355e33a5d7de";

const func: DeployFunction = async (hre) => {
  const { deploy, accounts } = await Ship.init(hre);

  const bridge = await deploy(Bridge__factory, {
    args: [accounts.deployer.address],
  });

  if (bridge.newlyDeployed) {
    const tx = await (bridge.contract as Bridge).grantRole(
      OPERATOR_ROLE,
      "0x6d13b74C1Ffb7b54703eC51a2320A57fB38077C1",
    );
    await tx.wait();
  }
};

export default func;
func.tags = ["bridge"];
