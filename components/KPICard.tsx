interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  /** Whether the change is good news — defaults to deltaUp (e.g. pass false for a rising bounce rate) */
  deltaGood?: boolean;
  iconBg?: string;
  id?: string;
}

export default function KPICard({
  icon,
  label,
  value,
  delta,
  deltaUp = true,
  deltaGood,
  iconBg = "rgba(139, 92, 246, 0.15)",
  id,
}: KPICardProps) {
  return (
    <div className="kpi-card" id={id}>
      <div className="kpi-icon" style={{ background: iconBg }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {delta && (
        <div className={`kpi-delta ${deltaGood ?? deltaUp ? "up" : "down"}`}>
          <span>{deltaUp ? "↑" : "↓"}</span>
          {delta}
        </div>
      )}
    </div>
  );
}
