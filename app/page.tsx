import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PricingCards from "@/components/marketing/PricingCards";
import ChannelNetwork from "@/components/marketing/ChannelNetwork";
import MarketingAnimations from "@/components/marketing/MarketingAnimations";
import MarketingBackdrop from "@/components/marketing/MarketingBackdrop";

export const metadata: Metadata = {
  title: "MarketOS — AI cold email, sent from your own Gmail",
  description:
    "Write outreach with AI, send it from your Gmail or Google Workspace in safe batches, and track opens, clicks, replies and bounces.",
};

const FEATURES = [
  {
    icon: "🧠",
    title: "AI campaign writer",
    text: "Describe your goal and audience. Get several email variants with subject lines, preview text and a call to action — ready to edit and send.",
  },
  {
    icon: "📮",
    title: "Your Gmail — or your SendGrid",
    text: "Send from Gmail or Google Workspace with an App Password, or plug in your own SendGrid API key for higher volume. Replies land in your inbox, not ours.",
  },
  {
    icon: "📋",
    title: "CSV lists & personalization",
    text: "Upload any CSV. Every column becomes a placeholder — {{first_name}}, {{company}}, {{role}} — and invalid or duplicate emails are skipped.",
  },
  {
    icon: "🎯",
    title: "Batch sending you control",
    text: "Send to the first 10, the next 50, or hand-pick contacts. Each contact is tracked, so nobody gets the same email twice.",
  },
  {
    icon: "📈",
    title: "Opens, clicks, replies, bounces",
    text: "Replies and bounces are read straight from your inbox. Opens and clicks are tracked per contact, so you know exactly who engaged.",
  },
  {
    icon: "📊",
    title: "Live analytics dashboard",
    text: "Delivery, open, reply and bounce rates over 7, 30 or 90 days — plus how close each inbox is to Gmail's daily sending limit.",
  },
];

const STEPS = [
  { title: "Connect Gmail", text: "Add your Gmail or Workspace inbox with a Google App Password. It's verified before saving and stored encrypted." },
  { title: "Upload contacts", text: "Drop in a CSV with an email column. Names, companies and any other columns become personalization fields." },
  { title: "Write with AI", text: "Generate campaign variants from a one-line goal, or write your own. Preview placeholders before you send." },
  { title: "Send & track", text: "Send in small batches, watch replies and bounces come in, and scale up as your sender reputation grows." },
];

const FAQ = [
  {
    q: "Is my Gmail password stored?",
    a: "No. You connect with a Google App Password — a separate 16-character password you can revoke at any time from your Google account. It's checked against Gmail before saving and stored encrypted (AES-256).",
  },
  {
    q: "Does it work with Google Workspace addresses like hello@yourcompany.com?",
    a: "Yes. Any Gmail or Google Workspace inbox works. Workspace is recommended for outreach — it has higher daily sending limits and looks more professional than a @gmail.com address.",
  },
  {
    q: "Can I send through my own SendGrid account?",
    a: "Yes. Connect SendGrid with an API key that has Mail Send access and a verified sender or authenticated domain. MarketOS sends through SendGrid's API, and SendGrid's Event Webhook reports bounces, drops and spam complaints back to your dashboard.",
  },
  {
    q: "How many emails can I send?",
    a: "Your plan sets a daily total across your connected inboxes (Free: 5 a day, Starter: 150, Essential: 1,000). Google also limits each inbox — about 500 a day for @gmail.com and 2,000 for Workspace — and MarketOS shows how close you are.",
  },
  {
    q: "Will my emails land in the inbox?",
    a: "Inbox placement depends mostly on your domain setup and sending habits. MarketOS paces sends, enforces daily caps and flags bounces, and we strongly recommend setting up SPF, DKIM and DMARC on your domain and warming up gradually.",
  },
  {
    q: "How do I pay?",
    a: "Paid plans are paid by Wise bank transfer. Pick a plan on the Billing page, send the amount with your reference code, and submit the transfer number. Your plan activates as soon as the payment is confirmed — usually within 24 hours.",
  },
  {
    q: "Is there a contract? How do I cancel?",
    a: "No contract. Each payment covers 30 days and plans don't renew automatically — if you don't pay again, your account simply moves back to the Free plan. Your lists and history stay.",
  },
];

const PREVIEW_ROWS = [
  { email: "sara@brightlabs.io", status: "Replied", color: "var(--purple)" },
  { email: "ali@acme.co", status: "Opened", color: "var(--cyan)" },
  { email: "john@smithco.com", status: "Clicked", color: "var(--blue)" },
  { email: "maria@novatech.ai", status: "Sending…", color: "var(--orange)" },
  { email: "dev@oldcompany.biz", status: "Bounced", color: "#e05a5a" },
];

function ProductPreview() {
  return (
    <div className="mk-preview" aria-label="Example of the MarketOS email sender (illustration)" role="img">
      <div className="mk-preview-bar">
        <i />
        <i />
        <i />
        <span style={{ marginLeft: 8 }}>MarketOS · Email Sender — example campaign</span>
      </div>
      <div className="mk-preview-body">
        <div className="mk-tile" style={{ padding: "6px 16px" }}>
          <div className="mk-row" style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>Batch 3 · next 25 contacts</span>
            <span>Status</span>
          </div>
          {PREVIEW_ROWS.map((r) => (
            <div className="mk-row" key={r.email} data-preview-row>
              <span style={{ color: "var(--text-secondary)" }}>{r.email}</span>
              <span className="mk-status" style={{ color: r.color }} {...(r.status === "Sending…" ? { "data-pulse": "" } : {})}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Delivered", 98, "var(--green)"],
            ["Opened", 54, "var(--cyan)"],
            ["Replied", 9, "var(--purple)"],
            ["Bounced", 2, "#e05a5a"],
          ].map(([label, value, color]) => (
            <div className="mk-tile" key={label}>
              <div className="mk-tile-label">{label}</div>
              <div className="mk-tile-value" style={{ color: color as string }} data-count={value} data-suffix="%">
                {value}%
              </div>
            </div>
          ))}
          <div className="mk-tile" style={{ gridColumn: "1 / -1" }}>
            <div className="mk-tile-label">hello@yourcompany.com · today</div>
            <div className="usage-bar" style={{ marginTop: 10 }}>
              <div data-fill="34" style={{ width: "34%", background: "var(--green)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>68 of 200 planned sends</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="mk">
      <MarketingBackdrop />
      <MarketingAnimations />
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="mk-hero">
          <div className="mk-hero-stage">
            <ChannelNetwork />
            <div className="mk-container mk-hero-content">
            <span className="mk-pill" data-hero>✉️ AI outreach for founders, agencies & sales teams</span>
            <h1 className="mk-h1" data-hero>
              Cold email that sounds like you —
              <br />
              <span className="text-gradient">sent from your own Gmail.</span>
            </h1>
            <p className="mk-lead" data-hero>
              MarketOS writes your outreach with AI, sends it from your Gmail or Google Workspace inbox in safe batches, and shows
              you who opened, clicked, replied or bounced.
            </p>
            <div className="mk-cta-row" data-hero>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Start free
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                See pricing
              </Link>
            </div>
            <p className="mk-fineprint" data-hero>
              Free plan: 1 Gmail inbox and 5 emails a day. No card needed.
            </p>
            <p className="mk-channels-note" data-hero>
              Send through Gmail or SendGrid · AI-written copy for Facebook, Google Ads, LinkedIn, WhatsApp & Instagram
            </p>
            </div>
          </div>
          <div className="mk-container" data-hero>
            <ProductPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mk-section mk-section-alt">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <span className="mk-eyebrow">Features</span>
              <h2 className="mk-h2">Everything between “who should I email?” and “they replied”</h2>
              <p className="mk-lead">One place to write, send and measure outreach — without another inbox to babysit.</p>
            </div>
            <div className="mk-grid-3">
              {FEATURES.map((f) => (
                <div className="mk-card" key={f.title} data-reveal>
                  <div className="mk-card-icon" aria-hidden>
                    {f.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mk-section">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <span className="mk-eyebrow">How it works</span>
              <h2 className="mk-h2">From CSV to conversations in four steps</h2>
              <p className="mk-lead">No setup calls, no new inbox — just your Gmail and a CSV.</p>
            </div>
            <div className="mk-steps">
              {STEPS.map((s, i) => (
                <div className="mk-step" key={s.title} data-reveal>
                  <div className="mk-step-num">STEP {i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverability */}
        <section id="deliverability" className="mk-section mk-section-alt">
          <div className="mk-container mk-split">
            <div data-reveal>
              <span className="mk-eyebrow">Deliverability</span>
              <h2 className="mk-h2">Built to protect your sender reputation</h2>
              <p className="mk-lead">
                Blasting hundreds of identical emails from a new inbox is the fastest way into spam. MarketOS is designed around
                slow, steady, personal sending.
              </p>
              <ul className="mk-checklist">
                <li>
                  <span>
                    <strong>Paced sending.</strong> Emails go out one by one with a gap between each, never as a burst.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Daily caps.</strong> Plan limits and Gmail&apos;s own limits are tracked per inbox, and batches stop
                    automatically if Google pushes back.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Bounce detection.</strong> Bounced addresses are flagged from your inbox and never emailed again.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Real personalization.</strong> Any CSV column can go into the subject or body, so every email reads
                    like it was written for one person.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mk-card" style={{ padding: "28px" }} data-reveal>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>Recommended warm-up for a new inbox</div>
              {[
                ["Week 1", "15–25 emails / day", 12],
                ["Weeks 2–3", "40–80 emails / day", 40],
                ["Week 4+", "up to 150–200 / day", 100],
              ].map(([label, text, pct]) => (
                <div key={label as string} style={{ marginBottom: 18 }}>
                  <div className="flex justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{text}</span>
                  </div>
                  <div className="usage-bar">
                    <div data-fill={pct} style={{ width: `${pct}%`, background: "var(--grad-primary)" }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                Pair this with SPF, DKIM and DMARC on your domain and you&apos;ll give every email its best chance of reaching the
                inbox.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section id="pricing" className="mk-section">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <span className="mk-eyebrow">Pricing</span>
              <h2 className="mk-h2">Start free. Upgrade when it&apos;s working.</h2>
              <p className="mk-lead">Simple monthly plans, paid by Wise transfer. No contracts, no automatic renewals.</p>
            </div>
            <div data-reveal>
              <PricingCards />
            </div>
            <p style={{ textAlign: "center", marginTop: 8 }}>
              <Link href="/pricing" style={{ color: "var(--blue)", fontSize: 14 }}>
                Compare plans in detail →
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mk-section mk-section-alt">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <span className="mk-eyebrow">FAQ</span>
              <h2 className="mk-h2">Questions, answered</h2>
            </div>
            <div className="mk-faq">
              {FAQ.map((f) => (
                <details key={f.q} data-reveal>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mk-section">
          <div className="mk-container">
            <div className="mk-cta" data-reveal>
              <h2 className="mk-h2">Send your first batch today</h2>
              <p className="mk-lead">Connect Gmail, upload a CSV and let AI draft the first email. It&apos;s free to start.</p>
              <div className="mk-cta-row">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Create free account
                </Link>
                <Link href="/pricing" className="btn btn-ghost btn-lg">
                  View plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
