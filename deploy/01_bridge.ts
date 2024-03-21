import { DeployFunction } from "hardhat-deploy/types";
import { Ship } from "../utils";
import { BTCBridge__factory, MockWBTC__factory } from "../types";
import { WBTC_ADDRESS } from "../config";
import { Addressable } from "ethers";

const func: DeployFunction = async (hre) => {
  const { deploy, connect, accounts } = await Ship.init(hre);

  let btcAddress: string | Addressable;
  if (hre.network.tags["prod"]) {
    if (!WBTC_ADDRESS[hre.network.name]) {
      throw new Error("Invalid config");
    }
    btcAddress = WBTC_ADDRESS[hre.network.name];
  } else {
    btcAddress = (await connect(MockWBTC__factory)).target;
  }

  await deploy(BTCBridge__factory, {
    args: [btcAddress, accounts.vault.address],
  });
};

export default func;
func.tags = ["bridge"];
func.dependencies = ["mocks"];
