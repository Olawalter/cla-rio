"use client";

import { useState, useEffect, useMemo } from "react";
import { createGenlayerClient, createAccount } from "@/services/genlayer/client";
import { generatePrivateKey } from "genlayer-js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase/config";
import { useAuth } from "./use-auth";
import type { Account } from "genlayer-js/types";

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

  // Derive account synchronously from user.uid via useMemo — no useEffect race
  const account = useMemo<Account | null>(() => {
    if (!user?.uid) return null;
    return getOrCreateUserWallet(user.uid);
  }, [user?.uid]);

  const address = account?.address ?? null;
  const connected = !!account;

  // Persist wallet address to user profile (fire-and-forget side effect)
  useEffect(() => {
    if (user?.uid && account && !profile?.wallet_address) {
      updateDoc(doc(db, "users", user.uid), {
        wallet_address: account.address,
      }).catch(() => {});
    }
  }, [user?.uid, account, profile?.wallet_address]);

  const getClient = () => {
    if (account) return createGenlayerClient(account);
    return createGenlayerClient();
  };

  return {
    account,
    address,
    connected,
    getClient,
    connect: async () => {},
    connectMetaMask: async () => {},
    connectGenLayer: async () => {},
    disconnect: () => {},
    connecting: false,
    walletType: "genlayer" as const,
    hasMetaMask: false,
  };
}
