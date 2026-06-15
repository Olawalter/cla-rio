export const APP_NAME = "Clario";
export const APP_DESCRIPTION =
  "Privacy-preserving, explainable, decentralized clinical workflow infrastructure for administrative note triage and audit.";

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  walletConnect: "/wallet-connect",
  dashboard: "/dashboard",
  submitNote: "/submit",
  noteDetail: (id: string) => `/notes/${id}`,
  validator: "/validator",
  admin: "/admin",
} as const;

export const SUPABASE_STORAGE_BUCKETS = {
  attachments: "attachments",
} as const;
