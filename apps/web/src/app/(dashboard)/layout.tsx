"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  Bell,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/submit", label: "Submit Note", icon: PlusCircle },
  { href: "/validator", label: "Validator", icon: Users },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { connected, address, connect, connecting } = useWallet();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Clario</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems
            .filter(
              (item) =>
                !item.roles || (profile && item.roles.includes(profile.role)),
            )
            .map((item) => {
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
          {!connected ? (
            <button
              onClick={() => connect()}
              disabled={connecting}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 text-success" />
              <span className="truncate text-xs font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              {profile?.full_name || "Welcome"}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || "User"}</p>
          </div>
          <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
