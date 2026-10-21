"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

// Login/signup: signed-in users are sent on to the app
const AUTH_ROUTES = ["/login", "/signup"];
// Marketing pages: public for everyone, rendered without the app sidebar
const MARKETING_ROUTES = ["/", "/pricing"];

/** Sidebar layout for signed-in pages; bare layout for login/signup and marketing pages */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = AUTH_ROUTES.includes(pathname);
  const isMarketing = MARKETING_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading || isMarketing) return;
    if (!user && !isPublic) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (user && isPublic) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    }
  }, [user, loading, isPublic, isMarketing, pathname, router]);

  if (isMarketing) return <>{children}</>;
  if (isPublic) return <main className="auth-layout">{children}</main>;

  if (loading || !user) {
    return (
      <div className="auth-layout">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: "3px" }} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
