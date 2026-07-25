import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Wallet, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

export function ConnectWalletPage() {
  const { address, connected, connecting, error, connect, hasWallet } =
    useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected && address) {
      navigate("/dashboard", { replace: true });
    }
  }, [connected, address, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Connect to Clario
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-xs">
            Connect your wallet to access the clinical triage system.
            All state lives on-chain via GenLayer.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {!hasWallet ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    No wallet detected
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Install MetaMask, Rabby, OKX Wallet, Brave Wallet, or
                    any EVM-compatible wallet extension to continue.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-500 px-5 py-3.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="h-5 w-5" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-surface-secondary p-4">
          <h3 className="text-xs font-medium text-text-secondary mb-2">
            Supported Wallets
          </h3>
          <div className="flex flex-wrap gap-2">
            {["MetaMask", "Rabby", "OKX", "Brave", "Coinbase"].map((w) => (
              <span
                key={w}
                className="rounded-md bg-white px-2.5 py-1 text-xs text-text-secondary border border-border"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
