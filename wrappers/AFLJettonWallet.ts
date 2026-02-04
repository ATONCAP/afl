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

export type AFLJettonWalletConfig = {
  ownerAddress: Address;
  jettonMasterAddress: Address;
  jettonWalletCode: Cell;
};

export function aflJettonWalletConfigToCell(config: AFLJettonWalletConfig): Cell {
  return beginCell()
    .storeCoins(0) // balance starts at 0
    .storeAddress(config.ownerAddress)
    .storeAddress(config.jettonMasterAddress)
    .storeRef(config.jettonWalletCode)
    .endCell();
}

export const Opcodes = {
  transfer: 0xf8a7ea5,
  internalTransfer: 0x178d4519,
  transferNotification: 0x7362d09c,
  burn: 0x595f07bc,
  burnNotification: 0x7bdd97de,
  excesses: 0xd53276db,
};

export class AFLJettonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new AFLJettonWallet(address);
  }

  static createFromConfig(config: AFLJettonWalletConfig, code: Cell, workchain = 0) {
    const data = aflJettonWalletConfigToCell(config);
    const init = { code, data };
    return new AFLJettonWallet(contractAddress(workchain, init), init);
  }

  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      amount: bigint;
      destination: Address;
      responseDestination?: Address;
      forwardTonAmount?: bigint;
      forwardPayload?: Cell;
    }
  ) {
    const forwardPayload = opts.forwardPayload ?? beginCell().endCell();

    await provider.internal(via, {
      value: opts.value ?? toNano("0.1"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.transfer, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeCoins(opts.amount)
        .storeAddress(opts.destination)
        .storeAddress(opts.responseDestination ?? via.address!)
        .storeUint(0, 1) // custom_payload flag
        .storeCoins(opts.forwardTonAmount ?? 0)
        .storeSlice(forwardPayload.beginParse())
        .endCell(),
    });
  }

  async sendBurn(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      amount: bigint;
      responseDestination?: Address;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.05"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.burn, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeCoins(opts.amount)
        .storeAddress(opts.responseDestination ?? via.address!)
        .endCell(),
    });
  }

  // Get methods

  async getWalletData(provider: ContractProvider): Promise<{
    balance: bigint;
    ownerAddress: Address;
    jettonMasterAddress: Address;
    jettonWalletCode: Cell;
  }> {
    const result = await provider.get("get_wallet_data", []);
    return {
      balance: result.stack.readBigNumber(),
      ownerAddress: result.stack.readAddress(),
      jettonMasterAddress: result.stack.readAddress(),
      jettonWalletCode: result.stack.readCell(),
    };
  }

  async getBalance(provider: ContractProvider): Promise<bigint> {
    const data = await this.getWalletData(provider);
    return data.balance;
  }
}
