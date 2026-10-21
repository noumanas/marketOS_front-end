"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Campaign } from "@/services/api";

const CHANNEL_ICONS: Record<string, string> = {
  email: "📧",
  whatsapp: "💬",
  linkedin: "💼",
  ads: "📢",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {status}
    </span>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.campaigns.list()
      .then((d) => setCampaigns(d.campaigns))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(
    (c) =>
      c.goal.toLowerCase().includes(search.toLowerCase()) ||
      c.audience.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">
            All AI-generated campaigns — {campaigns.length} total
          </p>
        </div>
        <Link href="/create" className="btn btn-primary" id="new-campaign-btn">
          <span>⚡</span> New Campaign
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          id="campaigns-search"
          type="text"
          className="form-input"
          placeholder="🔍  Search by goal or audience..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">All Campaigns</span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: "3px", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading campaigns...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            <span className="empty-state-icon">{search ? "🔍" : "📭"}</span>
            <div className="empty-state-title">
              {search ? "No matches found" : "No campaigns yet"}
            </div>
            <p className="empty-state-text">
              {search
                ? `No campaigns match "${search}"`
                : "Create your first AI-powered campaign to get started."}
            </p>
            {!search && (
              <Link href="/create" className="btn btn-primary">
                ⚡ Create Campaign
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Audience</th>
                  <th>Channels</th>
                  <th>Variants</th>
                  <th>Open Rate</th>
                  <th>Conversions</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((campaign) => (
                  <tr key={campaign.id} id={`campaign-row-${campaign.id}`}>
                    {/* Goal */}
                    <td style={{ maxWidth: "220px" }}>
                      <span
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {campaign.goal}
                      </span>
                    </td>

                    {/* Audience */}
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {campaign.audience}
                      </span>
                    </td>

                    {/* Channels */}
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(campaign.channels || ["email"]).map((ch) => (
                          <span
                            key={ch}
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              background: "var(--bg-card-hover)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {CHANNEL_ICONS[ch] || "📡"} {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Variants count */}
                    <td>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--purple)" }}>
                        {campaign.content?.variants?.length ?? 0}
                      </span>
                    </td>

                    {/* Open Rate */}
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--green)" }}>
                        {campaign.metrics?.openRate ?? "—"}%
                      </span>
                    </td>

                    {/* Conversions */}
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--blue)" }}>
                        {campaign.metrics?.conversions?.toLocaleString() ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={campaign.status || "active"} />
                    </td>

                    {/* Date */}
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
