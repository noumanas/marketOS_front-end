"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import KPICard from "@/components/KPICard";
import { api, type AnalyticsSummary, type PeriodStats } from "@/services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

// Validated for colour-blind separation on the dark card surface
const SERIES = {
  opens: "#935eed",
  clicks: "#c97624",
  replies: "#1a98d6",
  delivered: "#1a98d6",
  bounced: "#e05a5a",
};
const SURFACE = "#0f1218";
const PERIODS = [7, 30, 90];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: {
      labels: {
        color: "rgba(255,255,255,0.55)",
        font: { family: "Inter", size: 12 },
        boxWidth: 12,
        boxHeight: 12,
      },
    },
    tooltip: {
      backgroundColor: "rgba(13,17,23,0.95)",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      titleColor: "rgba(255,255,255,0.9)",
      bodyColor: "rgba(255,255,255,0.6)",
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "rgba(255,255,255,0.4)", font: { family: "Inter", size: 11 }, maxTicksLimit: 10 },
    },
    y: {
      beginAtZero: true,
      grid: { color: "rgba(255,255,255,0.04)" },
      ticks: { color: "rgba(255,255,255,0.4)", font: { family: "Inter", size: 11 }, precision: 0 },
    },
  },
};

const timeAgo = (d?: string) => {
  if (!d) return "never";
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Change vs the previous period: percentage points for rates, % change for counts */
const delta = (cur: PeriodStats, prev: PeriodStats, key: keyof PeriodStats, isRate: boolean) => {
  if (!prev.sent) return {};
  const diff = cur[key] - prev[key];
  if (isRate) {
    return { text: `${Math.abs(Math.round(diff * 10) / 10)} pts`, up: diff >= 0 };
  }
  if (!prev[key]) return {};
  return { text: `${Math.abs(Math.round((diff / prev[key]) * 100))}%`, up: diff >= 0 };
};

function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="chart-card">
      <div className="flex justify-between items-center" style={{ gap: "12px" }}>
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async (d: number) => {
    setError(null);
    try {
      setData(await api.analytics.summary(d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const checkInbox = async () => {
    setSyncing(true);
    try {
      await api.email.sync();
      await load(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inbox check failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Loading your email performance...</p>
        </div>
        <div className="kpi-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="kpi-card">
              <div className="loading-shimmer" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 14 }} />
              <div className="loading-shimmer" style={{ width: "60%", height: 32, marginBottom: 8 }} />
              <div className="loading-shimmer" style={{ width: "40%", height: 16 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cur = data?.current;
  const prev = data?.previous;
  const tracking = data?.trackingEnabled ?? false;
  const timeline = data?.timeline || [];
  const labels = timeline.map((t) => t.day);
  const hasSends = (data?.lists.length ?? 0) > 0;

  const kpi = (key: keyof PeriodStats, isRate: boolean, higherIsGood = true) => {
    const d = cur && prev ? delta(cur, prev, key, isRate) : {};
    return d.text
      ? { delta: `${d.text} vs prev ${days}d`, deltaUp: d.up, deltaGood: higherIsGood ? d.up : !d.up }
      : {};
  };

  const engagementData = {
    labels,
    datasets: [
      { label: "Opens", data: timeline.map((t) => t.opens), color: SERIES.opens },
      { label: "Clicks", data: timeline.map((t) => t.clicks), color: SERIES.clicks },
      { label: "Replies", data: timeline.map((t) => t.replies), color: SERIES.replies },
    ]
      .filter((s) => tracking || s.label === "Replies" || s.data.some(Boolean))
      .map(({ color, ...s }) => ({
        ...s,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: days > 30 ? 0 : 4,
        pointHoverRadius: 6,
        pointBorderColor: SURFACE,
        pointBorderWidth: 2,
      })),
  };

  const sentData = {
    labels,
    datasets: [
      { label: "Delivered", data: timeline.map((t) => t.sent - t.bounces), backgroundColor: SERIES.delivered },
      { label: "Bounced", data: timeline.map((t) => t.bounces), backgroundColor: SERIES.bounced },
    ].map((s) => ({ ...s, borderColor: SURFACE, borderWidth: 2, borderRadius: 4, borderSkipped: false as const })),
  };

  const funnel = cur
    ? [
        { label: "Sent", value: cur.sent },
        { label: "Delivered", value: cur.delivered },
        ...(tracking || cur.opened ? [{ label: "Opened", value: cur.opened }] : []),
        ...(tracking || cur.clicked ? [{ label: "Clicked", value: cur.clicked }] : []),
        { label: "Replied", value: cur.replied },
      ]
    : [];

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Email performance — last {days} days</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`btn btn-sm ${days === p ? "btn-secondary" : "btn-ghost"}`}
                style={{ borderRadius: 0 }}
                onClick={() => setDays(p)}
              >
                {p}d
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => load(days)} id="refresh-analytics-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="toast toast-error" style={{ position: "static", marginBottom: "20px" }}>
          ❌ {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid" id="kpi-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KPICard id="kpi-sent" icon="✉️" label="Emails Sent" value={(cur?.sent ?? 0).toLocaleString()} iconBg="rgba(167, 139, 250, 0.15)" {...kpi("sent", false)} />
        <KPICard id="kpi-delivery" icon="📨" label="Delivery Rate" value={`${cur?.deliveryRate ?? 0}%`} iconBg="rgba(74, 222, 128, 0.15)" {...kpi("deliveryRate", true)} />
        <KPICard
          id="kpi-open-rate"
          icon="📬"
          label="Open Rate"
          value={tracking || cur?.opened ? `${cur?.openRate ?? 0}%` : "Off"}
          iconBg="rgba(96, 165, 250, 0.15)"
          {...(tracking ? kpi("openRate", true) : {})}
        />
        <KPICard
          id="kpi-click-rate"
          icon="🖱️"
          label="Click Rate"
          value={tracking || cur?.clicked ? `${cur?.clickRate ?? 0}%` : "Off"}
          iconBg="rgba(96, 165, 250, 0.15)"
          {...(tracking ? kpi("clickRate", true) : {})}
        />
        <KPICard id="kpi-reply-rate" icon="💬" label="Reply Rate" value={`${cur?.replyRate ?? 0}%`} iconBg="rgba(139, 92, 246, 0.15)" {...kpi("replyRate", true)} />
        <KPICard id="kpi-bounce-rate" icon="⚠️" label="Bounce Rate" value={`${cur?.bounceRate ?? 0}%`} iconBg="rgba(248, 113, 113, 0.15)" {...kpi("bounceRate", true, false)} />
      </div>

      {!tracking && hasSends && (
        <div className="card" style={{ marginBottom: "20px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--orange)" }}>Open & click tracking is off.</strong> Set <code>PUBLIC_URL</code> in{" "}
          <code>backend/.env</code> to a public address for the backend. Delivery, replies and bounces are tracked regardless.
        </div>
      )}

      {/* Empty state */}
      {data && !hasSends && (
        <div className="empty-state card" style={{ marginBottom: "24px" }}>
          <span className="empty-state-icon">📊</span>
          <div className="empty-state-title">No emails sent yet</div>
          <p className="empty-state-text">Connect Gmail, upload a contact list and send your first batch to see analytics here.</p>
          <Link href="/email" className="btn btn-primary">
            ✉️ Go to Email Sender
          </Link>
        </div>
      )}

      {data && hasSends && (
        <>
          {/* Charts */}
          <div className="charts-grid">
            <SectionCard title="Engagement" subtitle={`Daily ${tracking ? "opens, clicks and " : ""}replies`}>
              <div style={{ height: "260px", marginTop: "12px" }}>
                <Line
                  data={engagementData}
                  options={{
                    ...chartDefaults,
                    plugins: {
                      ...chartDefaults.plugins,
                      legend: { ...chartDefaults.plugins.legend, display: engagementData.datasets.length > 1, position: "top" as const },
                    },
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard title="Funnel" subtitle={`Emails sent in the last ${days} days`}>
              <div className="flex flex-col" style={{ gap: "12px", marginTop: "16px" }}>
                {funnel.map((f) => {
                  const pctOfSent = cur?.sent ? (f.value / cur.sent) * 100 : 0;
                  return (
                    <div key={f.label}>
                      <div className="flex justify-between" style={{ fontSize: "12.5px", marginBottom: "5px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>{f.label}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                          {f.value.toLocaleString()}{" "}
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {Math.round(pctOfSent * 10) / 10}%</span>
                        </span>
                      </div>
                      <div style={{ height: "8px", background: "var(--bg-card-hover)", borderRadius: "4px" }}>
                        <div
                          title={`${f.label}: ${f.value.toLocaleString()}`}
                          style={{ width: `${Math.max(pctOfSent, f.value ? 1 : 0)}%`, height: "100%", background: SERIES.opens, borderRadius: "4px" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <div className="charts-grid">
            <SectionCard title="Emails sent per day" subtitle="Delivered vs bounced">
              <div style={{ height: "220px", marginTop: "12px" }}>
                <Bar
                  data={sentData}
                  options={{
                    ...chartDefaults,
                    plugins: { ...chartDefaults.plugins, legend: { ...chartDefaults.plugins.legend, position: "top" as const } },
                    scales: {
                      x: { ...chartDefaults.scales.x, stacked: true },
                      y: { ...chartDefaults.scales.y, stacked: true },
                    },
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Sender accounts"
              subtitle="Last 24 hours vs each sender's daily limit"
              action={
                <button className="btn btn-ghost btn-sm" onClick={checkInbox} disabled={syncing}>
                  {syncing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "↻ Check inbox"}
                </button>
              }
            >
              <div className="flex flex-col" style={{ gap: "16px", marginTop: "16px" }}>
                {data.senders.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No sending account connected.</p>}
                {data.senders.map((s) => {
                  const used = s.dailyLimit ? (s.sentLast24h / s.dailyLimit) * 100 : 0;
                  const isSendGrid = s.provider === "sendgrid";
                  return (
                    <div key={s._id}>
                      <div className="flex justify-between" style={{ fontSize: "12.5px", marginBottom: "5px", gap: "8px" }}>
                        <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.email}
                          <span style={{ color: "var(--text-muted)" }}> · {isSendGrid ? "SendGrid" : "Gmail"}</span>
                        </span>
                        <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {s.sentLast24h}
                          {s.dailyLimit != null ? ` / ${s.dailyLimit.toLocaleString()}` : " sent"}
                        </span>
                      </div>
                      {s.dailyLimit != null && (
                        <div style={{ height: "8px", background: "var(--bg-card-hover)", borderRadius: "4px" }}>
                          <div
                            style={{
                              width: `${Math.min(used, 100)}%`,
                              height: "100%",
                              borderRadius: "4px",
                              background: used >= 90 ? SERIES.bounced : used >= 60 ? "var(--orange)" : "var(--green)",
                            }}
                          />
                        </div>
                      )}
                      <div style={{ fontSize: "11.5px", color: s.lastSyncError ? "var(--pink)" : "var(--text-muted)", marginTop: "5px" }}>
                        {used >= 90 ? "⚠ Near the daily limit · " : ""}
                        {isSendGrid
                          ? "Limits set by your SendGrid plan · bounces via Event Webhook"
                          : s.lastSyncError
                          ? `⚠ ${s.lastSyncError}`
                          : `Inbox checked ${timeAgo(s.lastSyncedAt)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Lists + replies */}
          <div className="charts-grid">
            <div className="table-card" style={{ marginTop: 0 }}>
              <div className="table-header">
                <span className="table-title">Contact lists</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>All time</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>List</th>
                      <th>Sent</th>
                      {tracking && <th>Open</th>}
                      {tracking && <th>Click</th>}
                      <th>Reply</th>
                      <th>Bounce</th>
                      <th>Last sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lists.map((l) => (
                      <tr key={l._id}>
                        <td style={{ fontSize: "13px", fontWeight: 600, maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <Link href="/email" style={{ color: "inherit" }}>{l.name}</Link>
                        </td>
                        <td style={{ fontSize: "13px" }}>{l.sent.toLocaleString()}</td>
                        {tracking && <td style={{ fontSize: "13px" }}>{l.openRate}%</td>}
                        {tracking && <td style={{ fontSize: "13px" }}>{l.clickRate}%</td>}
                        <td style={{ fontSize: "13px" }}>{l.replyRate}%</td>
                        <td style={{ fontSize: "13px", color: l.bounceRate > 2 ? SERIES.bounced : undefined }}>{l.bounceRate}%</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{timeAgo(l.lastSentAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <SectionCard title="Recent replies" subtitle="People who wrote back — follow up in Gmail">
              <div className="flex flex-col" style={{ gap: "10px", marginTop: "14px" }}>
                {data.recentReplies.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No replies yet.</p>
                ) : (
                  data.recentReplies.map((r) => (
                    <div key={r._id} className="flex justify-between items-center" style={{ gap: "8px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name || r.email}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name ? `${r.email} · ` : ""}
                          {r.listName}
                        </div>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{timeAgo(r.repliedAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
            {data.totals.contacts.toLocaleString()} contacts in {data.totals.lists} list{data.totals.lists === 1 ? "" : "s"} ·{" "}
            {data.totals.pending.toLocaleString()} not emailed yet · {data.totals.campaigns} AI campaign{data.totals.campaigns === 1 ? "" : "s"}
          </p>
        </>
      )}
    </div>
  );
}
