import Link from "next/link";
import { Shield } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Clario</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Clinical Note Triage Infrastructure
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
