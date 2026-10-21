"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function Logo() {
  return (
    <Link href="/" className="mk-logo" aria-label="MarketOS home">
      <div className="sidebar-logo-icon">🧠</div>
      <div>
        <div className="sidebar-logo-text">MarketOS</div>
        <div className="sidebar-logo-sub">AI Marketing</div>
      </div>
    </Link>
  );
}

export default function MarketingNav() {
  const { user, loading } = useAuth();

  return (
    <header className="mk-nav">
      <div className="mk-container mk-nav-inner">
        <Logo />
        <nav className="mk-nav-links" aria-label="Main">
          <Link href="/#features">Features</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#deliverability">Deliverability</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="mk-nav-actions">
          {!loading && user ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Open dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
