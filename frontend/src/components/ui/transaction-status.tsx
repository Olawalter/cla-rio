import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Wallet, Send, Clock } from "lucide-react";
import type { TxStep } from "@/hooks/use-contract";
import { TX_STEP_LABELS } from "@/hooks/use-transaction";

const STEP_ICONS: Record<TxStep, React.ReactNode> = {
  idle: null,
  waiting_wallet: <Wallet className="h-5 w-5" />,
  submitted: <Send className="h-5 w-5" />,
  pending_consensus: <Clock className="h-5 w-5" />,
  finalized: <CheckCircle className="h-5 w-5" />,
  failed: <XCircle className="h-5 w-5" />,
};

const STEP_COLORS: Record<TxStep, string> = {
  idle: "",
  waiting_wallet: "bg-amber-50 border-amber-200 text-amber-700",
  submitted: "bg-blue-50 border-blue-200 text-blue-700",
  pending_consensus: "bg-primary-50 border-primary-200 text-primary-700",
  finalized: "bg-green-50 border-green-200 text-green-700",
  failed: "bg-red-50 border-red-200 text-red-700",
};

const ORDERED_STEPS: TxStep[] = [
  "waiting_wallet",
  "submitted",
  "pending_consensus",
  "finalized",
];

export function TransactionStatus({
  step,
  error,
}: {
  step: TxStep;
  error: string | null;
}) {
  if (step === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${STEP_COLORS[step]}`}
      >
        {step !== "finalized" && step !== "failed" ? (
          <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
        ) : (
          <span className="flex-shrink-0">{STEP_ICONS[step]}</span>
        )}
        <span className="text-sm font-medium">
          {error || TX_STEP_LABELS[step]}
        </span>
      </div>

      <div className="flex gap-1.5">
        {ORDERED_STEPS.map((s) => {
          const idx = ORDERED_STEPS.indexOf(s);
          const currentIdx = ORDERED_STEPS.indexOf(step);
          const isActive = step === "failed" ? false : currentIdx >= idx;
          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                isActive ? "bg-primary-500" : "bg-gray-200"
              }`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
