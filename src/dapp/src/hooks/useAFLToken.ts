import { useCallback } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Address, beginCell, toNano } from "@ton/core";
import { TonClient } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import {
  getAFLMinterAddress,
  isContractDeployed,
  getNetwork,
} from "../config/contracts";

export interface JettonData {
  totalSupply: bigint;
  mintable: boolean;
  adminAddress: string;
}

export function useAFLToken() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const queryClient = useQueryClient();

  const minterAddress = getAFLMinterAddress();
  const isDeployed = isContractDeployed(minterAddress);
  const network = getNetwork();

  // Get TonClient
  const getTonClient = useCallback(async () => {
    const endpoint = await getHttpEndpoint({ network });
    return new TonClient({ endpoint });
  }, [network]);

  // Fetch jetton data - only if contract is deployed
  const {
    data: jettonData,
    isLoading: isLoadingJetton,
    error: jettonError,
  } = useQuery({
    queryKey: ["jettonData", minterAddress],
    queryFn: async (): Promise<JettonData | null> => {
      if (!isDeployed || !minterAddress) {
        return null;
      }

      const client = await getTonClient();
      const address = Address.parse(minterAddress);

      // Check if contract exists
      const state = await client.getContractState(address);
      if (state.state !== "active") {
        console.warn("AFL Minter contract not active");
        return null;
      }

      const result = await client.runMethod(address, "get_jetton_data");

      return {
        totalSupply: result.stack.readBigNumber(),
        mintable: result.stack.readNumber() !== 0,
        adminAddress: result.stack.readAddress().toString(),
      };
    },
    enabled: isDeployed,
    staleTime: 30000,
    retry: 1,
  });

  // Get user's wallet address for AFL tokens
  const getUserWalletAddress = useCallback(
    async (ownerAddress: string): Promise<string | null> => {
      if (!isDeployed || !minterAddress) {
        return null;
      }

      try {
        const client = await getTonClient();
        const minter = Address.parse(minterAddress);
        const owner = Address.parse(ownerAddress);

        const result = await client.runMethod(minter, "get_wallet_address", [
          { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
        ]);

        return result.stack.readAddress().toString();
      } catch (error) {
        console.error("Error getting wallet address:", error);
        return null;
      }
    },
    [getTonClient, isDeployed, minterAddress]
  );

  // Fetch user's AFL balance
  const {
    data: userBalance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useQuery({
    queryKey: ["aflBalance", wallet?.account.address, minterAddress],
    queryFn: async (): Promise<bigint> => {
      if (!wallet || !isDeployed) return BigInt(0);

      try {
        const walletAddress = await getUserWalletAddress(wallet.account.address);
        if (!walletAddress) return BigInt(0);

        const client = await getTonClient();
        const address = Address.parse(walletAddress);

        // Check if wallet exists
        const state = await client.getContractState(address);
        if (state.state !== "active") return BigInt(0);

        const result = await client.runMethod(address, "get_wallet_data");
        return result.stack.readBigNumber();
      } catch (error) {
        console.error("Error fetching balance:", error);
        return BigInt(0);
      }
    },
    enabled: !!wallet && isDeployed,
    staleTime: 30000,
    retry: 1,
  });

  // Transfer AFL tokens
  const transferMutation = useMutation({
    mutationFn: async ({
      toAddress,
      amount,
      forwardTonAmount = BigInt(0),
    }: {
      toAddress: string;
      amount: bigint;
      forwardTonAmount?: bigint;
    }) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      if (!isDeployed) {
        throw new Error("AFL Token contract not deployed. Deploy contracts first.");
      }

      const userWalletAddress = await getUserWalletAddress(wallet.account.address);
      if (!userWalletAddress) {
        throw new Error("AFL wallet not found. You may not have any AFL tokens.");
      }

      const destination = Address.parse(toAddress);

      // Build transfer message
      const messageBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // op::transfer
        .storeUint(Date.now(), 64) // query_id
        .storeCoins(amount)
        .storeAddress(destination)
        .storeAddress(Address.parse(wallet.account.address)) // response_destination
        .storeUint(0, 1) // custom_payload flag
        .storeCoins(forwardTonAmount)
        .storeUint(0, 1) // forward_payload flag
        .endCell();

      // Send transaction
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: userWalletAddress,
            amount: toNano("0.1").toString(),
            payload: messageBody.toBoc().toString("base64"),
          },
        ],
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aflBalance"] });
    },
  });

  // Burn AFL tokens
  const burnMutation = useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      if (!isDeployed) {
        throw new Error("AFL Token contract not deployed. Deploy contracts first.");
      }

      const userWalletAddress = await getUserWalletAddress(wallet.account.address);
      if (!userWalletAddress) {
        throw new Error("AFL wallet not found. You may not have any AFL tokens.");
      }

      // Build burn message
      const messageBody = beginCell()
        .storeUint(0x595f07bc, 32) // op::burn
        .storeUint(Date.now(), 64) // query_id
        .storeCoins(amount)
        .storeAddress(Address.parse(wallet.account.address)) // response_destination
        .endCell();

      // Send transaction
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: userWalletAddress,
            amount: toNano("0.05").toString(),
            payload: messageBody.toBoc().toString("base64"),
          },
        ],
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aflBalance"] });
      queryClient.invalidateQueries({ queryKey: ["jettonData"] });
    },
  });

  // Format balance for display (9 decimals)
  const formatBalance = useCallback((balance: bigint): string => {
    const divisor = BigInt(10 ** 9);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    const fractionalStr = fractionalPart.toString().padStart(9, "0").replace(/0+$/, "");

    if (fractionalStr) {
      return `${wholePart.toLocaleString()}.${fractionalStr}`;
    }
    return wholePart.toLocaleString();
  }, []);

  // Parse amount from string (9 decimals)
  const parseAmount = useCallback((amount: string): bigint => {
    const [whole, fractional = ""] = amount.split(".");
    const paddedFractional = fractional.padEnd(9, "0").slice(0, 9);
    return BigInt(whole || "0") * BigInt(10 ** 9) + BigInt(paddedFractional);
  }, []);

  return {
    // Deployment status
    isDeployed,
    minterAddress,
    network,

    // State
    jettonData,
    isLoadingJetton,
    jettonError,
    userBalance: userBalance ?? BigInt(0),
    isLoadingBalance,
    balanceError,

    // Wallet state
    isConnected: !!wallet,
    walletAddress: wallet?.account.address,

    // Actions
    transfer: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
    transferError: transferMutation.error,

    burn: burnMutation.mutateAsync,
    isBurning: burnMutation.isPending,
    burnError: burnMutation.error,

    // Utilities
    formatBalance,
    parseAmount,
    getUserWalletAddress,

    // Constants
    symbol: "AFL",
    decimals: 9,
  };
}

export default useAFLToken;
