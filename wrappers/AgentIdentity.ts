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

export type AgentIdentityConfig = {
  agentIndex: bigint;
  ownerAddress: Address;
  registryAddress: Address;
  content: Cell;
};

export function agentIdentityConfigToCell(config: AgentIdentityConfig): Cell {
  return beginCell()
    .storeUint(config.agentIndex, 64)
    .storeAddress(config.ownerAddress)
    .storeAddress(config.registryAddress)
    .storeRef(config.content)
    .storeUint(0, 1) // revoked = false
    .endCell();
}

export const Opcodes = {
  proveOwnership: 0x5,
  ownershipProof: 0x6,
  ownershipProofBounced: 0x7,
  requestOwner: 0x8,
  ownerInfo: 0x9,
  updateContent: 0xa,
  revoke: 0xb,
  destroy: 0x1f,
};

export class AgentIdentity implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new AgentIdentity(address);
  }

  static createFromConfig(config: AgentIdentityConfig, code: Cell, workchain = 0) {
    const data = agentIdentityConfigToCell(config);
    const init = { code, data };
    return new AgentIdentity(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendProveOwnership(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      destination: Address;
      forwardPayload: Cell;
      withContent?: boolean;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.05"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.proveOwnership, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeAddress(opts.destination)
        .storeRef(opts.forwardPayload)
        .storeUint(opts.withContent ? 1 : 0, 1)
        .endCell(),
    });
  }

  async sendUpdateContent(
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
        .storeUint(Opcodes.updateContent, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeRef(opts.content)
        .endCell(),
    });
  }

  async sendRevoke(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.05"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.revoke, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .endCell(),
    });
  }

  async sendDestroy(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
    }
  ) {
    await provider.internal(via, {
      value: opts.value ?? toNano("0.01"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.destroy, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .endCell(),
    });
  }

  // Get methods

  async getAgentData(provider: ContractProvider): Promise<{
    initialized: boolean;
    agentIndex: bigint;
    registryAddress: Address;
    ownerAddress: Address;
    content: Cell;
  }> {
    const result = await provider.get("get_agent_data", []);
    return {
      initialized: result.stack.readNumber() !== 0,
      agentIndex: result.stack.readBigNumber(),
      registryAddress: result.stack.readAddress(),
      ownerAddress: result.stack.readAddress(),
      content: result.stack.readCell(),
    };
  }

  async getOwner(provider: ContractProvider): Promise<Address> {
    const result = await provider.get("get_owner", []);
    return result.stack.readAddress();
  }

  async getRegistry(provider: ContractProvider): Promise<Address> {
    const result = await provider.get("get_registry", []);
    return result.stack.readAddress();
  }

  async getContent(provider: ContractProvider): Promise<Cell> {
    const result = await provider.get("get_content", []);
    return result.stack.readCell();
  }

  async isRevoked(provider: ContractProvider): Promise<boolean> {
    const result = await provider.get("is_revoked", []);
    return result.stack.readNumber() !== 0;
  }

  async getAgentIndex(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get("get_agent_index", []);
    return result.stack.readBigNumber();
  }
}
