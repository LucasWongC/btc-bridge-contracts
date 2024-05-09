import { ZeroAddress, parseEther, parseUnits } from "ethers";
import { Bridge, Bridge__factory, MockERC20 } from "../types";
import { Ship } from "../utils";

const main = async () => {
  const { connect } = await Ship.init();

  const bridge = (await connect(Bridge__factory)) as Bridge;
  const usdc = (await connect("USDC")) as MockERC20;

  const tx = await bridge.addPool(ZeroAddress, parseEther("2"), {
    value: parseEther("2"),
  });

  console.log(tx.hash);
  await tx.wait();

  const tx1 = await usdc.mint(parseUnits("100000", 6));
  await tx1.wait();

  const tx2 = await usdc.approve(bridge.target, parseUnits("100000", 6));
  await tx2.wait();

  const tx3 = await bridge.addPool(usdc.target, parseUnits("100000", 6));
  await tx3.wait();
};

main();
