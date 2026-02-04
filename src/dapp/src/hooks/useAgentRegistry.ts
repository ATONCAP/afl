import { useCallback } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Address, beginCell, toNano, Cell } from "@ton/core";
import { buildAgentContent, parseAgentContent, validateAgentContent, AGENT_CONTENT_LIMITS } from "../../../wrappers/AgentRegistry";
import { TonClient } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import {
  getAgentRegistryAddress,
  isContractDeployed,
  getNetwork,
} from "../config/contracts";

interface AgentContent {
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl?: string;
}

export interface RegistryData {
  totalAgents: number;
  adminAddress: string;
}

export interface AgentData {
  address: string;
  agentIndex: number;
  ownerAddress: string;
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl: string;
  isRevoked: boolean;
  registeredAt?: Date;
}

export function useAgentRegistry() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const queryClient = useQueryClient();

  const registryAddress = getAgentRegistryAddress();
  const isDeployed = isContractDeployed(registryAddress);
  const network = getNetwork();

  // Get TonClient
  const getTonClient = useCallback(async () => {
    const endpoint = await getHttpEndpoint({ network });
    return new TonClient({ endpoint });
  }, [network]);

  // Fetch registry data - only if contract is deployed
  const {
    data: registryData,
    isLoading: isLoadingRegistry,
    error: registryError,
  } = useQuery({
    queryKey: ["registryData", registryAddress],
    queryFn: async (): Promise<RegistryData | null> => {
      if (!isDeployed || !registryAddress) {
        return null;
      }

      const client = await getTonClient();
      const address = Address.parse(registryAddress);

      // First check if contract exists
      const state = await client.getContractState(address);
      if (state.state !== "active") {
        console.warn("Registry contract not active");
        return null;
      }

      const result = await client.runMethod(address, "get_registry_data");

      return {
        totalAgents: Number(result.stack.readBigNumber()),
        adminAddress: result.stack.readAddress().toString(),
      };
    },
    enabled: isDeployed,
    staleTime: 30000,
    retry: 1,
  });

  // NOTE: Agent enumeration requires an off-chain indexer.
  // The registry contract stores agent count but computes addresses from (index, owner),
  // meaning we can't enumerate agents without knowing owner addresses.
  // In production, use an indexer that tracks RegisterAgent events/transactions.
  //
  // This query fetches agents from known addresses stored in localStorage
  // or provided via external indexer API.
  const {
    data: agents,
    isLoading: isLoadingAgents,
    error: agentsError,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ["agents", registryAddress],
    queryFn: async (): Promise<AgentData[]> => {
      if (!isDeployed || !registryAddress) {
        return [];
      }

      // Try to get known agent addresses from localStorage
      // In production, this would come from an indexer API
      const storedAddresses = localStorage.getItem("afl_known_agent_addresses");
      if (!storedAddresses) {
        return [];
      }

      let knownAddresses: string[];
      try {
        knownAddresses = JSON.parse(storedAddresses);
        if (!Array.isArray(knownAddresses)) {
          return [];
        }
      } catch {
        return [];
      }

      const client = await getTonClient();
      const agentsList: AgentData[] = [];

      // Fetch data for each known address
      for (const addr of knownAddresses.slice(0, 100)) {
        try {
          const address = Address.parse(addr);
          const state = await client.getContractState(address);
          if (state.state !== "active") {
            continue;
          }

          const result = await client.runMethod(address, "get_agent_data");
          const initialized = result.stack.readNumber() !== 0;
          if (!initialized) {
            continue;
          }

          const agentIndex = Number(result.stack.readBigNumber());
          const _registryAddress = result.stack.readAddress().toString();
          const ownerAddress = result.stack.readAddress().toString();
          const contentCell = result.stack.readCell();
          const content = parseAgentContent(contentCell);

          const revokedResult = await client.runMethod(address, "is_revoked");
          const isRevoked = revokedResult.stack.readNumber() !== 0;

          agentsList.push({
            address: addr,
            agentIndex,
            ownerAddress,
            name: content.name,
            description: content.description,
            capabilities: content.capabilities,
            avatarUrl: content.avatarUrl || "",
            isRevoked,
          });
        } catch (error) {
          console.error(`Error fetching agent ${addr}:`, error);
        }
      }

      return agentsList;
    },
    enabled: isDeployed,
    staleTime: 60000,
  });

  // Add a known agent address to local storage (for tracking registered agents)
  const trackAgentAddress = useCallback((agentAddress: string) => {
    const storedAddresses = localStorage.getItem("afl_known_agent_addresses");
    let addresses: string[] = [];
    try {
      addresses = storedAddresses ? JSON.parse(storedAddresses) : [];
    } catch {
      addresses = [];
    }
    if (!addresses.includes(agentAddress)) {
      addresses.push(agentAddress);
      localStorage.setItem("afl_known_agent_addresses", JSON.stringify(addresses));
    }
  }, []);

  // Fetch agent data by address (defined before fetchAgentsByAddresses which uses it)
  const fetchAgentData = useCallback(
    async (agentAddress: string): Promise<AgentData | null> => {
      const client = await getTonClient();
      const address = Address.parse(agentAddress);

      // Check if contract exists
      const state = await client.getContractState(address);
      if (state.state !== "active") {
        return null;
      }

      const result = await client.runMethod(address, "get_agent_data");

      const initialized = result.stack.readNumber() !== 0;
      if (!initialized) {
        return null;
      }

      const agentIndex = Number(result.stack.readBigNumber());
      const _registryAddress = result.stack.readAddress().toString();
      const ownerAddress = result.stack.readAddress().toString();
      const contentCell = result.stack.readCell();

      // parseAgentContent now throws on failure instead of returning fake data
      const content = parseAgentContent(contentCell);

      // Check if revoked
      const revokedResult = await client.runMethod(address, "is_revoked");
      const isRevoked = revokedResult.stack.readNumber() !== 0;

      return {
        address: agentAddress,
        agentIndex,
        ownerAddress,
        name: content.name,
        description: content.description,
        capabilities: content.capabilities,
        avatarUrl: content.avatarUrl || "",
        isRevoked,
      };
    },
    [getTonClient]
  );

  // Fetch multiple agents by their addresses
  const fetchAgentsByAddresses = useCallback(
    async (addresses: string[]): Promise<AgentData[]> => {
      const agentsList: AgentData[] = [];

      for (const addr of addresses) {
        try {
          const agentData = await fetchAgentData(addr);
          if (agentData) {
            agentsList.push(agentData);
          }
        } catch (error) {
          console.error(`Error fetching agent ${addr}:`, error);
        }
      }

      return agentsList;
    },
    [fetchAgentData]
  );

  // Compute agent address from registry contract
  const computeAgentAddress = useCallback(
    async (agentIndex: number, ownerAddress: string): Promise<string> => {
      if (!registryAddress) {
        throw new Error("Registry address not configured");
      }
      const client = await getTonClient();
      const registry = Address.parse(registryAddress);
      const owner = Address.parse(ownerAddress);

      const result = await client.runMethod(registry, "get_agent_address", [
        { type: "int", value: BigInt(agentIndex) },
        { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
      ]);

      return result.stack.readAddress().toString();
    },
    [getTonClient, registryAddress]
  );

  // Register agent mutation - captures index and tracks address after success
  const registerAgentMutation = useMutation({
    mutationFn: async (content: AgentContent): Promise<{ agentIndex: number; txResult: unknown }> => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      if (!isDeployed || !registryAddress) {
        throw new Error("Agent Registry contract not deployed. Deploy contracts first.");
      }

      // Capture the current agent count - this will be the new agent's index
      const client = await getTonClient();
      const registryAddr = Address.parse(registryAddress);
      const regDataResult = await client.runMethod(registryAddr, "get_registry_data");
      const currentAgentIndex = Number(regDataResult.stack.readBigNumber());

      const contentCell = buildAgentContent(content);

      // Build the message body
      const messageBody = beginCell()
        .storeUint(0x1, 32) // op::register_agent
        .storeUint(Date.now(), 64) // query_id
        .storeRef(contentCell)
        .endCell();

      // Send transaction via TonConnect
      const txResult = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: registryAddress,
            amount: toNano("0.15").toString(),
            payload: messageBody.toBoc().toString("base64"),
          },
        ],
      });

      return { agentIndex: currentAgentIndex, txResult };
    },
    onSuccess: async (data) => {
      // Compute and track the new agent's address
      if (wallet?.account.address) {
        const ownerAddr = Address.parse(wallet.account.address).toString();
        const agentAddress = await computeAgentAddress(data.agentIndex, ownerAddr);
        trackAgentAddress(agentAddress);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["registryData"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  return {
    // Deployment status
    isDeployed,
    registryAddress,
    network,

    // State
    registryData,
    agents: agents ?? [],
    isLoadingRegistry,
    isLoadingAgents,
    registryError,
    agentsError,

    // Wallet state
    isConnected: !!wallet,
    walletAddress: wallet?.account.address,

    // Actions
    registerAgent: registerAgentMutation.mutateAsync,
    isRegistering: registerAgentMutation.isPending,
    registerError: registerAgentMutation.error,
    trackAgentAddress,

    // Queries
    fetchAgentData,
    fetchAgentsByAddresses,
    refetchAgents,
    computeAgentAddress,
  };
}

// Re-export validation utilities for convenience
export { validateAgentContent, AGENT_CONTENT_LIMITS };

export default useAgentRegistry;
