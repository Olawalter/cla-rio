"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  Users,
  Settings,
  Wallet,
  User,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useContractRead } from "@/hooks/use-contract";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/submit", label: "Submit Note", icon: PlusCircle },
  { href: "/validator", label: "Validator", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { address } = useWallet();
  const { data: role } = useContractRead("get_role", [address || ""]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-border bg-white flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Clario</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-4 space-y-2">
          {address && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2">
              <Wallet className="h-4 w-4 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">GenLayer Wallet</p>
                <p className="text-xs font-mono text-foreground truncate">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
              </div>
            </div>
          )}
          {role && (
            <div className="px-3 py-1">
              <p className="text-[10px] text-muted-foreground">On-chain role: <span className="text-foreground capitalize">{role as string || "submitter"}</span></p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Loading..."}
            </h2>
            <p className="text-xs text-muted-foreground">GenLayer StudioNet</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
