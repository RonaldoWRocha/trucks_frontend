"use client";

import { useEffect, useState } from "react";
import { useTelemetryData } from "./live-data";
import { Alerts } from "./screens/alerts";
import { Dashboard } from "./screens/dashboard";
import { Integration } from "./screens/integration";
import { MapScreen } from "./screens/map";
import { Reports } from "./screens/reports";
import { VehicleDetail } from "./screens/vehicle-detail";
import { Vehicles } from "./screens/vehicles";
import { Icon, Plate } from "./components";

// Norte Telemetria - App shell, router, sidebar, topbar

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", title: "Visão geral" },
  { id: "map", label: "Mapa", icon: "map", title: "Mapa da frota" },
  { id: "vehicles", label: "Veículos", icon: "truck", title: "Veículos" },
  { id: "alerts", label: "Alertas", icon: "alert", title: "Alertas e ocorrências" },
  { id: "reports", label: "Relatórios", icon: "chart", title: "Relatórios" },
  { id: "integration", label: "Integração", icon: "plug", title: "Saúde da integração" },
  { id: "settings", label: "Configurações", icon: "gear", title: "Configurações" },
];

function readRoute() {
  if (typeof window === "undefined") return { screen: "dashboard" };
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  if (!h) return { screen: "dashboard" };
  const parts = h.split("/");
  if (parts[0] === "vehicle" && parts[1]) return { screen: "vehicle", plate: decodeURIComponent(parts[1]) };
  return { screen: parts[0] };
}

function setRoute(r) {
  if (typeof window === "undefined") return;
  if (r.screen === "vehicle") {
    window.location.hash = "/vehicle/" + encodeURIComponent(r.plate);
  } else {
    window.location.hash = "/" + r.screen;
  }
}

const App = () => {
  const { data: D, loading, error } = useTelemetryData();
  const [route, setRouteState] = useState(readRoute());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("nt:sidebar") === "collapsed"; } catch (e) { return false; }
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "auto";
    try { return localStorage.getItem("nt:theme") || "auto"; } catch (e) { return "auto"; }
  });
  const [density, setDensity] = useState(() => {
    if (typeof window === "undefined") return "comfortable";
    try { return localStorage.getItem("nt:density") || "comfortable"; } catch (e) { return "comfortable"; }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(v => {
      const next = !v;
      try { localStorage.setItem("nt:sidebar", next ? "collapsed" : "expanded"); } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    const on = () => setRouteState(readRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "auto" ? (mq.matches ? "dark" : "light") : theme;
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.setAttribute("data-theme-pref", theme);
    };
    apply();
    document.documentElement.setAttribute("data-density", density);
    if (theme === "auto") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    return undefined;
  }, [theme, density]);

  const go = (screen, extra = {}) => setRoute({ screen, ...extra });
  const goVehicle = (plate) => setRoute({ screen: "vehicle", plate });
  const onBack = () => setRoute({ screen: "vehicles" });

  const persistTheme = (next) => {
    setTheme(next);
    try { localStorage.setItem("nt:theme", next); } catch (e) {}
  };

  const persistDensity = (next) => {
    setDensity(next);
    try { localStorage.setItem("nt:density", next); } catch (e) {}
  };

  const cycleTheme = () => {
    const next = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    persistTheme(next);
  };

  const activeNav = NAV.find(n => n.id === route.screen) || NAV.find(n => n.id === "vehicles");
  const onlineCount = D.FLEET.filter(v => v.status === "online").length;

  const onNavigate = (screen) => go(screen);

  let body = null;
  switch (route.screen) {
    case "dashboard":
      body = <Dashboard data={D} onGoToVehicle={goVehicle} onNavigate={onNavigate}/>;
      break;
    case "map":
      body = <MapScreen data={D} onGoToVehicle={goVehicle}/>;
      break;
    case "vehicles":
      body = <Vehicles data={D} onGoToVehicle={goVehicle}/>;
      break;
    case "vehicle":
      body = <VehicleDetail data={D} plate={route.plate} onBack={onBack} onGoToVehicle={goVehicle}/>;
      break;
    case "alerts":
      body = <Alerts data={D} onGoToVehicle={goVehicle}/>;
      break;
    case "reports":
      body = <Reports data={D} onGoToVehicle={goVehicle}/>;
      break;
    case "integration":
      body = <Integration data={D}/>;
      break;
    case "settings":
      body = <SettingsScreen theme={theme} setTheme={persistTheme} density={density} setDensity={persistDensity}/>;
      break;
    default:
      body = <Dashboard data={D} onGoToVehicle={goVehicle} onNavigate={onNavigate}/>;
  }

  const isMap = route.screen === "map";
  const isVehicle = route.screen === "vehicle";

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-screen-label={activeNav.title}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark" title="Norte — Gestão de Frota Inteligente">
            <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {/* N body: thick road-like stroke */}
              <path d="M5.5 23 L5.5 8.5 L18 21.5 L18 11.5"
                    fill="none" stroke="#141936"
                    strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round"/>
              {/* dashed road centerline along the N's left leg */}
              <path d="M5.5 21 L5.5 10"
                    fill="none" stroke="#ffffff"
                    strokeWidth="0.7" strokeDasharray="1.3 1.3" strokeLinecap="round"/>
              {/* arrow head tip — light blue */}
              <path d="M18 11.5 L22.5 6.5"
                    fill="none" stroke="#4f7fab"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22.5 6.5 L19.5 6.5 L22.5 6.5 L22.5 9.5"
                    fill="none" stroke="#4f7fab"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="brand-name">
            Norte
            <span className="tag">Gestão de frota</span>
          </div>
        </div>

        <div className="nav-section">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${(route.screen === n.id || (n.id === "vehicles" && isVehicle)) ? "active" : ""}`}
              data-tip={n.label}
              data-has-badge={n.badge != null ? "true" : "false"}
              onClick={() => go(n.id)}
            >
              <Icon name={n.icon}/>
              <span className="lbl">{n.label}</span>
              {n.badge != null && <span className="badge-count">{n.badge}</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="avatar">N</div>
          <div className="who">
            <div className="who-name">Norte Telemetria</div>
            <div className="who-org">Gestão de frota</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="sidebar-toggle" onClick={toggleSidebar}
                  title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                  aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
            <Icon name="sidebar-toggle"/>
          </button>
          <div className="row" style={{gap: 6, alignItems: "center"}}>
            <span className="topbar-title">{activeNav.title}</span>
            {isVehicle && route.plate && (
              <>
                <Icon name="chevron-right" size={11} className="dim"/>
                <Plate value={route.plate}/>
              </>
            )}
          </div>

          <div className="topbar-spacer"/>

          <button className="btn ghost sm" style={{ marginRight: 10 }} onClick={cycleTheme} title="Alternar tema">
            Tema: {theme === "auto" ? "Auto" : theme === "light" ? "Claro" : "Escuro"}
          </button>

          <div className="topbar-status">
            <span className={`dot ${error ? "warn" : "ok"}`}/>
            <span>{error ? "API offline" : loading ? "Carregando API" : "Integração OK"} · <b className="num">{onlineCount}/{D.FLEET.length}</b> online</span>
          </div>

        </header>

        <div style={{flex: 1, overflow: "hidden", display: "flex", flexDirection: "column"}}>
          {isMap ? (
            <div style={{flex: 1, minHeight: 0}}>{body}</div>
          ) : body}
        </div>
      </main>

    </div>
  );
};

// Settings — with theme + density switchers
const SettingsScreen = ({ theme, setTheme, density, setDensity }) => {
  const themeOptions = [
    {
      id: "auto",
      label: "Sistema",
      desc: "Acompanhar o tema do sistema operacional",
      preview: "auto",
    },
    {
      id: "light",
      label: "Claro",
      desc: "Tema claro fixo, ideal para uso diurno",
      preview: "light",
    },
    {
      id: "dark",
      label: "Escuro",
      desc: "Tema escuro fixo, melhor em ambientes com pouca luz",
      preview: "dark",
    },
  ];

  const ThemePreview = ({ kind }) => {
    // Render a small mock window for each theme option
    const bgs = {
      light: { bg: "#fafafa", surface: "#ffffff", border: "#e8e8eb", text: "#09090b", muted: "#71717a", accent: "#4f7fab" },
      dark:  { bg: "#09090b", surface: "#0f0f11", border: "#232327", text: "#fafafa", muted: "#71717a", accent: "#6a98c4" },
    };
    if (kind === "auto") {
      return (
        <div style={{display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)"}}>
          <Mini c={bgs.light}/>
          <Mini c={bgs.dark}/>
        </div>
      );
    }
    return (
      <div style={{borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)"}}>
        <Mini c={bgs[kind]} full/>
      </div>
    );
  };

  const Mini = ({ c, full }) => (
    <div style={{
      flex: 1,
      width: full ? "100%" : "50%",
      height: 72,
      background: c.bg,
      padding: 8,
      display: "flex",
      gap: 6,
    }}>
      {/* mini sidebar */}
      <div style={{width: 18, height: "100%", background: "#141936", borderRadius: 3, padding: 4, display: "flex", flexDirection: "column", gap: 3}}>
        <div style={{width: 10, height: 2, background: "#6a98c4", borderRadius: 1}}/>
        <div style={{width: 10, height: 1.5, background: "rgba(255,255,255,0.4)", borderRadius: 1}}/>
        <div style={{width: 10, height: 1.5, background: "rgba(255,255,255,0.4)", borderRadius: 1}}/>
      </div>
      {/* mini content */}
      <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 4}}>
        <div style={{height: 10, background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 2, display: "flex", padding: 2, gap: 2, alignItems: "center"}}>
          <div style={{width: 8, height: 4, background: c.text, borderRadius: 1, opacity: 0.6}}/>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, flex: 1}}>
          <div style={{background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 2, padding: 3}}>
            <div style={{width: 8, height: 1.5, background: c.muted, borderRadius: 1, marginBottom: 2}}/>
            <div style={{width: 14, height: 3, background: c.text, borderRadius: 1}}/>
          </div>
          <div style={{background: c.surface, border: `0.5px solid ${c.border}`, borderRadius: 2, padding: 3}}>
            <div style={{width: 8, height: 1.5, background: c.muted, borderRadius: 1, marginBottom: 2}}/>
            <div style={{width: 12, height: 3, background: c.accent, borderRadius: 1}}/>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <div className="sub">Aparência, conta, integrações e usuários</div>
        </div>
      </div>

      {/* APPEARANCE CARD */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="section-head" style={{marginBottom: 14}}>
          <div>
            <h2 style={{color: "var(--text)", fontSize: 14}}>Aparência</h2>
            <div className="muted" style={{fontSize: 12, marginTop: 2}}>Personalize o tema e a densidade da interface</div>
          </div>
        </div>

        {/* Theme selector */}
        <div style={{marginBottom: 22}}>
          <div className="row between" style={{marginBottom: 10}}>
            <div>
              <div style={{fontSize: 12.5, fontWeight: 500}}>Tema</div>
              <div className="muted" style={{fontSize: 11.5, marginTop: 2}}>
                {theme === "auto"
                  ? "Acompanhando o sistema operacional"
                  : `Fixo em modo ${theme === "light" ? "claro" : "escuro"}`}
              </div>
            </div>
          </div>

          <div className="grid cols-3" style={{gap: 12}}>
            {themeOptions.map(opt => {
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  style={{
                    border: `1.5px solid ${active ? "var(--brand-blue)" : "var(--border)"}`,
                    borderRadius: 8,
                    background: active ? "var(--accent-soft)" : "var(--surface)",
                    padding: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: active ? "0 0 0 3px color-mix(in oklab, var(--brand-blue) 12%, transparent)" : "none",
                    transition: "all 120ms ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                  <ThemePreview kind={opt.preview}/>
                  <div className="row between">
                    <div>
                      <div style={{fontSize: 12.5, fontWeight: 500}}>{opt.label}</div>
                      <div className="muted" style={{fontSize: 11.5, marginTop: 2}}>{opt.desc}</div>
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: `1.5px solid ${active ? "var(--brand-blue)" : "var(--border-strong)"}`,
                      background: active ? "var(--brand-blue)" : "transparent",
                      display: "grid", placeItems: "center",
                      flexShrink: 0,
                    }}>
                      {active && <Icon name="check" size={10} strokeWidth={3} style={{color: "#fff"}}/>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Density selector */}
        <div style={{borderTop: "1px solid var(--divider)", paddingTop: 16}}>
          <div className="row between" style={{marginBottom: 10}}>
            <div>
              <div style={{fontSize: 12.5, fontWeight: 500}}>Densidade da interface</div>
              <div className="muted" style={{fontSize: 11.5, marginTop: 2}}>Ajuste o espaçamento de tabelas e cards</div>
            </div>
          </div>
          <div className="row" style={{gap: 8}}>
            {[
              { id: "comfortable", label: "Confortável", desc: "Mais espaço entre os elementos" },
              { id: "compact", label: "Compacta", desc: "Mais informação por tela" },
            ].map(opt => {
              const active = density === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setDensity(opt.id)}
                  style={{
                    flex: 1,
                    border: `1.5px solid ${active ? "var(--brand-blue)" : "var(--border)"}`,
                    background: active ? "var(--accent-soft)" : "var(--surface)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `1.5px solid ${active ? "var(--brand-blue)" : "var(--border-strong)"}`,
                    background: active ? "var(--brand-blue)" : "transparent",
                    display: "grid", placeItems: "center",
                    flexShrink: 0,
                  }}>
                    {active && <Icon name="check" size={10} strokeWidth={3} style={{color: "#fff"}}/>}
                  </div>
                  <div>
                    <div style={{fontSize: 12.5, fontWeight: 500}}>{opt.label}</div>
                    <div className="muted" style={{fontSize: 11.5, marginTop: 1}}>{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* OTHER SETTINGS */}
      <div className="section-head"><h2>Outras configurações</h2></div>
      <div className="grid cols-3">
        {[
          { t: "Conta da empresa", d: "Norte Logística · CNPJ 32.480.591/0001-04", i: "user" },
          { t: "Usuários e permissões", d: "8 usuários · 3 perfis", i: "user" },
          { t: "Perfis de alerta", d: "Velocidade · RPM · Cerca virtual · Sirene", i: "bell" },
          { t: "Integração Trucks", d: "API v3.4 · token expira em 142 dias", i: "plug" },
          { t: "Webhooks e notificações", d: "2 webhooks ativos", i: "external" },
          { t: "Exportação e BI", d: "PowerBI · Looker Studio · CSV", i: "download" },
        ].map((c, i) => (
          <div key={i} className="card" style={{cursor: "pointer"}}>
            <div className="row between">
              <div className="row" style={{gap: 10}}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: "var(--accent-soft)",
                  display: "grid", placeItems: "center",
                  color: "var(--brand-blue)",
                  border: "1px solid var(--accent-border)",
                }}>
                  <Icon name={c.i} size={15}/>
                </div>
                <h3 style={{margin: 0, fontSize: 13}}>{c.t}</h3>
              </div>
              <Icon name="chevron-right" size={14} className="dim"/>
            </div>
            <div className="muted" style={{fontSize: 12, marginTop: 8}}>{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
