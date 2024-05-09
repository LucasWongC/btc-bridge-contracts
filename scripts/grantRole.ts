import { ZeroAddress, parseEther } from "ethers";
import { Bridge, Bridge__factory } from "../types";
import { Ship } from "../utils";

const main = async () => {
  const { connect, accounts } = await Ship.init();

  const bridge = (await connect(Bridge__factory)) as Bridge;

  const keeper = "0x6d13b74C1Ffb7b54703eC51a2320A57fB38077C1";

  const tx = await bridge.grantRole(await bridge.KEEPER_ROLE(), keeper);

  console.log(tx.hash);
  await tx.wait();
};

main();
