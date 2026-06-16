"use client";

import { useState, useEffect } from "react";
import { createGenlayerClient, createAccount } from "@/services/genlayer/client";
import { generatePrivateKey } from "genlayer-js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";
import type { Account } from "genlayer-js/types";

interface WalletState {
  account: Account | null;
  address: string | null;
  connected: boolean;
}

function getOrCreateUserWallet(userId: string): Account {
  if (typeof window === "undefined") return createAccount();
  const key = `clario_genlayer_pk_${userId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return createAccount(saved as `0x${string}`);
    } catch {
      // corrupted — regenerate
    }
  }
  const pk = generatePrivateKey();
  const account = createAccount(pk);
  localStorage.setItem(key, pk);
  return account;
}

export function useWallet() {
  const { user, profile } = useAuth();
  const [state, setState] = useState<WalletState>({
    account: null,
    address: null,
    connected: false,
  });

  useEffect(() => {
    if (!user) {
      setState({ account: null, address: null, connected: false });
      return;
    }

    const account = getOrCreateUserWallet(user.uid);
    setState({ account, address: account.address, connected: true });

    // Persist wallet address to user profile if not already set
    if (!profile?.wallet_address) {
      updateDoc(doc(db, "users", user.uid), {
        wallet_address: account.address,
      }).catch(() => {});
    }
  }, [user?.uid]);

  const getClient = () => {
    if (state.account) return createGenlayerClient(state.account);
    return createGenlayerClient();
  };

  return {
    ...state,
    getClient,
    // Kept for API compatibility — no-ops since wallet is always auto-connected
    connect: async () => {},
    connectMetaMask: async () => {},
    connectGenLayer: async () => {},
    disconnect: () => {},
    connecting: false,
    walletType: "genlayer" as const,
    hasMetaMask: false,
  };
}
