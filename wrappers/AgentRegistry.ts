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
  Dictionary,
} from "@ton/core";

export type AgentRegistryConfig = {
  adminAddress: Address;
  agentIdentityCode: Cell;
  content: Cell;
};

export function agentRegistryConfigToCell(config: AgentRegistryConfig): Cell {
  return beginCell()
    .storeAddress(config.adminAddress)
    .storeUint(0, 64) // next_agent_index starts at 0
    .storeRef(config.agentIdentityCode)
    .storeRef(config.content)
    .endCell();
}

export const Opcodes = {
  registerAgent: 0x1,
  updateContent: 0x2,
  changeAdmin: 0x3,
  upgradeCode: 0x4,
};

export class AgentRegistry implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new AgentRegistry(address);
  }

  static createFromConfig(config: AgentRegistryConfig, code: Cell, workchain = 0) {
    const data = agentRegistryConfigToCell(config);
    const init = { code, data };
    return new AgentRegistry(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendRegisterAgent(
    provider: ContractProvider,
    via: Sender,
    opts: {
      value?: bigint;
      queryId?: number;
      name: string;
      description: string;
      capabilities: string[];
      avatarUrl?: string;
    }
  ) {
    // Build agent content cell
    const contentCell = buildAgentContent({
      name: opts.name,
      description: opts.description,
      capabilities: opts.capabilities,
      avatarUrl: opts.avatarUrl,
    });

    await provider.internal(via, {
      value: opts.value ?? toNano("0.15"),
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.registerAgent, 32)
        .storeUint(opts.queryId ?? 0, 64)
        .storeRef(contentCell)
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

  // Get methods

  async getRegistryData(provider: ContractProvider): Promise<{
    totalAgents: bigint;
    adminAddress: Address;
    content: Cell;
  }> {
    const result = await provider.get("get_registry_data", []);
    return {
      totalAgents: result.stack.readBigNumber(),
      adminAddress: result.stack.readAddress(),
      content: result.stack.readCell(),
    };
  }

  async getAgentAddress(
    provider: ContractProvider,
    agentIndex: bigint,
    ownerAddress: Address
  ): Promise<Address> {
    const result = await provider.get("get_agent_address", [
      { type: "int", value: agentIndex },
      { type: "slice", cell: beginCell().storeAddress(ownerAddress).endCell() },
    ]);
    return result.stack.readAddress();
  }

  async getTotalAgents(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get("get_total_agents", []);
    return result.stack.readBigNumber();
  }

  async getContent(provider: ContractProvider): Promise<Cell> {
    const result = await provider.get("get_content", []);
    return result.stack.readCell();
  }
}

// Agent content constraints
export const AGENT_CONTENT_LIMITS = {
  nameMinLength: 1,
  nameMaxLength: 100,
  descriptionMinLength: 1,
  descriptionMaxLength: 1000,
  capabilityMaxLength: 100,
  maxCapabilities: 20,
  avatarUrlMaxLength: 500,
} as const;

// Validation result type
export interface AgentContentValidation {
  valid: boolean;
  errors: string[];
}

// Validate agent content before building cell
export function validateAgentContent(opts: {
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl?: string;
}): AgentContentValidation {
  const errors: string[] = [];

  // Name validation
  const trimmedName = opts.name.trim();
  if (trimmedName.length < AGENT_CONTENT_LIMITS.nameMinLength) {
    errors.push("Name is required");
  } else if (trimmedName.length > AGENT_CONTENT_LIMITS.nameMaxLength) {
    errors.push(`Name must be ${AGENT_CONTENT_LIMITS.nameMaxLength} characters or less`);
  }

  // Description validation
  const trimmedDesc = opts.description.trim();
  if (trimmedDesc.length < AGENT_CONTENT_LIMITS.descriptionMinLength) {
    errors.push("Description is required");
  } else if (trimmedDesc.length > AGENT_CONTENT_LIMITS.descriptionMaxLength) {
    errors.push(`Description must be ${AGENT_CONTENT_LIMITS.descriptionMaxLength} characters or less`);
  }

  // Capabilities validation
  if (opts.capabilities.length > AGENT_CONTENT_LIMITS.maxCapabilities) {
    errors.push(`Maximum ${AGENT_CONTENT_LIMITS.maxCapabilities} capabilities allowed`);
  }
  opts.capabilities.forEach((cap, index) => {
    const trimmedCap = cap.trim();
    if (trimmedCap.length === 0) {
      errors.push(`Capability ${index + 1} cannot be empty`);
    } else if (trimmedCap.length > AGENT_CONTENT_LIMITS.capabilityMaxLength) {
      errors.push(`Capability ${index + 1} must be ${AGENT_CONTENT_LIMITS.capabilityMaxLength} characters or less`);
    }
  });

  // Avatar URL validation
  if (opts.avatarUrl && opts.avatarUrl.length > AGENT_CONTENT_LIMITS.avatarUrlMaxLength) {
    errors.push(`Avatar URL must be ${AGENT_CONTENT_LIMITS.avatarUrlMaxLength} characters or less`);
  }
  if (opts.avatarUrl && opts.avatarUrl.trim().length > 0) {
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(opts.avatarUrl.trim())) {
      errors.push("Avatar URL must be a valid HTTP/HTTPS URL");
    }
  }

  return { valid: errors.length === 0, errors };
}

// Helper function to build agent content cell
export function buildAgentContent(opts: {
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl?: string;
}): Cell {
  // Validate content
  const validation = validateAgentContent(opts);
  if (!validation.valid) {
    throw new Error(`Invalid agent content: ${validation.errors.join(", ")}`);
  }

  // Build capabilities as a dictionary
  const capabilitiesDict = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
  opts.capabilities.forEach((cap, index) => {
    capabilitiesDict.set(index, beginCell().storeStringTail(cap.trim()).endCell());
  });

  // Main content cell structure - all data in refs to avoid loadStringTail conflicts
  return beginCell()
    .storeRef(
      beginCell()
        .storeStringTail(opts.name.trim())
        .endCell()
    )
    .storeRef(
      beginCell()
        .storeStringTail(opts.description.trim())
        .endCell()
    )
    .storeRef(
      beginCell()
        .storeDict(capabilitiesDict)
        .endCell()
    )
    .storeRef(
      beginCell()
        .storeStringTail((opts.avatarUrl ?? "").trim())
        .endCell()
    )
    .endCell();
}

// Helper function to parse agent content cell
export function parseAgentContent(content: Cell): {
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl: string;
} {
  const cs = content.beginParse();

  const nameCell = cs.loadRef();
  const name = nameCell.beginParse().loadStringTail();

  const descCell = cs.loadRef();
  const description = descCell.beginParse().loadStringTail();

  const capCell = cs.loadRef();
  const capCs = capCell.beginParse();
  const capDict = capCs.loadDict(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
  const capabilities: string[] = [];
  capDict.keys().forEach(key => {
    const cell = capDict.get(key);
    if (cell) {
      capabilities.push(cell.beginParse().loadStringTail());
    }
  });

  const avatarCell = cs.loadRef();
  const avatarUrl = avatarCell.beginParse().loadStringTail();

  return { name, description, capabilities, avatarUrl };
}
