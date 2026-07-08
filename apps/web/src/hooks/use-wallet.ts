"use client";

import { useState, useEffect } from "react";
import { createGenlayerClient, createAccount } from "@/services/genlayer/client";
import { generatePrivateKey } from "genlayer-js";
import type { Account } from "genlayer-js/types";

const STORAGE_KEY = "clario_wallet_pk";

function getOrCreateWallet(): Account {
  if (typeof window === "undefined") return createAccount();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return createAccount(saved as `0x${string}`);
    } catch {
      // corrupted — regenerate
    }
  }
  const pk = generatePrivateKey();
  const account = createAccount(pk);
  localStorage.setItem(STORAGE_KEY, pk);
  return account;
}

export function useWallet() {
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const acc = getOrCreateWallet();
    setAccount(acc);
    setAddress(acc.address);
  }, []);

  const getClient = () => {
    if (account) return createGenlayerClient(account);
    return createGenlayerClient();
  };

  return {
    account,
    address,
    connected: !!account,
    getClient,
  };
}
