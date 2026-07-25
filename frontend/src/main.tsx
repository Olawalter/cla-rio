import { StrictMode } from "react";
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
  const { connected } = useWallet();
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
    <App />
  </StrictMode>
);
