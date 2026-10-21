"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  api,
  type Campaign,
  type Contact,
  type ContactList,
  type ContactStatus,
  type EmailAccount,
  type EmailProvider,
  type ListStats,
} from "@/services/api";

const STATUS_COLORS: Record<ContactStatus, string> = {
  pending: "var(--text-muted)",
  queued: "var(--orange)",
  sent: "var(--green)",
  failed: "var(--pink)",
  bounced: "hsl(0, 75%, 62%)",
};

const SAMPLE_CSV = `email,first_name,last_name,company,role
ali.khan@example.com,Ali,Khan,Acme Inc,Founder
sara.ahmed@example.com,Sara,Ahmed,BrightLabs,Marketing Manager
john.smith@example.com,John,Smith,"Smith & Co, LLC",CEO`;

const FILTERS: ("all" | ContactStatus)[] = ["all", "pending", "queued", "sent", "bounced", "failed"];

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

const shortDate = (d?: string) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

function Engagement({ at, count, label }: { at?: string; count?: number; label: string }) {
  if (!at) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  return (
    <span title={`${label} ${shortDate(at)}`} style={{ color: "var(--green)", fontSize: "12px", whiteSpace: "nowrap" }}>
      ✓{count && count > 1 ? ` ×${count}` : ""}
    </span>
  );
}

function StatusPill({ status }: { status: ContactStatus }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 10px",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        color: STATUS_COLORS[status],
        textTransform: "capitalize",
      }}
    >
      {status === "queued" ? "sending…" : status}
    </span>
  );
}

function StatsRow({ stats }: { stats: ListStats }) {
  return (
    <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "var(--text-muted)", flexWrap: "wrap" }}>
      <span>{stats.total} total</span>
      <span style={{ color: STATUS_COLORS.pending }}>{stats.pending} pending</span>
      {stats.queued > 0 && <span style={{ color: STATUS_COLORS.queued }}>{stats.queued} sending</span>}
      <span style={{ color: STATUS_COLORS.sent }}>{stats.sent} sent</span>
      {stats.bounced > 0 && <span style={{ color: STATUS_COLORS.bounced }}>{stats.bounced} bounced</span>}
      {stats.failed > 0 && <span style={{ color: STATUS_COLORS.failed }}>{stats.failed} failed</span>}
    </div>
  );
}

function EngagementStats({ stats, tracking }: { stats: ListStats; tracking: boolean }) {
  // Rates are out of emails that reached the recipient's server (sent, not bounced)
  const delivered = stats.sent;
  const attempted = stats.sent + stats.bounced;
  const items = [
    { label: "Delivered", value: delivered, rate: pct(delivered, attempted), color: "var(--green)" },
    { label: "Opened", value: stats.opened, rate: tracking || stats.opened ? pct(stats.opened, delivered) : "off", color: "var(--cyan)" },
    { label: "Clicked", value: stats.clicked, rate: tracking || stats.clicked ? pct(stats.clicked, delivered) : "off", color: "var(--blue)" },
    { label: "Replied", value: stats.replied, rate: pct(stats.replied, delivered), color: "var(--purple)" },
    { label: "Bounced", value: stats.bounced, rate: pct(stats.bounced, attempted), color: STATUS_COLORS.bounced },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
      {items.map((i) => (
        <div key={i.label}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{i.label}</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: i.color }}>{i.rate}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{i.value.toLocaleString()} contacts</div>
        </div>
      ))}
    </div>
  );
}

function ProviderBadge({ provider }: { provider: EmailProvider }) {
  return (
    <span
      style={{
        fontSize: "10.5px",
        fontWeight: 700,
        padding: "1px 7px",
        borderRadius: "999px",
        border: "1px solid var(--border)",
        color: provider === "sendgrid" ? "var(--blue)" : "var(--pink)",
      }}
    >
      {provider === "sendgrid" ? "SendGrid" : "Gmail"}
    </span>
  );
}

/** Where to paste the Event Webhook URL so SendGrid bounces and spam reports reach MarketOS */
function SendGridWebhookSetup({ account, onClose }: { account: EmailAccount; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin: "4px 0 16px", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-secondary)" }}>
      <div className="flex justify-between items-center" style={{ marginBottom: "6px" }}>
        <strong style={{ color: "var(--text-primary)" }}>Track SendGrid bounces & spam reports</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {account.webhookUrl ? (
        <>
          <ol style={{ margin: "0 0 10px", paddingLeft: "18px" }}>
            <li>
              Open SendGrid →{" "}
              <a href="https://app.sendgrid.com/settings/mail_settings" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                Settings → Mail Settings → Event Webhook
              </a>
            </li>
            <li>Paste this as the HTTP Post URL, tick <strong>Bounced, Dropped, Spam Reports</strong> and <strong>Unsubscribes</strong>, and enable it.</li>
          </ol>
          <div className="flex gap-2">
            <input className="form-input" readOnly value={account.webhookUrl} onFocus={(e) => e.target.select()} style={{ fontSize: "12px" }} />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(account.webhookUrl!).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }).catch(() => {});
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: 0 }}>
          Emails will send fine. To also record bounces and spam reports, set <code>PUBLIC_URL</code> in <code>backend/.env</code> to a
          public address for the backend — a webhook URL to paste into SendGrid will then appear here.
        </p>
      )}
      <p style={{ margin: "10px 0 0", color: "var(--text-muted)" }}>
        Replies go to {account.email}. To have replies detected automatically, also connect that address as a Gmail account.
      </p>
    </div>
  );
}

export default function EmailSenderPage() {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Accounts
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const EMPTY_CONNECT = { provider: "gmail" as EmailProvider, email: "", fromName: "", appPassword: "", apiKey: "" };
  const [connectForm, setConnectForm] = useState(EMPTY_CONNECT);
  const [webhookNotice, setWebhookNotice] = useState<EmailAccount | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const { billing, refresh: refreshBilling } = useAuth();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Lists
  const [lists, setLists] = useState<ContactList[]>([]);
  const [listId, setListId] = useState("");
  const [listName, setListName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ListStats | null>(null);
  const [filter, setFilter] = useState<"all" | ContactStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchSize, setBatchSize] = useState(10);

  // Compose
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const errMsg = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

  const loadAccounts = useCallback(async () => {
    const { accounts, tracking } = await api.email.accounts();
    setAccounts(accounts);
    setTrackingEnabled(tracking.enabled);
    setAccountId((cur) => (accounts.some((a) => a._id === cur) ? cur : accounts[0]?._id || ""));
    if (!accounts.length) setShowConnect(true);
  }, []);

  const loadLists = useCallback(async () => {
    const { lists } = await api.email.lists();
    setLists(lists);
    setListId((cur) => (lists.some((l) => l._id === cur) ? cur : lists[0]?._id || ""));
  }, []);

  const loadContacts = useCallback(async (id: string) => {
    if (!id) {
      setContacts([]);
      setStats(null);
      return;
    }
    const data = await api.email.contacts(id);
    setContacts(data.contacts);
    setStats(data.stats);
    setLists((prev) => prev.map((l) => (l._id === id ? { ...l, stats: data.stats } : l)));
  }, []);

  useEffect(() => {
    loadAccounts().catch((e) => showToast(errMsg(e), "error"));
    loadLists().catch((e) => showToast(errMsg(e), "error"));
    api.campaigns.list().then((d) => setCampaigns(d.campaigns)).catch(() => {});
  }, [loadAccounts, loadLists]);

  useEffect(() => {
    setSelected(new Set());
    loadContacts(listId).catch((e) => showToast(errMsg(e), "error"));
  }, [listId, loadContacts]);

  // Poll while a batch is sending
  const isSending = (stats?.queued ?? 0) > 0;
  useEffect(() => {
    if (!isSending || !listId) return;
    const t = setInterval(() => loadContacts(listId).catch(() => {}), 2000);
    return () => clearInterval(t);
  }, [isSending, listId, loadContacts]);

  // Update the "emails left today" count when a batch finishes
  useEffect(() => {
    if (!isSending) refreshBilling();
  }, [isSending, refreshBilling]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const { provider, email, fromName, appPassword, apiKey } = connectForm;
      const { account, warnings } = await api.email.connect(
        provider === "gmail" ? { provider, email, fromName, appPassword } : { provider, email, fromName, apiKey }
      );
      await Promise.all([loadAccounts(), refreshBilling()]);
      setAccountId(account._id);
      setConnectForm(EMPTY_CONNECT);
      setShowConnect(false);
      if (account.provider === "sendgrid") setWebhookNotice(account);
      if (warnings?.length) showToast(warnings[0], "error");
      else showToast(`Connected ${account.email}${account.provider === "sendgrid" ? " via SendGrid" : ""}`, "success");
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    try {
      await api.email.disconnect(id);
      await Promise.all([loadAccounts(), refreshBilling()]);
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setUploading(true);
    try {
      const csv = await csvFile.text();
      const name = listName.trim() || csvFile.name.replace(/\.csv$/i, "");
      const res = await api.email.uploadList({ name, csv });
      await loadLists();
      setListId(res.list._id);
      setListName("");
      setCsvFile(null);
      const fileInput = document.getElementById("csv-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      const skipped = [res.invalid && `${res.invalid} invalid`, res.duplicates && `${res.duplicates} duplicates`].filter(Boolean).join(", ");
      showToast(`Imported ${res.imported} contacts${skipped ? ` (skipped ${skipped})` : ""}`, "success");
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!listId || !confirm("Delete this list and all its contacts?")) return;
    try {
      await api.email.deleteList(listId);
      await loadLists();
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  };

  const loadVariant = (value: string) => {
    if (!value) return;
    const [cid, idx] = value.split("|");
    const variant = campaigns.find((c) => (c as Campaign & { _id?: string })._id === cid || c.id === cid)?.content?.variants?.[Number(idx)];
    if (!variant) return;
    setSubject(variant.subject);
    setBody([variant.body, variant.cta].filter(Boolean).join("\n\n"));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.email.sync();
      await Promise.all([loadContacts(listId), loadAccounts()]);
      if (res.errors.length) showToast(res.errors[0], "error");
      else showToast(`Inbox checked — ${res.replies} new replies, ${res.bounces} new bounces`, "success");
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setSyncing(false);
    }
  };

  const currentAccount = accounts.find((a) => a._id === accountId);

  const send = async (mode: "selected" | "next") => {
    if (!accountId) return showToast("Connect a Gmail account first", "error");
    if (!subject.trim() || !body.trim()) return showToast("Write a subject and message first", "error");

    const n = mode === "selected" ? selected.size : Math.min(batchSize, stats?.pending ?? 0);
    const from = accounts.find((a) => a._id === accountId)?.email;
    if (!n) return showToast(mode === "selected" ? "Select some contacts first" : "No pending contacts left", "error");
    if (!confirm(`Send this email to ${n} contact${n === 1 ? "" : "s"} from ${from}?`)) return;

    setSending(true);
    try {
      const res = await api.email.send(listId, {
        accountId,
        subject,
        body,
        ...(mode === "selected" ? { contactIds: [...selected] } : { count: batchSize }),
      });
      setSelected(new Set());
      showToast(
        res.limitedBy ? `Sending to ${res.queued} contacts — the rest are over your ${res.limitedBy}` : `Sending to ${res.queued} contacts…`,
        "success"
      );
      await Promise.all([loadContacts(listId), refreshBilling()]);
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setSending(false);
    }
  };

  // ─── Selection helpers ─────────────────────────────────────────────────────

  const visible = useMemo(
    () => (filter === "all" ? contacts : contacts.filter((c) => c.status === filter)),
    [contacts, filter]
  );
  const selectable = (c: Contact) => c.status === "pending" || c.status === "failed";

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectFirstN = () =>
    setSelected(new Set(contacts.filter((c) => c.status === "pending").slice(0, batchSize).map((c) => c._id)));

  const visibleSelectable = visible.filter(selectable);
  const allVisibleSelected = visibleSelectable.length > 0 && visibleSelectable.every((c) => selected.has(c._id));
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visibleSelectable.forEach((c) => (allVisibleSelected ? next.delete(c._id) : next.add(c._id)));
      return next;
    });

  const placeholders = ["first_name", "name", "email", ...(lists.find((l) => l._id === listId)?.columns ?? [])]
    .filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Email Sender</h1>
        <p className="page-subtitle">Connect Gmail or SendGrid, upload a CSV of contacts, and send in batches.</p>
      </div>

      {billing && (
        <div
          className="card flex justify-between items-center"
          style={{ marginBottom: "20px", padding: "14px 20px", gap: "12px", flexWrap: "wrap", fontSize: "13px" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{billing.plan.name} plan</strong>
            {" · "}
            {billing.usage.remainingToday == null
              ? "unlimited emails"
              : `${billing.usage.remainingToday} of ${billing.plan.dailySends} emails left today`}
            {" · "}
            {billing.usage.accounts} of {billing.plan.maxAccounts ?? "∞"} sending account{billing.plan.maxAccounts === 1 ? "" : "s"}
          </span>
          {billing.plan.id !== "enterprise" && (
            <Link href="/billing" className="btn btn-secondary btn-sm">
              ⚡ Upgrade
            </Link>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        {/* ── 1. Sender account ── */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: "16px" }}>
            <h2 className="table-title">1. Sender account</h2>
            {accounts.length > 0 &&
              (billing?.plan.maxAccounts != null && accounts.length >= billing.plan.maxAccounts && !showConnect ? (
                <Link href="/billing" style={{ fontSize: "12px", color: "var(--purple)" }}>
                  Upgrade to add more accounts
                </Link>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowConnect((v) => !v)}>
                  {showConnect ? "Cancel" : "+ Connect another"}
                </button>
              ))}
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-col gap-2" style={{ marginBottom: showConnect ? "20px" : 0 }}>
              {accounts.map((a) => (
                <label
                  key={a._id}
                  className="flex items-center justify-between"
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${accountId === a._id ? "var(--purple)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="account" checked={accountId === a._id} onChange={() => setAccountId(a._id)} />
                    <span>
                      <div className="flex items-center gap-2" style={{ fontSize: "13.5px", fontWeight: 600 }}>
                        {a.email}
                        <ProviderBadge provider={a.provider} />
                      </div>
                      {a.fromName && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sends as “{a.fromName}”</div>}
                      {a.provider === "sendgrid" && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "0", fontSize: "11.5px", color: "var(--blue)" }}
                          onClick={(e) => {
                            e.preventDefault();
                            setWebhookNotice(webhookNotice?._id === a._id ? null : a);
                          }}
                        >
                          {webhookNotice?._id === a._id ? "Hide bounce tracking setup" : "Bounce tracking setup"}
                        </button>
                      )}
                    </span>
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(a._id)}>
                    Disconnect
                  </button>
                </label>
              ))}
            </div>
          )}

          {webhookNotice && <SendGridWebhookSetup account={webhookNotice} onClose={() => setWebhookNotice(null)} />}

          {showConnect && (
            <form onSubmit={handleConnect}>
              <div className="flex" role="tablist" aria-label="Sending service" style={{ gap: "6px", marginBottom: "16px" }}>
                {(
                  [
                    ["gmail", "Gmail / Workspace"],
                    ["sendgrid", "SendGrid"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={connectForm.provider === id}
                    className={`btn btn-sm ${connectForm.provider === id ? "btn-secondary" : "btn-ghost"}`}
                    style={{ flex: 1 }}
                    onClick={() => setConnectForm({ ...connectForm, provider: id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">
                  {connectForm.provider === "gmail" ? "Gmail / Google Workspace address" : "From address (verified in SendGrid)"}
                </label>
                <input
                  className="form-input"
                  type="email"
                  required
                  placeholder="hello@auditbenchai.com"
                  value={connectForm.email}
                  onChange={(e) => setConnectForm({ ...connectForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sender name (optional)</label>
                <input
                  className="form-input"
                  placeholder="AuditBench AI"
                  value={connectForm.fromName}
                  onChange={(e) => setConnectForm({ ...connectForm, fromName: e.target.value })}
                />
              </div>
              {connectForm.provider === "gmail" ? (
                <div className="form-group">
                  <label className="form-label">App Password</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={connectForm.appPassword}
                    onChange={(e) => setConnectForm({ ...connectForm, appPassword: e.target.value })}
                  />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5 }}>
                    Not your normal password. Turn on 2-Step Verification, then create one at{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                      myaccount.google.com/apppasswords
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">SendGrid API key</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    autoComplete="off"
                    placeholder="SG.xxxxxxxx…"
                    value={connectForm.apiKey}
                    onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })}
                  />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5 }}>
                    In SendGrid go to{" "}
                    <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                      Settings → API Keys
                    </a>{" "}
                    and create a key with <strong>Mail Send</strong> access. The from address must be a{" "}
                    <a href="https://app.sendgrid.com/settings/sender_auth" target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
                      verified sender or authenticated domain
                    </a>
                    .
                  </p>
                </div>
              )}
              <button className="btn btn-primary w-full" disabled={connecting}>
                {connecting ? <span className="spinner" /> : connectForm.provider === "gmail" ? "Connect Gmail" : "Connect SendGrid"}
              </button>
            </form>
          )}
        </div>

        {/* ── 2. Contacts ── */}
        <div className="card">
          <h2 className="table-title" style={{ marginBottom: "16px" }}>2. Contact list</h2>

          {lists.length > 0 && (
            <div className="form-group">
              <label className="form-label">Send to list</label>
              <div className="flex gap-2">
                <select className="form-select" value={listId} onChange={(e) => setListId(e.target.value)} style={{ flex: 1 }}>
                  {lists.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} — {l.stats.sent}/{l.stats.total} sent
                    </option>
                  ))}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={handleDeleteList} title="Delete list">
                  🗑
                </button>
              </div>
              {stats && <div style={{ marginTop: "8px" }}><StatsRow stats={stats} /></div>}
            </div>
          )}

          <form onSubmit={handleUpload} style={{ borderTop: lists.length ? "1px solid var(--border)" : "none", paddingTop: lists.length ? "16px" : 0 }}>
            <label className="form-label">Upload a new CSV</label>
            <input
              id="csv-file"
              className="form-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              style={{ marginBottom: "10px" }}
            />
            <input
              className="form-input"
              placeholder="List name (defaults to file name)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              style={{ marginBottom: "10px" }}
            />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.5 }}>
              Needs an <code>email</code> column. <code>name</code> or <code>first_name</code> and any other columns become
              placeholders. Invalid and duplicate emails are skipped.
            </p>
            <div style={{ marginBottom: "12px" }}>
              <div className="flex justify-between items-center" style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Example CSV</span>
                <a href="/sample-contacts.csv" download style={{ fontSize: "12px", color: "var(--blue)" }}>
                  ⬇ Download example
                </a>
              </div>
              <pre
                style={{
                  fontSize: "11.5px",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {SAMPLE_CSV}
              </pre>
            </div>
            <button className="btn btn-secondary w-full" disabled={!csvFile || uploading}>
              {uploading ? <span className="spinner" /> : "Import contacts"}
            </button>
          </form>
        </div>
      </div>

      {/* ── 3. Compose ── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
          <h2 className="table-title">3. Message</h2>
          {campaigns.some((c) => c.content?.variants?.length) && (
            <select className="form-select" defaultValue="" onChange={(e) => loadVariant(e.target.value)} style={{ maxWidth: "320px" }}>
              <option value="">Load from an AI campaign…</option>
              {campaigns.map((c) => {
                const cid = (c as Campaign & { _id?: string })._id || c.id;
                return c.content?.variants?.map((v, i) => (
                  <option key={`${cid}-${i}`} value={`${cid}|${i}`}>
                    {c.goal.slice(0, 40)} — {v.name}
                  </option>
                ));
              })}
            </select>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick question, {{first_name}}" />
        </div>
        <div className="form-group" style={{ marginBottom: "8px" }}>
          <label className="form-label">Body</label>
          <textarea
            className="form-textarea"
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Hi {{first_name}},\n\n…"}
          />
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          Placeholders:
          {placeholders.map((p) => (
            <button
              key={p}
              type="button"
              className="tag"
              style={{ cursor: "pointer" }}
              onClick={() => setBody((b) => `${b}{{${p}}}`)}
            >
              {`{{${p}}}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Batch send ── */}
      {listId && (
        <div className="table-card">
          <div className="table-header" style={{ flexWrap: "wrap", gap: "12px" }}>
            <span className="table-title">4. Choose who gets this batch</span>
            <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Batch size</span>
              <input
                type="number"
                min={1}
                max={500}
                className="form-input"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                style={{ width: "80px" }}
              />
              <button className="btn btn-ghost btn-sm" onClick={selectFirstN} disabled={isSending}>
                Select first {batchSize} pending
              </button>
              {selected.size > 0 ? (
                <button className="btn btn-primary btn-sm" onClick={() => send("selected")} disabled={sending || isSending}>
                  Send to {selected.size} selected
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => send("next")} disabled={sending || isSending || !stats?.pending}>
                  Send to next {Math.min(batchSize, stats?.pending ?? 0)} pending
                </button>
              )}
            </div>
          </div>

          {stats && stats.sent + stats.bounced > 0 && (
            <>
              <EngagementStats stats={stats} tracking={trackingEnabled} />
              <div
                className="flex justify-between items-center"
                style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}
              >
                <span>
                  Replies and bounces are checked every 5 minutes
                  {currentAccount?.lastSyncedAt && ` · last checked ${shortDate(currentAccount.lastSyncedAt)}`}
                  {currentAccount?.lastSyncError && <span style={{ color: "var(--pink)" }}> · {currentAccount.lastSyncError}</span>}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handleSync} disabled={syncing}>
                  {syncing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "↻ Check inbox now"}
                </button>
              </div>
            </>
          )}

          {!trackingEnabled && (
            <div style={{ padding: "10px 20px", fontSize: "12px", color: "var(--orange)", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
              Open and click tracking is off. Set <code>PUBLIC_URL</code> in <code>backend/.env</code> to a public address for this
              backend (for example an ngrok URL) so recipients&apos; mail apps can reach it. Replies and bounces are tracked either way.
            </div>
          )}

          {isSending && (
            <div style={{ padding: "12px 20px", fontSize: "13px", color: "var(--orange)", display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Sending — {stats?.queued} left in this batch. You can leave this page; it keeps going.
            </div>
          )}

          <div className="flex gap-2" style={{ padding: "10px 20px", flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => setFilter(f)}
                style={{ textTransform: "capitalize" }}
              >
                {f}
                {stats && f !== "all" ? ` (${stats[f]})` : stats ? ` (${stats.total})` : ""}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <span className="empty-state-icon">📭</span>
              <div className="empty-state-title">No contacts here</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto", maxHeight: "560px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "36px" }}>
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!visibleSelectable.length} />
                    </th>
                    <th>#</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Opened</th>
                    <th>Clicked</th>
                    <th>Replied</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c._id} onClick={() => selectable(c) && toggle(c._id)} style={{ cursor: selectable(c) ? "pointer" : "default" }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(c._id)}
                          disabled={!selectable(c)}
                          onChange={() => toggle(c._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.row}</td>
                      <td style={{ fontSize: "13px" }}>{c.email}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{c.name || "—"}</td>
                      <td>
                        <StatusPill status={c.status} />
                      </td>
                      <td>
                        <Engagement at={c.openedAt} count={c.openCount} label="First opened" />
                      </td>
                      <td>
                        <Engagement at={c.clickedAt} count={c.clickCount} label="First clicked" />
                      </td>
                      <td>
                        <Engagement at={c.repliedAt} label="Replied" />
                      </td>
                      <td style={{ fontSize: "12px", color: c.error ? "var(--pink)" : "var(--text-muted)", maxWidth: "280px" }}>
                        {c.error ? c.error : c.sentAt ? `Sent ${shortDate(c.sentAt)}` : ""}
                        {c.complainedAt && <div style={{ color: "var(--pink)" }}>⚠ Marked as spam</div>}
                        {c.unsubscribedAt && <div style={{ color: "var(--orange)" }}>Unsubscribed</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
