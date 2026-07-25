import { StrictMode, Component } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./index.css";

import { useWallet } from "@/hooks/use-wallet";
import { AppLayout } from "@/components/layout/app-layout";
import { LandingPage } from "@/pages/landing";
import { ConnectWalletPage } from "@/pages/connect-wallet";
import { DashboardPage } from "@/pages/dashboard";
import { SubmitCasePage } from "@/pages/submit-case";
import { CasesPage } from "@/pages/cases";
import { CaseDetailPage } from "@/pages/case-detail";
import { PendingPage } from "@/pages/pending";
import { ReviewsPage } from "@/pages/reviews";
import { ChallengesPage } from "@/pages/challenges";
import { AuditPage } from "@/pages/audit";
import { AdminPage } from "@/pages/admin";
import { SettingsPage } from "@/pages/settings";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-600 mb-2">Something went wrong</p>
            <p className="text-sm text-text-secondary mb-4">{(this.state.error as Error).message}</p>
            <button onClick={() => window.location.reload()} className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600">
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { connected, loading } = useWallet();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-surface-secondary"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /></div>;
  if (!connected) return <Navigate to="/connect" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/connect" element={<ConnectWalletPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/submit" element={<SubmitCasePage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:caseId" element={<CaseDetailPage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
