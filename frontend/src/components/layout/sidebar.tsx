import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileSearch,
  Clock,
  Shield,
  Scale,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useGetRole } from "@/hooks/use-contract";
import { truncateAddress } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/submit", icon: FilePlus, label: "Submit Case" },
  { to: "/cases", icon: FileSearch, label: "All Cases" },
  { to: "/pending", icon: Clock, label: "Pending Consensus" },
  { to: "/reviews", icon: Shield, label: "Manual Reviews" },
  { to: "/challenges", icon: Scale, label: "Challenges" },
  { to: "/audit", icon: Activity, label: "Audit History" },
  { to: "/admin", icon: Settings, label: "Administration" },
];

export function Sidebar() {
  const { address, disconnect } = useWallet();
  const { data: role } = useGetRole(address || "");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">
            Clario
          </h1>
          <p className="text-[10px] text-text-tertiary uppercase tracking-widest">
            Clinical Triage
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        <div className="rounded-lg bg-surface-secondary p-3">
          <p className="text-xs text-text-tertiary mb-1">Connected Wallet</p>
          <p className="text-xs font-mono font-medium text-text-primary">
            {truncateAddress(address || "")}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1 capitalize">
            Role: {(role as string) || "unregistered"}
          </p>
        </div>
        <button
          onClick={disconnect}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
