"use client";

import { useState } from "react";
import { api, type CampaignContent } from "@/services/api";
import CampaignCard from "@/components/CampaignCard";

const CHANNELS = [
  { id: "email", label: "📧 Email" },
  { id: "whatsapp", label: "💬 WhatsApp" },
  { id: "linkedin", label: "💼 LinkedIn" },
  { id: "ads", label: "📢 Ads" },
];

const AUDIENCE_PRESETS = [
  "E-commerce brand owners",
  "B2B SaaS founders",
  "Marketing managers",
  "Small business owners",
  "Gen Z consumers",
  "Enterprise executives",
];

export default function CreateCampaignPage() {
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["email"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CampaignContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !audience.trim()) return;
    if (selectedChannels.length === 0) {
      showToast("Please select at least one channel", "error");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.campaigns.create({
        goal: goal.trim(),
        audience: audience.trim(),
        channels: selectedChannels,
      });
      setResult(data.campaign.content);
      showToast("🎉 Campaign generated and dispatched!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate campaign";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">AI Campaign Creator</h1>
        <p className="page-subtitle">
          Describe your goal and audience — your AI agent generates 5 complete campaign variants instantly
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "28px", alignItems: "start" }}>
        {/* Left — Form */}
        <div>
          <div className="card">
            <form onSubmit={handleSubmit} id="campaign-form">
              {/* Goal */}
              <div className="form-group">
                <label className="form-label" htmlFor="campaign-goal">
                  🎯 Campaign Goal
                </label>
                <textarea
                  id="campaign-goal"
                  className="form-textarea"
                  placeholder="e.g. Increase trial sign-ups for our new AI tool by 30% this quarter"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Audience */}
              <div className="form-group">
                <label className="form-label" htmlFor="campaign-audience">
                  👥 Target Audience
                </label>
                <input
                  id="campaign-audience"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Startup founders aged 25–45"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  required
                />
                {/* Presets */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {AUDIENCE_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                      onClick={() => setAudience(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div className="form-group">
                <label className="form-label">📡 Channels</label>
                <div className="channel-tags">
                  {CHANNELS.map((ch) => (
                    <div
                      key={ch.id}
                      className={`channel-tag ${selectedChannels.includes(ch.id) ? "selected" : ""}`}
                      onClick={() => toggleChannel(ch.id)}
                      id={`channel-${ch.id}`}
                      role="checkbox"
                      aria-checked={selectedChannels.includes(ch.id)}
                    >
                      {ch.label}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg"
                disabled={loading}
                id="generate-campaign-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Generate Campaign Variants
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info box */}
          <div className="card" style={{ marginTop: "16px", padding: "16px 20px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                💡 How it works
              </strong>
              <ol style={{ paddingLeft: "18px" }}>
                <li>AI generates 5 campaign variants in different tones</li>
                <li>Each variant has a subject, body, and CTA</li>
                <li>Orchestrator dispatches jobs to the queue</li>
                <li>Workers process and send to each segment</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Right — Results */}
        <div>
          {!result && !loading && (
            <div className="empty-state card">
              <span className="empty-state-icon">🚀</span>
              <div className="empty-state-title">Ready to Generate</div>
              <p className="empty-state-text">
                Fill in your campaign goal and target audience, then hit generate to see 5 AI-crafted variants.
              </p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
              <div className="spinner" style={{ width: "36px", height: "36px", borderWidth: "3px", margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>AI is crafting your campaigns...</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>Analyzing goal, audience & channels</p>
            </div>
          )}

          {result && (
            <div id="campaign-results">
              {/* Summary */}
              {result.summary && (
                <div className="card" style={{ marginBottom: "16px", padding: "16px 20px", borderLeft: "3px solid var(--purple)" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    AI Strategy Summary
                  </p>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {result.summary}
                  </p>
                </div>
              )}

              {/* Variants */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {result.variants?.map((variant, i) => (
                  <CampaignCard key={variant.id || i} variant={variant} index={i} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ borderColor: "rgba(248,113,113,0.3)", padding: "20px" }}>
              <p style={{ color: "#f87171", fontWeight: 600, marginBottom: "8px" }}>❌ Error</p>
              <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>{error}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                Make sure the backend is running on port 5000 and your OpenAI key is set.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
