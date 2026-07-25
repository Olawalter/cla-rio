import { useState, useCallback, useEffect } from "react";
import { createGenlayerClient, createReadOnlyClient } from "@/config/genlayer-client";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = !!address;

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Install MetaMask, Rabby, or another EVM wallet.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Connection rejected by user.");
      } else {
        setError(err.message || "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const getClient = useCallback(() => {
    if (window.ethereum && address) {
      return createGenlayerClient(window.ethereum);
    }
    return createReadOnlyClient();
  }, [address]);

  const getReadOnlyClient = useCallback(() => {
    return createReadOnlyClient();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setAddress(null);
      } else {
        setAddress(accs[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          setAddress(accs[0]);
        }
      })
      .catch(() => {});

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return {
    address,
    connected,
    connecting,
    error,
    connect,
    disconnect,
    getClient,
    getReadOnlyClient,
    hasWallet: !!window.ethereum,
  };
}
