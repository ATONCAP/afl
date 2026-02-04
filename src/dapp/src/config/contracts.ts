/**
 * AFL Contract Addresses Configuration
 *
 * IMPORTANT: Update these addresses after deploying contracts!
 *
 * Deployment steps:
 * 1. Run: yarn blueprint build
 * 2. Run: yarn blueprint deploy --testnet
 * 3. Copy deployed addresses here
 * 4. Set VITE_NETWORK=testnet or mainnet in .env
 */

export type NetworkType = "testnet" | "mainnet";

export interface ContractAddresses {
  agentRegistry: string | null;
  aflJettonMinter: string | null;
}

// TODO: Replace null with actual deployed addresses
const TESTNET_ADDRESSES: ContractAddresses = {
  agentRegistry: null,  // Deploy and add: EQD...
  aflJettonMinter: null, // Deploy and add: EQD...
};

const MAINNET_ADDRESSES: ContractAddresses = {
  agentRegistry: null,
  aflJettonMinter: null,
};

export function getNetwork(): NetworkType {
  const network = import.meta.env.VITE_NETWORK;
  if (network === "mainnet") return "mainnet";
  return "testnet"; // Default to testnet
}

export function getContractAddresses(): ContractAddresses {
  const network = getNetwork();
  return network === "mainnet" ? MAINNET_ADDRESSES : TESTNET_ADDRESSES;
}

export function isContractDeployed(address: string | null): address is string {
  return address !== null && address.length > 10 && address.startsWith("EQ");
}

export function getAgentRegistryAddress(): string | null {
  return getContractAddresses().agentRegistry;
}

export function getAFLMinterAddress(): string | null {
  return getContractAddresses().aflJettonMinter;
}

// Export deployment status for UI
export function getDeploymentStatus(): {
  isRegistryDeployed: boolean;
  isMinterDeployed: boolean;
  network: NetworkType;
} {
  const addresses = getContractAddresses();
  return {
    isRegistryDeployed: isContractDeployed(addresses.agentRegistry),
    isMinterDeployed: isContractDeployed(addresses.aflJettonMinter),
    network: getNetwork(),
  };
}
