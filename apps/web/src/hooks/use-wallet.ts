"use client";

import { useState, useCallback, useEffect } from "react";
import { createGenlayerClient, getOrCreatePersistentAccount } from "@/services/genlayer/client";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";
import type { Account } from "genlayer-js/types";

interface WalletState {
  account: Account | null;
  address: string | null;
  connected: boolean;
  connecting: boolean;
  walletType: "metamask" | "genlayer" | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    address: null,
    connected: false,
    connecting: false,
    walletType: null,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedType = localStorage.getItem("clario_wallet_type");
    const savedAddr = localStorage.getItem("clario_wallet_address");

    if (savedType === "metamask" && savedAddr && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          const accts = accounts as string[];
          if (accts.length > 0) {
            setState({
              account: null,
              address: accts[0],
              connected: true,
              connecting: false,
              walletType: "metamask",
            });
          }
        })
        .catch(() => {});
    } else if (savedType === "genlayer") {
      const account = getOrCreatePersistentAccount();
      setState({
        account,
        address: account.address,
        connected: true,
        connecting: false,
        walletType: "genlayer",
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else if (state.walletType === "metamask") {
        setState((prev) => ({ ...prev, address: accounts[0] }));
        localStorage.setItem("clario_wallet_address", accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [state.walletType]);

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install it from metamask.io");
    }
    setState((prev) => ({ ...prev, connecting: true }));
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts.length === 0) throw new Error("No accounts found");

      const address = accounts[0];

      localStorage.setItem("clario_wallet_type", "metamask");
      localStorage.setItem("clario_wallet_address", address);

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          wallet_address: address,
        });
      }

      setState({
        account: null,
        address,
        connected: true,
        connecting: false,
        walletType: "metamask",
      });

      return { address };
    } catch (error) {
      setState((prev) => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [user]);

  const connectGenLayer = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true }));
    try {
      const account = getOrCreatePersistentAccount();
      const address = account.address;

      localStorage.setItem("clario_wallet_type", "genlayer");
      localStorage.setItem("clario_wallet_address", address);

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          wallet_address: address,
        });
      }

      setState({
        account,
        address,
        connected: true,
        connecting: false,
        walletType: "genlayer",
      });

      return { account, address };
    } catch (error) {
      setState((prev) => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [user]);

  const connect = connectMetaMask;

  const disconnect = useCallback(() => {
    localStorage.removeItem("clario_wallet_type");
    localStorage.removeItem("clario_wallet_address");
    setState({
      account: null,
      address: null,
      connected: false,
      connecting: false,
      walletType: null,
    });
  }, []);

  const getClient = useCallback(() => {
    if (state.walletType === "genlayer" && state.account) {
      return createGenlayerClient(state.account);
    }
    return createGenlayerClient();
  }, [state.account, state.walletType]);

  const hasMetaMask = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  return {
    ...state,
    connect,
    connectMetaMask,
    connectGenLayer,
    disconnect,
    getClient,
    hasMetaMask,
  };
}
