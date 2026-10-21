// Set in .env.local (see .env.example); trailing slashes are ignored
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/+$/, "");

export interface CampaignVariant {
  id: string;
  name: string;
  tone: string;
  subject: string;
  preview: string;
  body: string;
  cta: string;
  tags: string[];
  estimatedOpenRate: string;
  bestTime: string;
}

export interface CampaignContent {
  variants: CampaignVariant[];
  summary: string;
}

export interface Campaign {
  id: string;
  goal: string;
  audience: string;
  channels: string[];
  content: CampaignContent;
  status: string;
  metrics: {
    openRate: number;
    clickRate: number;
    conversions: number;
    sent: number;
  };
  createdAt: string;
}

export interface PeriodStats {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  replied: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface AnalyticsSummary {
  days: number;
  trackingEnabled: boolean;
  totals: { campaigns: number; lists: number; contacts: number; pending: number };
  current: PeriodStats;
  previous: PeriodStats;
  timeline: { date: string; day: string; sent: number; opens: number; clicks: number; replies: number; bounces: number }[];
  lists: (Omit<PeriodStats, "deliveryRate"> & { _id: string; name: string; lastSentAt: string })[];
  senders: {
    _id: string;
    email: string;
    fromName: string;
    provider: EmailProvider;
    sentLast24h: number;
    dailyLimit: number | null;
    lastSyncedAt?: string;
    lastSyncError?: string;
  }[];
  recentReplies: { _id: string; email: string; name: string; repliedAt: string; sentFrom: string; listName: string }[];
}

export type EmailProvider = "gmail" | "sendgrid";

export interface EmailAccount {
  _id: string;
  email: string;
  fromName: string;
  provider: EmailProvider;
  /** SendGrid only: paste into SendGrid's Event Webhook settings (null until PUBLIC_URL is set) */
  webhookUrl?: string | null;
  createdAt: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
}

export interface ListStats {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  replied: number;
}

export interface ContactList {
  _id: string;
  name: string;
  columns: string[];
  createdAt: string;
  stats: ListStats;
}

export type ContactStatus = "pending" | "queued" | "sent" | "failed" | "bounced";

export interface Contact {
  _id: string;
  row: number;
  email: string;
  name: string;
  fields: Record<string, string>;
  status: ContactStatus;
  error?: string;
  sentAt?: string;
  openedAt?: string;
  openCount?: number;
  clickedAt?: string;
  clickCount?: number;
  repliedAt?: string;
  bouncedAt?: string;
  complainedAt?: string;
  unsubscribedAt?: string;
}

// ─── Auth & billing types ─────────────────────────────────────────────────────

export type PlanId = "free" | "starter" | "essential" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: number | null;
  maxAccounts: number | null;
  dailySends: number | null;
  features: string[];
}

export interface Billing {
  plan: Plan;
  planExpiresAt: string | null;
  expired: boolean;
  usage: { sentLast24h: number; queued: number; accounts: number; remainingToday: number | null };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  hasPassword: boolean;
  googleLinked: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  billing: Billing;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface Payment {
  _id: string;
  plan: "starter" | "essential";
  amount: number;
  currency: string;
  reference: string;
  payerName: string;
  transferId: string;
  note?: string;
  status: PaymentStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  user?: { _id: string; name: string; email: string; plan: PlanId; planExpiresAt?: string };
}

export interface BillingDetails extends Billing {
  wise: { label: string; value: string }[];
  currency: string;
  paymentReference: string;
  payments: Payment[];
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: PlanId;
  effectivePlan: PlanId;
  planExpiresAt?: string;
  createdAt: string;
  usage: { sentLast24h: number; queued: number; accounts: number };
}

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  company?: string;
  volume?: string;
  message?: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

// ─── Session token ────────────────────────────────────────────────────────────

const TOKEN_KEY = "marketos_token";

export const session = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable — session lasts until reload
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

/** Fired when the server rejects the session, so the app can send the user to /login */
export const AUTH_EXPIRED_EVENT = "marketos:auth-expired";

export class ApiError extends Error {
  status: number;
  upgrade: boolean;
  constructor(message: string, status: number, upgrade = false) {
    super(message);
    this.status = status;
    this.upgrade = upgrade;
  }
}

const fetchJSON = async <T>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const token = session.get();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    if (res.status === 401 && token) {
      session.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(err.error || "Request failed", res.status, Boolean(err.upgrade));
  }
  return res.json();
};

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const api = {
  auth: {
    config: () => fetchJSON<{ googleClientId: string | null }>("/api/auth/config"),
    signup: (data: { name: string; email: string; password: string }) =>
      fetchJSON<AuthResponse>("/api/auth/signup", post(data)),
    login: (data: { email: string; password: string }) => fetchJSON<AuthResponse>("/api/auth/login", post(data)),
    google: (credential: string) => fetchJSON<AuthResponse>("/api/auth/google", post({ credential })),
    me: () => fetchJSON<{ user: User; billing: Billing }>("/api/auth/me"),
  },

  billing: {
    plans: () => fetchJSON<{ plans: Plan[] }>("/api/billing/plans"),
    get: () => fetchJSON<BillingDetails>("/api/billing"),
    reportPayment: (data: { plan: string; payerName: string; transferId: string; note: string }) =>
      fetchJSON<{ success: boolean; payment: Payment }>("/api/billing/payments", post(data)),
    enterprise: (data: { name: string; email: string; company: string; volume: string; message: string }) =>
      fetchJSON<{ success: boolean }>("/api/billing/enterprise", post(data)),
  },

  admin: {
    payments: (status?: PaymentStatus) =>
      fetchJSON<{ payments: Payment[] }>(`/api/admin/payments${status ? `?status=${status}` : ""}`),
    review: (id: string, action: "approve" | "reject", note = "") =>
      fetchJSON<{ success: boolean }>(`/api/admin/payments/${id}/review`, post({ action, note })),
    users: () => fetchJSON<{ users: AdminUser[] }>("/api/admin/users"),
    updateUser: (id: string, data: { plan?: PlanId; days?: number; role?: "user" | "admin" }) =>
      fetchJSON<{ success: boolean }>(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    inquiries: () => fetchJSON<{ inquiries: Inquiry[] }>("/api/admin/inquiries"),
    updateInquiry: (id: string, status: Inquiry["status"]) =>
      fetchJSON<{ success: boolean }>(`/api/admin/inquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  campaigns: {
    create: (data: { goal: string; audience: string; channels: string[] }) =>
      fetchJSON<{ success: boolean; campaign: Campaign }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    list: () => fetchJSON<{ campaigns: Campaign[] }>("/api/campaigns"),

    get: (id: string) =>
      fetchJSON<{ campaign: Campaign }>(`/api/campaigns/${id}`),
  },

  email: {
    accounts: () =>
      fetchJSON<{ accounts: EmailAccount[]; tracking: { enabled: boolean }; billing: Billing }>("/api/email/accounts"),

    sync: () =>
      fetchJSON<{ success: boolean; replies: number; bounces: number; errors: string[] }>("/api/email/sync", {
        method: "POST",
      }),

    connect: (data: { provider: EmailProvider; email: string; fromName: string; appPassword?: string; apiKey?: string }) =>
      fetchJSON<{ success: boolean; account: EmailAccount; warnings: string[] }>("/api/email/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    disconnect: (id: string) =>
      fetchJSON<{ success: boolean }>(`/api/email/accounts/${id}`, { method: "DELETE" }),

    lists: () => fetchJSON<{ lists: ContactList[] }>("/api/email/lists"),

    uploadList: (data: { name: string; csv: string }) =>
      fetchJSON<{ success: boolean; list: ContactList; imported: number; invalid: number; duplicates: number }>(
        "/api/email/lists",
        { method: "POST", body: JSON.stringify(data) }
      ),

    contacts: (listId: string) =>
      fetchJSON<{ contacts: Contact[]; stats: ListStats }>(`/api/email/lists/${listId}/contacts`),

    deleteList: (listId: string) =>
      fetchJSON<{ success: boolean }>(`/api/email/lists/${listId}`, { method: "DELETE" }),

    send: (
      listId: string,
      data: { accountId: string; subject: string; body: string; contactIds?: string[]; count?: number }
    ) =>
      fetchJSON<{ success: boolean; queued: number; limitedBy: string | null }>(`/api/email/lists/${listId}/send`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    summary: (days = 7) =>
      fetchJSON<AnalyticsSummary>(
        `/api/analytics/summary?days=${days}&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      ),
  },
};
