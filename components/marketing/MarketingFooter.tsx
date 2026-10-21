import Link from "next/link";
import { Logo } from "@/components/marketing/MarketingNav";

export default function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-container mk-footer-inner">
        <div className="flex flex-col" style={{ gap: "10px" }}>
          <Logo />
          <span>AI-written outreach, sent from your own Gmail.</span>
        </div>
        <nav className="flex" style={{ gap: "22px", flexWrap: "wrap" }} aria-label="Footer">
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
        <span>© {new Date().getFullYear()} MarketOS</span>
      </div>
    </footer>
  );
}
