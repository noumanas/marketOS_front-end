"use client";

import { useState } from "react";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      signIn(isSignup ? await api.auth.signup(form) : await api.auth.login(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card fade-in">
      <div className="sidebar-logo" style={{ border: "none", padding: 0, marginBottom: "24px", justifyContent: "center" }}>
        <div className="sidebar-logo-icon">🧠</div>
        <div>
          <div className="sidebar-logo-text">MarketOS</div>
          <div className="sidebar-logo-sub">AI Marketing</div>
        </div>
      </div>

      <h1 style={{ fontSize: "22px", fontWeight: 700, textAlign: "center", marginBottom: "6px" }}>
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "24px" }}>
        {isSignup ? "Start free — 1 Gmail account and 5 emails a day." : "Log in to send and track your campaigns."}
      </p>

      <GoogleButton onSuccess={signIn} onError={setError} text={isSignup ? "signup_with" : "signin_with"} />

      <div className="auth-divider">
        <span>or with email</span>
      </div>

      <form onSubmit={submit}>
        {isSignup && (
          <div className="form-group">
            <label className="form-label" htmlFor="auth-name">Name</label>
            <input
              id="auth-name"
              className="form-input"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            className="form-input"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            className="form-input"
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 8 characters" : ""}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {error && (
          <p role="alert" style={{ fontSize: "13px", color: "var(--pink)", marginBottom: "14px" }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? <span className="spinner" /> : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", marginTop: "20px" }}>
        {isSignup ? "Already have an account? " : "New to MarketOS? "}
        <Link href={isSignup ? "/login" : "/signup"} style={{ color: "var(--blue)" }}>
          {isSignup ? "Log in" : "Create one free"}
        </Link>
      </p>
    </div>
  );
}
