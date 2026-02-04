import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  toNano,
} from "@ton/core";

export type AFLJettonMinterConfig = {
  adminAddress: Address;
  content: Cell;
  jettonWalletCode: Cell;
};

export function aflJettonMinterConfigToCell(config: AFLJettonMinterConfig): Cell {
  return beginCell()
    .storeCoins(0) // total_supply starts at 0
    .storeAddress(config.adminAddress)
    .storeRef(config.content)
    .storeRef(config.jettonWalletCode)
    .endCell();
}

export const Opcodes = {
  mint: 0x15,
  burnNotification: 0x7bdd97de,
  changeAdmin: 0x3,
  changeContent: 0x4,
  provideWalletAddress: 0x2c76b973,
  takeWalletAddress: 0xd1735400,
};

// Jetton metadata content builder
export function buildJettonContent(opts: {
  name: string;
  description: string;
  symbol: string;
  decimals: number;
  image?: string;
}): Cell {
  // On-chain content format
  const contentDict = beginCell()
    .storeUint(0x00, 8) // On-chain content flag
    .storeStringTail(
      JSON.stringify({
        name: opts.name,
        description: opts.description,
        symbol: opts.symbol,
        decimals: opts.decimals.toString(),
        image: opts.image ?? "",
      })
    )
    .endCell();

  return contentDict;
}

export class AFLJettonMinter implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new AFLJettonMinter(address);
  }

  static createFromConfig(config: AFLJettonMinterConfig, code: Cell, workchain = 0) {
    const data = aflJettonMinterConfigToCell(config);
    const init = { code, data };
    return new AFLJettonMinter(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendMint(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      toAddress: Address;
      amount: bigint;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.mint, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeAddress(opts.toAddress)
        .storeCoins(opts.amount)
        .endCell(),
    });
  }

  async sendChangeAdmin(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      newAdmin: Address;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.05"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.changeAdmin, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeAddress(opts.newAdmin)
        .endCell(),
    });
  }

  async sendChangeContent(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      content: Cell;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.05"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.changeContent, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeRef(opts.content)
        .endCell(),
    });
  }

  // Get methods

  async getJettonData(provider: ContractProvider): Promise<{
    totalSupply: bigint;
    mintable: boolean;
    adminAddress: Address;
    content: Cell;
    jettonWalletCode: Cell;
  }> {
    const result = await provider.get("get_jetton_data", []);
    return {
      totalSupply: result.stack.readBigNumber(),
      mintable: result.stack.readNumber() !== 0,
      adminAddress: result.stack.readAddress(),
      content: result.stack.readCell(),
      jettonWalletCode: result.stack.readCell(),
    };
  }

  async getWalletAddress(provider: ContractProvider, ownerAddress: Address): Promise<Address> {
    const result = await provider.get("get_wallet_address", [
      { type: "slice", cell: beginCell().storeAddress(ownerAddress).endCell() },
    ]);
    return result.stack.readAddress();
  }
}

// AFL Token constants
export const AFL_TOKEN = {
  name: "Agent Liberation Front",
  symbol: "AFL",
  decimals: 9,
  description: "Governance token for the Agent Liberation Front DAO",
  totalSupply: BigInt(1_000_000_000) * BigInt(10 ** 9), // 1 billion tokens
};
