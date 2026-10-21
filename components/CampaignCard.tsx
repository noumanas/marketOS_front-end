"use client";

import { useState } from "react";
import type { CampaignVariant } from "@/services/api";

interface CampaignCardProps {
  variant: CampaignVariant;
  index: number;
}

const toneEmojis: Record<string, string> = {
  professional: "💼",
  casual: "😊",
  urgent: "⚡",
  emotional: "❤️",
  inspirational: "🌟",
};

export default function CampaignCard({ variant, index }: CampaignCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    const text = `Subject: ${variant.subject}\n\n${variant.body}\n\n${variant.cta}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="variant-card" id={`campaign-variant-${index + 1}`}>
      {/* Header */}
      <div className="variant-header">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "18px" }}>{toneEmojis[variant.tone] || "📧"}</span>
          <span className={`variant-tone-badge ${variant.tone}`}>
            {variant.tone}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          Variant {index + 1}
        </span>
      </div>

      {/* Body */}
      <div className="variant-body">
        <div className="variant-name">{variant.name}</div>

        <div className="variant-subject">
          <span style={{ fontSize: "16px", flexShrink: 0 }}>📧</span>
          <span>{variant.subject}</span>
        </div>

        {variant.preview && (
          <div className="variant-preview-text">"{variant.preview}"</div>
        )}

        <div
          className="variant-body-text"
          style={expanded ? { WebkitLineClamp: "unset", overflow: "visible" } : {}}
        >
          {variant.body}
        </div>

        {variant.body.length > 200 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px 0", fontSize: "12px", marginBottom: "12px" }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less ↑" : "Read more ↓"}
          </button>
        )}

        {/* Tags */}
        {variant.tags && variant.tags.length > 0 && (
          <div className="variant-tags">
            {variant.tags.map((tag) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="variant-stats">
          <div className="variant-stat">
            <span>Est. Open Rate</span>
            <strong style={{ color: "var(--green)" }}>{variant.estimatedOpenRate}</strong>
          </div>
          <div className="variant-stat">
            <span>Best Time</span>
            <strong>{variant.bestTime}</strong>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="variant-footer">
        <div className="cta-preview">{variant.cta}</div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          id={`copy-variant-${index + 1}`}
          title="Copy campaign text"
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>
    </div>
  );
}
