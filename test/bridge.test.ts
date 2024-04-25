import { deployments } from "hardhat";
import chai from "chai";
import { Ship } from "../utils";
import { Bridge, Bridge__factory, MockERC20 } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signature, getBytes, solidityPackedKeccak256 } from "ethers";

const { expect } = chai;

let ship: Ship;
let wbtc: MockERC20;
let bridge: Bridge;

let alice: SignerWithAddress;
let keeper: SignerWithAddress;
let admin: SignerWithAddress;

const chainId = 31337n; // hardhat chain Id
const amount = 100_000_000n; // 1 btc
const key = "0x0000000000000000000000000000000000000000000000000000000000000001";

const setup = deployments.createFixture(async (hre) => {
  ship = await Ship.init(hre);
  const { accounts, users } = ship;
  await deployments.fixture(["bridge", "mock-wbtc"]);

  return {
    ship,
    accounts,
    users,
  };
});

const getDepositSign = async (
  sender: string,
  key: string,
  amount: bigint,
  chainId: bigint,
  signer: SignerWithAddress,
) => {
  const hash = solidityPackedKeccak256(
    ["address", "bytes32", "address", "uint256", "uint256"],
    [sender, key, wbtc.target, amount, chainId],
  );
  const sig = await signer.signMessage(getBytes(hash));
  const { r, s, v } = Signature.from(sig);
  return {
    r,
    s,
    v,
  };
};

describe("Bridge test", () => {
  before(async () => {
    const { accounts } = await setup();

    alice = accounts.alice;
    keeper = accounts.bob;
    admin = accounts.deployer;

    wbtc = (await ship.connect("WBTC")) as MockERC20;
    bridge = (await ship.connect(Bridge__factory)) as Bridge;
    await bridge.connect(admin).grantRole(await bridge.KEEPER_ROLE(), keeper);
    await wbtc.connect(alice).mint(amount);
    await wbtc.connect(alice).approve(bridge.target, amount);
  });

  describe("deposit function", () => {
    it("invalid signature(signer)", async () => {
      const sig = await getDepositSign(alice.address, key, amount, chainId, alice);
      await expect(bridge.connect(alice).deposit(key, wbtc.target, amount, sig)).to.revertedWithCustomError(
        bridge,
        "InvalidParams",
      );
    });
    it("invalid signature(amount)", async () => {
      const sig = await getDepositSign(alice.address, key, amount + 1n, chainId, keeper);
      await expect(bridge.connect(alice).deposit(key, wbtc.target, amount, sig)).to.revertedWithCustomError(
        bridge,
        "InvalidParams",
      );
    });

    it("valid signature", async () => {
      const sig = await getDepositSign(alice.address, key, amount, chainId, keeper);
      await expect(bridge.connect(alice).deposit(key, wbtc.target, amount, sig))
        .to.emit(bridge, "Deposit")
        .withArgs(key, alice.address);
    });
  });

  describe("withdraw function", () => {
    it("invalid caller", async () => {
      await expect(bridge.connect(alice).withdraw(key, alice.address, wbtc.target, amount))
        .to.revertedWithCustomError(bridge, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, await bridge.KEEPER_ROLE());
    });
    it("valid call", async () => {
      await expect(bridge.connect(keeper).withdraw(key, alice.address, wbtc.target, amount))
        .to.emit(bridge, "Withdraw")
        .withArgs(key, alice.address);
    });
  });
});
