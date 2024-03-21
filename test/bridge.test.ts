import { deployments } from "hardhat";
import chai from "chai";
import { Ship } from "../utils";
import { BTCBridge, BTCBridge__factory, MockWBTC, MockWBTC__factory } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signature, getBytes, solidityPackedKeccak256 } from "ethers";

const { expect } = chai;

let ship: Ship;
let btc: MockWBTC;
let bridge: BTCBridge;

let alice: SignerWithAddress;
let keeper: SignerWithAddress;
let admin: SignerWithAddress;

const chainId = 31337n; // hardhat chain Id
const amount = 100_000_000n; // 1 btc
const key = "0x0000000000000000000000000000000000000000000000000000000000000001";

const setup = deployments.createFixture(async (hre) => {
  ship = await Ship.init(hre);
  const { accounts, users } = ship;
  await deployments.fixture(["bridge"]);

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
  let hash = solidityPackedKeccak256(
    ["address", "bytes32", "uint256", "uint256"],
    [sender, key, amount, chainId],
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
    admin = accounts.vault;

    btc = (await ship.connect(MockWBTC__factory)) as MockWBTC;
    bridge = (await ship.connect(BTCBridge__factory)) as BTCBridge;
    await bridge.connect(admin).grantRole(await bridge.KEEPER_ROLE(), keeper);
    await btc.transfer(alice.address, amount);
    await btc.connect(alice).approve(bridge.target, amount);
  });

  describe("deposit function", () => {
    it("invalid signature(signer)", async () => {
      const sig = await getDepositSign(alice.address, key, amount, chainId, alice);
      await expect(bridge.connect(alice).deposit(key, amount, sig)).to.revertedWith(
        "BTCBridge: invalid parameters",
      );
    });
    it("invalid signature(amount)", async () => {
      const sig = await getDepositSign(alice.address, key, amount + 1n, chainId, keeper);
      await expect(bridge.connect(alice).deposit(key, amount, sig)).to.revertedWith(
        "BTCBridge: invalid parameters",
      );
    });

    it("valid signature", async () => {
      const sig = await getDepositSign(alice.address, key, amount, chainId, keeper);
      await expect(bridge.connect(alice).deposit(key, amount, sig))
        .to.emit(bridge, "Deposit")
        .withArgs(key, alice.address);
    });
  });

  describe("withdraw function", () => {
    it("invalid caller", async () => {
      await expect(bridge.connect(alice).withdraw(key, alice.address, amount))
        .to.revertedWithCustomError(bridge, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, await bridge.KEEPER_ROLE());
    });
    it("valid call", async () => {
      await expect(bridge.connect(keeper).withdraw(key, alice.address, amount))
        .to.emit(bridge, "Withdraw")
        .withArgs(key, alice.address);
    });
  });
});
