import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PricingCards from "@/components/marketing/PricingCards";
import MarketingAnimations from "@/components/marketing/MarketingAnimations";
import MarketingBackdrop from "@/components/marketing/MarketingBackdrop";

export const metadata: Metadata = {
  title: "Pricing — MarketOS",
  description: "Start free with 1 Gmail inbox and 5 emails a day. Starter $10/month, Essential $30/month, or talk to us about Enterprise.",
};

type Cell = string | boolean;

// Free, Starter, Essential, Enterprise — keep in step with backend/src/config/plans.js
const COMPARE: { label: string; values: [Cell, Cell, Cell, Cell] }[] = [
  { label: "Price", values: ["$0", "$10 / month", "$30 / month", "Custom"] },
  { label: "Sending accounts (Gmail, Workspace or SendGrid)", values: ["1", "3", "10", "Unlimited"] },
  { label: "Emails per 24 hours (all inboxes)", values: ["5", "150", "1,000", "Custom"] },
  { label: "AI campaign writer", values: [true, true, true, true] },
  { label: "CSV contact lists & personalization", values: [true, true, true, true] },
  { label: "Batch sending (first N / hand-picked)", values: [true, true, true, true] },
  { label: "Reply & bounce detection", values: [true, true, true, true] },
  { label: "Open & click tracking", values: [true, true, true, true] },
  { label: "Analytics dashboard", values: [true, true, true, true] },
  { label: "Choose the sender per batch", values: [false, true, true, true] },
  { label: "Priority support", values: [false, false, true, true] },
  { label: "Onboarding & deliverability help", values: [false, false, false, true] },
  { label: "Custom terms & invoicing", values: [false, false, false, true] },
];

const PLAN_NAMES = ["Free", "Starter", "Essential", "Enterprise"];

const FAQ = [
  {
    q: "How does paying with Wise work?",
    a: "Create an account, open Billing and choose Starter or Essential. You'll see our Wise bank details and a personal reference code. Send the amount from Wise (or any bank), include the reference, then enter the Wise transfer number. We confirm the payment and switch your plan on — usually within 24 hours.",
  },
  {
    q: "What currency can I pay in?",
    a: "Prices are in US dollars. You can send from any currency with Wise — just make sure the amount that arrives covers the plan price.",
  },
  {
    q: "Do plans renew automatically?",
    a: "No. Each payment covers 30 days. When it ends, your account moves back to Free unless you pay again — there's nothing to cancel and no surprise charges. Paying early for the same plan adds 30 days on top of your current period.",
  },
  {
    q: "What happens if I hit my daily limit?",
    a: "Sending pauses until enough of your last 24 hours' emails roll off the window. If you start a batch that's bigger than what's left, MarketOS sends what it can and tells you how many were held back.",
  },
  {
    q: "Is the daily limit per inbox or per account?",
    a: "It's a total across all inboxes on your account. Google's own per-inbox limits (about 500 a day for @gmail.com, 2,000 for Workspace) still apply, and the dashboard shows how close each inbox is.",
  },
  {
    q: "What's included in Enterprise?",
    a: "Higher or custom sending volume, as many inboxes as you need, hands-on help with domain setup and warm-up, and terms that fit your company. Tell us what you need and we'll put together a plan.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) return <span className="mk-yes" aria-label="Included">✓</span>;
  if (value === false) return <span className="mk-no" aria-label="Not included">—</span>;
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="mk">
      <MarketingBackdrop />
      <MarketingAnimations />
      <MarketingNav />

      <main>
        <section className="mk-hero" style={{ paddingBottom: 40 }}>
          <div className="mk-container">
            <span className="mk-eyebrow" data-hero>
              Pricing
            </span>
            <h1 className="mk-h1" data-hero>
              Simple plans. Start free.
            </h1>
            <p className="mk-lead" data-hero>
              Send from your own Gmail with AI-written emails and full tracking on every plan. Upgrade for more inboxes and more
              emails per day.
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: 72 }}>
          <div className="mk-container">
            <div data-hero>
              <PricingCards />
            </div>
            <p className="mk-fineprint" style={{ textAlign: "center" }} data-hero>
              Paid plans are paid by Wise bank transfer and last 30 days. No automatic renewals.
            </p>
          </div>
        </section>

        <section className="mk-section mk-section-alt">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <h2 className="mk-h2">Compare plans</h2>
            </div>
            <div className="table-card" style={{ overflowX: "auto" }} data-reveal>
              <table className="mk-compare">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Feature</span>
                    </th>
                    {PLAN_NAMES.map((n) => (
                      <th scope="col" key={n}>
                        {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" style={{ fontWeight: 500 }}>
                        {row.label}
                      </th>
                      {row.values.map((v, i) => (
                        <td key={PLAN_NAMES[i]}>
                          <CellValue value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="mk-container">
            <div className="mk-section-head" data-reveal>
              <h2 className="mk-h2">Billing questions</h2>
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

        <section className="mk-section" style={{ paddingTop: 0 }}>
          <div className="mk-container">
            <div className="mk-cta" data-reveal>
              <h2 className="mk-h2">Need more than 1,000 emails a day?</h2>
              <p className="mk-lead">Enterprise plans come with custom volume, unlimited inboxes and help setting up your domain.</p>
              <div className="mk-cta-row">
                <Link href="/signup?next=/billing" className="btn btn-primary btn-lg">
                  Talk to us
                </Link>
                <Link href="/signup" className="btn btn-ghost btn-lg">
                  Start free instead
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
