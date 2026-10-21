"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Plan } from "@/services/api";
import { useAuth } from "@/lib/auth";

const FEATURED = "starter";

const limit = (n: number | null, unit: string) => (n == null ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`);

/** Plan cards driven by the backend's plan config, so prices and limits stay in one place */
export default function PricingCards() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.billing
      .plans()
      .then((d) => setPlans(d.plans))
      .catch(() => setFailed(true));
  }, []);

  const cta = (p: Plan) => {
    if (user) return { href: "/billing", label: p.id === "free" ? "Go to dashboard" : p.id === "enterprise" ? "Talk to us" : `Choose ${p.name}` };
    if (p.id === "free") return { href: "/signup", label: "Start free" };
    if (p.id === "enterprise") return { href: "/signup?next=/billing", label: "Talk to us" };
    return { href: "/signup?next=/billing", label: `Start with ${p.name}` };
  };

  if (failed) {
    return (
      <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
        Pricing couldn&apos;t load right now — please refresh the page.
      </p>
    );
  }

  if (!plans) {
    return (
      <div className="plans-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mk-price-card">
            <div className="loading-shimmer" style={{ height: 18, width: "40%", marginBottom: 16 }} />
            <div className="loading-shimmer" style={{ height: 36, width: "55%", marginBottom: 20 }} />
            <div className="loading-shimmer" style={{ height: 120 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="plans-grid">
      {plans.map((p) => {
        const action = cta(p);
        return (
          <div key={p.id} className={`mk-price-card ${p.id === FEATURED ? "featured" : ""}`}>
            {p.id === FEATURED && <span className="mk-badge">Most popular</span>}
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{p.name}</div>
            <div className="plan-price">
              {p.price == null ? "Custom" : `$${p.price}`}
              {p.price != null && (
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>{p.price > 0 ? " /month" : " forever"}</span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {limit(p.dailySends, "emails/day")} · {limit(p.maxAccounts, p.maxAccounts === 1 ? "inbox" : "inboxes")}
            </div>
            <ul className="plan-features">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link href={action.href} className={`btn w-full ${p.id === FEATURED ? "btn-primary" : "btn-secondary"}`}>
              {action.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
