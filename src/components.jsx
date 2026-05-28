// Reusable UI atoms + icons for Norte Telemetria

export const Icon = ({ name, size = 16, strokeWidth = 1.6, ...rest }) => {
  const s = size;
  const sw = strokeWidth;
  const common = {
    width: s, height: s, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
    ...rest,
  };
  switch (name) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
    case "map":
      return <svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>;
    case "truck":
      return <svg {...common}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
    case "alert":
      return <svg {...common}><path d="M12 3 2 20h20z"/><path d="M12 10v5M12 17.5v.01"/></svg>;
    case "chart":
      return <svg {...common}><path d="M3 21V8M9 21V4M15 21v-9M21 21V12"/></svg>;
    case "plug":
      return <svg {...common}><path d="M9 7V3M15 7V3M6 11h12v3a6 6 0 0 1-12 0z"/><path d="M12 20v3"/></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 1.5v3M12 19.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1.5 12h3M19.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "filter":
      return <svg {...common}><path d="M4 5h16l-6 8v6l-4-2v-4z"/></svg>;
    case "chevron-right":
      return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case "chevron-down":
      return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case "arrow-up":
      return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case "arrow-down":
      return <svg {...common}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case "arrow-right":
      return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "external":
      return <svg {...common}><path d="M14 4h6v6M10 14 20 4M19 14v6H5V6h6"/></svg>;
    case "more":
      return <svg {...common}><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>;
    case "refresh":
      return <svg {...common}><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>;
    case "play":
      return <svg {...common}><path d="M6 4v16l14-8z"/></svg>;
    case "pause":
      return <svg {...common}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    case "download":
      return <svg {...common}><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></svg>;
    case "speedometer":
      return <svg {...common}><path d="M3 13a9 9 0 1 1 18 0"/><path d="M12 13l5-3"/></svg>;
    case "fuel":
      return <svg {...common}><path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M4 22h12"/><path d="M14 9h2a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2"/></svg>;
    case "gauge":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "wifi":
      return <svg {...common}><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="0.8" fill="currentColor"/></svg>;
    case "wifi-off":
      return <svg {...common}><path d="M2 8.8a13 13 0 0 1 5 -3M22 8.8a13 13 0 0 0 -5 -3M8.5 16a5 5 0 0 1 7 0"/><path d="M3 3l18 18"/></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    case "door":
      return <svg {...common}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M4 22h16"/><circle cx="15" cy="12" r="0.8" fill="currentColor"/></svg>;
    case "key":
      return <svg {...common}><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>;
    case "alarm":
      return <svg {...common}><circle cx="12" cy="13" r="8"/><path d="M5 4 2 7M19 4l3 3M12 9v5l3 1"/></svg>;
    case "lock":
      return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "link-off":
      return <svg {...common}><path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 5 5M3 3l18 18"/></svg>;
    case "idle":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>;
    case "bell":
      return <svg {...common}><path d="M6 19a3 3 0 0 0 12 0M5 17h14l-1.5-3V10a5.5 5.5 0 1 0-11 0v4z"/></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 5 5 9-11"/></svg>;
    case "x":
      return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "info":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>;
    case "wrench":
      return <svg {...common}><path d="M14 7a4 4 0 0 1-5.7 3.6L3 16v5h5l5.4-5.3A4 4 0 0 1 17 10l5-5-3-3z"/></svg>;
    case "compass":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m9 15 2-6 6-2-2 6z"/></svg>;
    case "sidebar-toggle":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M14 9l-3 3 3 3"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

// Status badge for vehicle communication status
export const StatusBadge = ({ status, size }) => {
  const map = {
    "online":   { cls: "ok",   lbl: "Online" },
    "atrasado": { cls: "warn", lbl: "Atrasado" },
    "sem-comm": { cls: "crit", lbl: "Sem comunicação" },
  };
  const m = map[status] || { cls: "", lbl: status };
  return <span className={`badge ${m.cls}`}><span className="dot"/>{m.lbl}</span>;
};

export const SeverityBadge = ({ sev }) => {
  const m = { crit: "Crítico", warn: "Atenção", info: "Informativo", ok: "Normal" };
  return <span className={`badge ${sev}`}><span className="dot"/>{m[sev] || sev}</span>;
};

// Plate display
export const Plate = ({ value, lg }) => <span className={`plate ${lg ? "lg" : ""}`}>{value}</span>;

export const Hint = ({ text }) => {
  if (!text) return null;
  return (
    <span className="hint" tabIndex={0} aria-label={text}>
      <span className="hint-mark">?</span>
      <span className="hint-bubble">{text}</span>
    </span>
  );
};

// KPI tile
export const KPI = ({ label, value, unit, delta, deltaDir, sub, icon, hint }) => (
  <div className="kpi">
    <div className="kpi-label">
      {icon && <Icon name={icon}/>}
      <span>{label}</span>
      <Hint text={hint}/>
    </div>
    <div className="kpi-value">{value}{unit && <span className="unit">{unit}</span>}</div>
    {(delta || sub) && (
      <div className="row" style={{gap: 8}}>
        {delta && (
          <span className={`kpi-delta ${deltaDir || "flat"}`}>
            {deltaDir === "up" && "▲ "}
            {deltaDir === "down" && "▼ "}
            {delta}
          </span>
        )}
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
    )}
  </div>
);

// Format helpers
export function fmtNum(n, opts = {}) {
  return new Intl.NumberFormat("pt-BR", opts).format(n);
}
export function fmtKm(n) { return fmtNum(n) + " km"; }
export function pad(n) { return String(n).padStart(2, "0"); }

// Minibar from array of numbers
export const MiniBar = ({ values, accent, height = 22 }) => {
  const max = Math.max(...values, 1);
  return (
    <div className={`minibar ${accent ? "accent" : ""}`} style={{ height }}>
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(8, (v / max) * height)}px` }}/>
      ))}
    </div>
  );
};

// Sparkline (svg path)
export const Sparkline = ({ values, width = 120, height = 30, color = "currentColor" }) => {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 2) - 1]);
  const d = "M " + pts.map(p => p.join(",")).join(" L ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Horizontal bar chart (already styled via .chart-bars)
export const BarChart = ({ rows, onRowClick }) => {
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="chart-bars">
      {rows.map((r, i) => (
        <div
          className={`row ${onRowClick ? "clickable" : ""}`}
          key={i}
          onClick={onRowClick ? () => onRowClick(r) : undefined}
          title={onRowClick ? "Ver alertas deste tipo" : undefined}
        >
          <div className="label">{r.label}</div>
          <div className="bar-track">
            <div className={`bar-fill ${r.sev || ""}`} style={{ width: `${(r.value / max) * 100}%` }}/>
          </div>
          <div className="val">{fmtNum(r.value)}</div>
        </div>
      ))}
    </div>
  );
};

export const SelectFilter = ({ label, value, options, onChange, active }) => (
  <label className={`select-filter ${active ? "active" : ""}`}>
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <Icon name="chevron-down" size={11}/>
  </label>
);

// Tabs
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <button key={t.id} className={`tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count != null && <span className="count">{t.count}</span>}
      </button>
    ))}
  </div>
);
