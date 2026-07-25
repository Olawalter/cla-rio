import { Shield, ExternalLink, Globe, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useGetRole } from "@/hooks/use-contract";
import { CONTRACT_ADDRESS, GENLAYER_CHAIN } from "@/config/contract";

export function SettingsPage() {
  const { address } = useWallet();
  const { data: role } = useGetRole(address || "");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          System configuration and contract details.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Wallet className="h-4.5 w-4.5 text-primary-500" />
          Wallet
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between items-start">
            <dt className="text-text-tertiary">Address</dt>
            <dd className="text-text-primary font-mono text-xs break-all text-right max-w-xs">
              {address || "Not connected"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Role</dt>
            <dd className="text-text-primary capitalize">
              {(role as string) || "unregistered"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-primary-500" />
          Contract
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between items-start">
            <dt className="text-text-tertiary">Address</dt>
            <dd className="text-text-primary font-mono text-xs break-all text-right max-w-xs">
              {CONTRACT_ADDRESS || "Not configured"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Chain</dt>
            <dd className="text-text-primary">{GENLAYER_CHAIN}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-tertiary">Network</dt>
            <dd className="text-text-primary">StudioNet (Gasless)</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-primary-500" />
          Privacy & Security
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            Browser-side PHI redaction active
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            No PHI stored on-chain — hashes only
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            No external AI services — GenLayer only
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            Immutable on-chain audit trail
          </li>
        </ul>
      </div>
    </div>
  );
}
