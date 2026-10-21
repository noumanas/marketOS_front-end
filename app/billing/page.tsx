"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BillingDetails, type Plan, type PaymentStatus } from "@/services/api";
import { useAuth } from "@/lib/auth";

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "var(--orange)",
  approved: "var(--green)",
  rejected: "var(--pink)",
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const limitText = (n: number | null, unit: string) => (n == null ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`);

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: "6px" }}>
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {used.toLocaleString()} / {limit == null ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      <div className="usage-bar">
        <div style={{ width: `${pct}%`, background: pct >= 100 ? "var(--pink)" : pct >= 70 ? "var(--orange)" : "var(--green)" }} />
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the value is still selectable
    }
  };
  const isLink = /^https?:\/\//.test(value);
  return (
    <div className="flex justify-between items-center" style={{ gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "12.5px", color: "var(--text-muted)", minWidth: "130px" }}>{label}</span>
      <span style={{ fontSize: "13.5px", fontWeight: 600, flex: 1, wordBreak: "break-all", userSelect: "all" }}>
        {isLink ? (
          <a href={value} target="_blank" rel="noreferrer" style={{ color: "var(--blue)" }}>
            {value}
          </a>
        ) : (
          value
        )}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function BillingPage() {
  const { user, refresh } = useAuth();
  const [data, setData] = useState<BillingDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [payForm, setPayForm] = useState({ payerName: "", transferId: "", note: "" });
  const [paying, setPaying] = useState(false);

  const [showEnterprise, setShowEnterprise] = useState(false);
  const [entForm, setEntForm] = useState({ name: "", email: "", company: "", volume: "", message: "" });
  const [sendingInquiry, setSendingInquiry] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const load = useCallback(async () => {
    try {
      const [billing, planList] = await Promise.all([api.billing.get(), api.billing.plans()]);
      setData(billing);
      setPlans(planList.plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user) {
      setPayForm((f) => ({ ...f, payerName: f.payerName || user.name }));
      setEntForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
    }
  }, [user]);

  const pending = data?.payments.find((p) => p.status === "pending");
  const current = data?.plan;

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkout) return;
    setPaying(true);
    try {
      await api.billing.reportPayment({ plan: checkout.id, ...payForm });
      setCheckout(null);
      setPayForm((f) => ({ ...f, transferId: "", note: "" }));
      await load();
      showToast("Thanks! We'll confirm your payment and activate your plan shortly.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not submit payment", "error");
    } finally {
      setPaying(false);
    }
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingInquiry(true);
    try {
      await api.billing.enterprise(entForm);
      setShowEnterprise(false);
      showToast("Thanks — our team will get back to you by email.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send your request", "error");
    } finally {
      setSendingInquiry(false);
    }
  };

  const planButton = (p: Plan) => {
    if (p.id === current?.id) {
      return (
        <button className="btn btn-secondary w-full" disabled>
          Current plan
        </button>
      );
    }
    if (p.id === "free") return null;
    if (p.id === "enterprise") {
      return (
        <button className="btn btn-secondary w-full" onClick={() => { setShowEnterprise(true); setCheckout(null); }}>
          Talk to us
        </button>
      );
    }
    return (
      <button
        className="btn btn-primary w-full"
        disabled={Boolean(pending)}
        onClick={() => {
          setCheckout(p);
          setShowEnterprise(false);
          setTimeout(() => document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }), 50);
        }}
      >
        {current && current.price != null && p.price != null && p.price < current.price ? `Switch to ${p.name}` : `Upgrade to ${p.name}`}
      </button>
    );
  };

  return (
    <div className="page-container fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Billing & Plans</h1>
        <p className="page-subtitle">Pay by Wise bank transfer — plans run for 30 days from activation.</p>
      </div>

      {error && <p style={{ color: "var(--pink)", marginBottom: "20px" }}>{error}</p>}

      {/* Current plan */}
      {data && current && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="flex justify-between" style={{ gap: "24px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current plan</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{current.name}</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {data.planExpiresAt ? `Renews manually · active until ${fmtDate(data.planExpiresAt)}` : current.id === "free" ? "Free forever" : ""}
                {data.expired && <span style={{ color: "var(--orange)" }}> Your paid plan expired — you're back on Free.</span>}
              </div>
            </div>
            <div className="flex flex-col" style={{ gap: "14px", flex: "1 1 280px", maxWidth: "420px" }}>
              <UsageRow label="Emails in the last 24 hours" used={data.usage.sentLast24h + data.usage.queued} limit={current.dailySends} />
              <UsageRow label="Connected sending accounts" used={data.usage.accounts} limit={current.maxAccounts} />
            </div>
          </div>
          {pending && (
            <div style={{ marginTop: "18px", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--orange)" }}>
              ⏳ Your {pending.plan} payment ({pending.currency} {pending.amount}, transfer {pending.transferId}) is being reviewed. Your plan
              switches on as soon as it&apos;s confirmed.
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="plans-grid">
        {plans.map((p) => (
          <div key={p.id} className={`plan-card ${p.id === current?.id ? "current" : ""}`}>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{p.name}</div>
            <div className="plan-price">
              {p.price == null ? "Custom" : `$${p.price}`}
              {p.price != null && p.price > 0 && <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}> /month</span>}
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              {limitText(p.dailySends, "emails/day")} · {limitText(p.maxAccounts, p.maxAccounts === 1 ? "account" : "accounts")}
            </div>
            <ul className="plan-features">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {planButton(p)}
          </div>
        ))}
      </div>

      {/* Wise checkout */}
      {checkout && data && (
        <div id="checkout" className="card slide-up" style={{ marginBottom: "24px" }}>
          <div className="flex justify-between items-center" style={{ marginBottom: "6px" }}>
            <h2 className="table-title">
              Upgrade to {checkout.name} — ${checkout.price} {data.currency !== "USD" ? `(or equivalent in ${data.currency})` : ""}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setCheckout(null)}>
              Cancel
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px", marginTop: "16px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>1. Send ${checkout.price} with Wise</p>
              {data.wise.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--orange)" }}>
                  Payment details haven&apos;t been set up yet. Please contact support.
                </p>
              ) : (
                <>
                  {data.wise.map((d) => (
                    <CopyRow key={d.label} label={d.label} value={d.value} />
                  ))}
                  <CopyRow label="Reference (required)" value={data.paymentReference} />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px", lineHeight: 1.5 }}>
                    Put <strong>{data.paymentReference}</strong> in the transfer reference so we can match your payment.
                  </p>
                </>
              )}
            </div>

            <form onSubmit={submitPayment}>
              <p style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>2. Tell us you&apos;ve paid</p>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-name">Name on the transfer</label>
                <input
                  id="pay-name"
                  className="form-input"
                  required
                  value={payForm.payerName}
                  onChange={(e) => setPayForm({ ...payForm, payerName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-id">Wise transfer number</label>
                <input
                  id="pay-id"
                  className="form-input"
                  required
                  placeholder="e.g. 1234567890 (from your Wise receipt)"
                  value={payForm.transferId}
                  onChange={(e) => setPayForm({ ...payForm, transferId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pay-note">Note (optional)</label>
                <input
                  id="pay-note"
                  className="form-input"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                />
              </div>
              <button className="btn btn-primary w-full" disabled={paying || data.wise.length === 0}>
                {paying ? <span className="spinner" /> : "I've sent the payment"}
              </button>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
                We check transfers manually, usually within 24 hours. Your plan starts once it&apos;s confirmed.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise */}
      {showEnterprise && (
        <form id="enterprise" className="card slide-up" style={{ marginBottom: "24px" }} onSubmit={submitInquiry}>
          <div className="flex justify-between items-center" style={{ marginBottom: "16px" }}>
            <h2 className="table-title">Enterprise — let&apos;s talk</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEnterprise(false)}>
              Cancel
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 16px" }}>
            {(
              [
                ["name", "Name", true],
                ["email", "Work email", true],
                ["company", "Company", false],
                ["volume", "Emails per month (approx.)", false],
              ] as const
            ).map(([key, label, required]) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={`ent-${key}`}>{label}</label>
                <input
                  id={`ent-${key}`}
                  className="form-input"
                  type={key === "email" ? "email" : "text"}
                  required={required}
                  value={entForm[key]}
                  onChange={(e) => setEntForm({ ...entForm, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ent-message">What do you need?</label>
            <textarea
              id="ent-message"
              className="form-textarea"
              rows={4}
              value={entForm.message}
              onChange={(e) => setEntForm({ ...entForm, message: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" disabled={sendingInquiry}>
            {sendingInquiry ? <span className="spinner" /> : "Send request"}
          </button>
        </form>
      )}

      {/* History */}
      {data && data.payments.length > 0 && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Payment history</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Wise transfer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontSize: "13px" }}>{fmtDate(p.createdAt)}</td>
                    <td style={{ fontSize: "13px", textTransform: "capitalize" }}>{p.plan}</td>
                    <td style={{ fontSize: "13px" }}>
                      {p.currency} {p.amount}
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{p.transferId}</td>
                    <td style={{ fontSize: "12.5px", fontWeight: 600, color: STATUS_COLORS[p.status], textTransform: "capitalize" }}>
                      {p.status}
                      {p.reviewNote && <span style={{ fontWeight: 400, color: "var(--text-muted)" }}> · {p.reviewNote}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button className="btn btn-ghost btn-sm" style={{ marginTop: "16px" }} onClick={() => Promise.all([load(), refresh()])}>
        🔄 Refresh status
      </button>
    </div>
  );
}
