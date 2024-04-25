import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { MockERC20__factory } from "../types";

const func: DeployFunction = async (hre) => {
  const { deploy } = await Ship.init(hre);

  await deploy(MockERC20__factory, {
    aliasName: "WBTC",
    args: ["Wrapped BTC", "WBTC", 8],
  });
};

export default func;
func.tags = ["mock-wbtc"];
