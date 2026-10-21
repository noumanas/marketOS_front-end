"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type AdminUser, type Inquiry, type Payment, type PaymentStatus, type PlanId } from "@/services/api";
import { useAuth } from "@/lib/auth";

type Tab = "payments" | "users" | "inquiries";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--orange)",
  approved: "var(--green)",
  rejected: "var(--pink)",
  new: "var(--orange)",
  contacted: "var(--blue)",
  closed: "var(--text-muted)",
};

const PLAN_OPTIONS: PlanId[] = ["free", "starter", "essential", "enterprise"];

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function Status({ value }: { value: string }) {
  return (
    <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_COLORS[value] || "var(--text-secondary)", textTransform: "capitalize" }}>
      {value}
    </span>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("payments");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("pending");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const errMsg = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong");

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  const load = useCallback(async () => {
    try {
      const [p, u, i] = await Promise.all([
        api.admin.payments(paymentFilter === "all" ? undefined : paymentFilter),
        api.admin.users(),
        api.admin.inquiries(),
      ]);
      setPayments(p.payments);
      setUsers(u.users);
      setInquiries(i.inquiries);
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  }, [paymentFilter]);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

  const review = async (p: Payment, action: "approve" | "reject") => {
    const note = action === "reject" ? prompt("Reason shown to the user (optional):") ?? null : "";
    if (note === null) return;
    if (action === "approve" && !confirm(`Approve ${p.currency} ${p.amount} from ${p.user?.email} and activate ${p.plan} for 30 days?`)) return;
    setBusy(p._id);
    try {
      await api.admin.review(p._id, action, note);
      showToast(action === "approve" ? `Activated ${p.plan} for ${p.user?.email}` : "Payment rejected", "success");
      await load();
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const setPlan = async (u: AdminUser, plan: PlanId) => {
    if (plan === u.plan && plan !== "free") {
      if (!confirm(`Extend ${u.email}'s ${plan} plan?`)) return;
    }
    let days: number | undefined;
    if (plan !== "free") {
      const input = prompt(`Activate ${plan} for ${u.email} for how many days?`, plan === "enterprise" ? "365" : "30");
      if (input === null) return;
      days = Number(input);
      if (!days || days < 1) return showToast("Enter a number of days", "error");
    }
    setBusy(u._id);
    try {
      await api.admin.updateUser(u._id, { plan, days });
      showToast(`${u.email} is now on ${plan}`, "success");
      await load();
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const toggleAdmin = async (u: AdminUser) => {
    const role = u.role === "admin" ? "user" : "admin";
    if (!confirm(`${role === "admin" ? "Make" : "Remove"} ${u.email} ${role === "admin" ? "an admin" : "as admin"}?`)) return;
    try {
      await api.admin.updateUser(u._id, { role });
      await load();
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  };

  const setInquiryStatus = async (i: Inquiry, status: Inquiry["status"]) => {
    try {
      await api.admin.updateInquiry(i._id, status);
      await load();
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  };

  if (user?.role !== "admin") return null;

  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const newInquiries = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="page-container fade-in">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">Confirm Wise payments, manage plans and Enterprise requests.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          🔄 Refresh
        </button>
      </div>

      <div className="flex gap-2" style={{ marginBottom: "20px", flexWrap: "wrap" }}>
        {(
          [
            ["payments", `Payments${paymentFilter === "pending" && pendingCount ? ` (${pendingCount})` : ""}`],
            ["users", `Users (${users.length})`],
            ["inquiries", `Enterprise${newInquiries ? ` (${newInquiries} new)` : ""}`],
          ] as const
        ).map(([key, label]) => (
          <button key={key} className={`btn btn-sm ${tab === key ? "btn-secondary" : "btn-ghost"}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "payments" && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Reported Wise payments</span>
            <select className="form-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | "all")} style={{ width: "auto" }}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <span className="empty-state-icon">💳</span>
              <div className="empty-state-title">No {paymentFilter === "all" ? "" : paymentFilter} payments</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Reported</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Payer / Wise transfer</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(p.createdAt)}</td>
                      <td style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 600 }}>{p.user?.name || "—"}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.user?.email}</div>
                      </td>
                      <td style={{ fontSize: "13px", textTransform: "capitalize" }}>{p.plan}</td>
                      <td style={{ fontSize: "13px" }}>
                        {p.currency} {p.amount}
                      </td>
                      <td style={{ fontSize: "13px", fontFamily: "monospace" }}>{p.reference}</td>
                      <td style={{ fontSize: "13px" }}>
                        <div>{p.payerName}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>#{p.transferId}</div>
                        {p.note && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>“{p.note}”</div>}
                      </td>
                      <td>
                        <Status value={p.status} />
                        {p.reviewNote && <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{p.reviewNote}</div>}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {p.status === "pending" && (
                          <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm" disabled={busy === p._id} onClick={() => review(p, "approve")}>
                              Approve
                            </button>
                            <button className="btn btn-ghost btn-sm" disabled={busy === p._id} onClick={() => review(p, "reject")}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 20px" }}>
            Check your Wise account for a transfer with the matching reference and amount before approving.
          </p>
        </div>
      )}

      {tab === "users" && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Users</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Expires</th>
                  <th>Sent (24h)</th>
                  <th>Accounts</th>
                  <th>Joined</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontSize: "13px" }}>
                      <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.email}</div>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={u.plan}
                        disabled={busy === u._id}
                        onChange={(e) => setPlan(u, e.target.value as PlanId)}
                        style={{ width: "auto", padding: "4px 8px", fontSize: "13px" }}
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      {u.plan !== u.effectivePlan && <div style={{ fontSize: "11.5px", color: "var(--orange)" }}>expired → free</div>}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{u.plan === "free" ? "—" : fmt(u.planExpiresAt)}</td>
                    <td style={{ fontSize: "13px" }}>{u.usage.sentLast24h}</td>
                    <td style={{ fontSize: "13px" }}>{u.usage.accounts}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{fmt(u.createdAt)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleAdmin(u)} disabled={u._id === user._id}>
                        {u.role === "admin" ? "Admin ✓" : "User"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Enterprise requests</span>
          </div>
          {inquiries.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <span className="empty-state-icon">🏢</span>
              <div className="empty-state-title">No Enterprise requests yet</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Volume</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((i) => (
                    <tr key={i._id}>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(i.createdAt)}</td>
                      <td style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 600 }}>{i.name}</div>
                        <a href={`mailto:${i.email}`} style={{ fontSize: "12px", color: "var(--blue)" }}>
                          {i.email}
                        </a>
                      </td>
                      <td style={{ fontSize: "13px" }}>{i.company || "—"}</td>
                      <td style={{ fontSize: "13px" }}>{i.volume || "—"}</td>
                      <td style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px" }}>{i.message || "—"}</td>
                      <td>
                        <select
                          className="form-select"
                          value={i.status}
                          onChange={(e) => setInquiryStatus(i, e.target.value as Inquiry["status"])}
                          style={{ width: "auto", padding: "4px 8px", fontSize: "13px", color: STATUS_COLORS[i.status] }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "12px 20px" }}>
            After agreeing a deal, set the user&apos;s plan to Enterprise in the Users tab.
          </p>
        </div>
      )}
    </div>
  );
}
