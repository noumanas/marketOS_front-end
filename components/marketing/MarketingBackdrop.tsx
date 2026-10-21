/** Fixed ambient glows behind the marketing pages — drifted by MarketingAnimations (data-orb) */
export default function MarketingBackdrop() {
  return (
    <div className="mk-backdrop" aria-hidden="true">
      <span className="mk-orb mk-orb-1" data-orb />
      <span className="mk-orb mk-orb-2" data-orb />
      <span className="mk-orb mk-orb-3" data-orb />
      <div className="mk-grid-bg" />
      <noscript>
        <style>{`.mk [data-hero], .mk [data-reveal], .mk [data-preview-row] { visibility: visible !important; }`}</style>
      </noscript>
    </div>
  );
}
