"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, session, AUTH_EXPIRED_EVENT, type AuthResponse, type Billing, type User } from "@/services/api";

interface AuthState {
  user: User | null;
  billing: Billing | null;
  loading: boolean;
  /** Store the session after login / signup / Google */
  signIn: (res: AuthResponse) => void;
  signOut: () => void;
  /** Re-fetch user + plan usage (e.g. after sending or an upgrade) */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session.get()) {
      setUser(null);
      setBilling(null);
      return;
    }
    try {
      const res = await api.auth.me();
      setUser(res.user);
      setBilling(res.billing);
    } catch {
      // 401 clears the token via the API client; network errors keep the user logged out for now
      setUser(null);
      setBilling(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const onExpired = () => {
      setUser(null);
      setBilling(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [refresh]);

  const signIn = useCallback((res: AuthResponse) => {
    session.set(res.token);
    setUser(res.user);
    setBilling(res.billing);
  }, []);

  const signOut = useCallback(() => {
    session.clear();
    setUser(null);
    setBilling(null);
    window.google?.accounts.id.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider value={{ user, billing, loading, signIn, signOut, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Minimal typing for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
