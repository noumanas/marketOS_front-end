"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navItems = [
  {
    href: "/dashboard",
    icon: (
      <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: "Dashboard",
  },
  {
    href: "/create",
    icon: (
      <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7-7 7 7" />
      </svg>
    ),
    label: "Create Campaign",
  },
  {
    href: "/campaigns",
    icon: (
      <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    label: "Campaigns",
  },
  {
    href: "/email",
    icon: (
      <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
    label: "Email Sender",
  },
  {
    href: "/billing",
    icon: (
      <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </svg>
    ),
    label: "Billing",
  },
];

const adminItem = {
  href: "/admin",
  icon: (
    <svg className="nav-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  label: "Admin",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, billing, signOut } = useAuth();
  const items = user?.role === "admin" ? [...navItems, adminItem] : navItems;

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🧠</div>
        <div>
          <div className="sidebar-logo-text">MarketOS</div>
          <div className="sidebar-logo-sub">AI Marketing</div>
        </div>
      </div>

      {/* Nav */}
      <p className="sidebar-section-label">Navigation</p>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
            id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <p className="sidebar-section-label" style={{ marginTop: "auto" }}>Account</p>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-status" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" width={28} height={28} style={{ borderRadius: "50%" }} referrerPolicy="no-referrer" />
              ) : (
                <div className="status-dot" />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name || user.email}
                </div>
                <Link href="/billing" style={{ fontSize: "11px", color: "var(--purple)" }}>
                  {billing?.plan.name ?? "Free"} plan
                  {billing?.usage.remainingToday != null ? ` · ${billing.usage.remainingToday} emails left today` : ""}
                </Link>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout} id="logout-btn">
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
