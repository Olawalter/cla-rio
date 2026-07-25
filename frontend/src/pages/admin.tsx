import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, UserPlus, Shield, Building, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useGetRole } from "@/hooks/use-contract";
import { useTransaction } from "@/hooks/use-transaction";
import { TransactionStatus } from "@/components/ui/transaction-status";

const ROLES = ["hospital_admin", "clinician", "reviewer", "auditor"] as const;

export function AdminPage() {
  const { address } = useWallet();
  const { data: role, isLoading: roleLoading, isError: roleError, refetch: refetchRole } = useGetRole(address || "");
  const tx = useTransaction();

  const [grantAddr, setGrantAddr] = useState("");
  const [grantRole, setGrantRole] = useState<string>("clinician");
  const [grantHospital, setGrantHospital] = useState("");

  const [hospitalName, setHospitalName] = useState("");

  const [staffAddr, setStaffAddr] = useState("");
  const [staffRole, setStaffRole] = useState("clinician");

  const isOwner = role === "owner";
  const isAdmin = role === "hospital_admin" || isOwner;

  async function handleRegisterHospital(e: React.FormEvent) {
    e.preventDefault();
    if (!hospitalName.trim()) return;
    await tx.execute("register_hospital", [hospitalName]);
    setHospitalName("");
  }

  async function handleGrantRole(e: React.FormEvent) {
    e.preventDefault();
    if (!grantAddr.trim()) return;
    await tx.execute("grant_role", [grantAddr, grantRole, grantHospital || ""]);
    setGrantAddr("");
  }

  async function handleRegisterStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!staffAddr.trim()) return;
    await tx.execute("register_staff", [staffAddr, staffRole]);
    setStaffAddr("");
  }

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Administration</h1>
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Checking role on-chain…</p>
          <p className="text-xs text-text-tertiary mt-1 font-mono">{address}</p>
        </div>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Administration</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-800">Could not reach the contract. Check your connection.</p>
          <button onClick={() => refetchRole()} className="mt-3 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Administration</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-amber-800">
            You need Hospital Admin or Contract Owner role to access administration.
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Current role: <span className="font-medium capitalize">{(role as string) || "unregistered"}</span>
          </p>
          <button onClick={() => refetchRole()} className="mt-3 rounded-lg border border-amber-300 px-4 py-2 text-xs text-amber-700 hover:bg-amber-100">
            Refresh role
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Administration</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage hospitals, staff, and roles. All changes are recorded on-chain.
        </p>
      </div>

      <TransactionStatus step={tx.step} error={tx.error} txHash={tx.txHash} />

      {isOwner && (
        <div className="rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Building className="h-4.5 w-4.5 text-primary-500" />
            Register Hospital
          </h2>
          <form onSubmit={handleRegisterHospital} className="flex gap-3">
            <input
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="Hospital name"
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={tx.isLoading || !hospitalName.trim()}
              className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              Register
            </button>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-primary-500" />
          Grant Role
        </h2>
        <form onSubmit={handleGrantRole} className="space-y-3">
          <input
            type="text"
            value={grantAddr}
            onChange={(e) => setGrantAddr(e.target.value)}
            placeholder="Wallet address (0x...)"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={grantRole}
              onChange={(e) => setGrantRole(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={grantHospital}
              onChange={(e) => setGrantHospital(e.target.value)}
              placeholder="Hospital ID (optional)"
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={tx.isLoading || !grantAddr.trim()}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            Grant Role
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <UserPlus className="h-4.5 w-4.5 text-primary-500" />
          Register Staff
        </h2>
        <form onSubmit={handleRegisterStaff} className="space-y-3">
          <input
            type="text"
            value={staffAddr}
            onChange={(e) => setStaffAddr(e.target.value)}
            placeholder="Staff wallet address (0x...)"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-mono placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          <select
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={tx.isLoading || !staffAddr.trim()}
            className="rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            Register Staff
          </button>
        </form>
      </div>
    </div>
  );
}
