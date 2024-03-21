import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { MockWBTC__factory } from "../types";

const func: DeployFunction = async (hre) => {
  const { deploy } = await Ship.init(hre);

  await deploy(MockWBTC__factory);
};

export default func;
func.tags = ["mocks"];
