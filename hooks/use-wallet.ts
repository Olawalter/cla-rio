"use client";

import { useState, useCallback } from "react";
import { createGenlayerClient, createAccount } from "@/services/genlayer/client";
import { createSupabaseClient } from "@/services/supabase/client";
import type { Account } from "genlayer-js/types";

interface WalletState {
  account: Account | null;
  address: string | null;
  connected: boolean;
  connecting: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null,
    address: null,
    connected: false,
    connecting: false,
  });

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true }));
    try {
      const account = createAccount();
      const address = account.address;

      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("users")
          .update({ wallet_address: address })
          .eq("id", user.id);
      }

      setState({
        account,
        address,
        connected: true,
        connecting: false,
      });

      return { account, address };
    } catch (error) {
      setState((prev) => ({ ...prev, connecting: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      account: null,
      address: null,
      connected: false,
      connecting: false,
    });
  }, []);

  const getClient = useCallback(() => {
    if (!state.account) throw new Error("Wallet not connected");
    return createGenlayerClient(state.account);
  }, [state.account]);

  return {
    ...state,
    connect,
    disconnect,
    getClient,
  };
}
