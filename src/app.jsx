"use client";

import { useEffect, useState } from "react";
import { apiJson, useTelemetryData } from "./live-data";
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
  const [path, query = ""] = h.split("?");
  const params = Object.fromEntries(new URLSearchParams(query).entries());
  const parts = path.split("/");
  if (parts[0] === "vehicle" && parts[1]) return { screen: "vehicle", plate: decodeURIComponent(parts[1]) };
  return { screen: parts[0], params };
}

function setRoute(r) {
  if (typeof window === "undefined") return;
  const query = r.params ? `?${new URLSearchParams(r.params).toString()}` : "";
  if (r.screen === "vehicle") {
    window.location.hash = "/vehicle/" + encodeURIComponent(r.plate);
  } else {
    window.location.hash = "/" + r.screen + query;
  }
}

const App = () => {
  const [auth, setAuth] = useState(() => {
    if (typeof window === "undefined") return { loading: true, token: "", session: null, needsSetup: false };
    try {
      return { loading: true, token: localStorage.getItem("nt:token") || "", session: null, needsSetup: false };
    } catch (e) {
      return { loading: true, token: "", session: null, needsSetup: false };
    }
  });
  const [credentialStatus, setCredentialStatus] = useState({ loading: false, configured: true, credential: null });
  const { data: D, loading, error } = useTelemetryData(auth.token);
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

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const bootstrap = await apiJson("/api/auth/bootstrap");
        if (cancelled) return;
        if (bootstrap.needsSetup) {
          setAuth((current) => ({ ...current, loading: false, needsSetup: true, session: null }));
          return;
        }
        if (!auth.token) {
          setAuth((current) => ({ ...current, loading: false, needsSetup: false, session: null }));
          return;
        }
        const session = await apiJson("/api/auth/me", { token: auth.token });
        if (!cancelled) {
          setAuth((current) => ({ ...current, loading: false, needsSetup: false, session }));
        }
      } catch (e) {
        if (cancelled) return;
        try { localStorage.removeItem("nt:token"); } catch (err) {}
        setAuth({ loading: false, token: "", session: null, needsSetup: false });
      }
    }
    boot();
    return () => { cancelled = true; };
  }, [auth.token]);

  useEffect(() => {
    let cancelled = false;
    async function loadCredentials() {
      if (!auth.token || !auth.session) return;
      setCredentialStatus((current) => ({ ...current, loading: true }));
      try {
        const status = await apiJson("/api/integration/credentials", { token: auth.token });
        if (!cancelled) setCredentialStatus({ loading: false, ...status });
      } catch (e) {
        if (!cancelled) setCredentialStatus({ loading: false, configured: true, credential: null });
      }
    }
    loadCredentials();
    return () => { cancelled = true; };
  }, [auth.token, auth.session]);

  const go = (screen, extra = {}) => {
    const { params, ...rest } = extra;
    setRoute({ screen, params, ...rest });
  };
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

  const onAuthSuccess = (result) => {
    try { localStorage.setItem("nt:token", result.token); } catch (e) {}
    setAuth({ loading: false, token: result.token, session: { user: result.user, client: result.client, clients: result.clients }, needsSetup: false });
  };

  const switchClient = async (clientId) => {
    const next = await apiJson("/api/auth/switch-client", {
      method: "POST",
      token: auth.token,
      body: { clientId: Number(clientId) },
    });
    setAuth((current) => ({
      ...current,
      session: { user: next.user, client: next.client, clients: next.clients },
    }));
  };

  const logout = async () => {
    try { await apiJson("/api/auth/logout", { method: "POST", token: auth.token }); } catch (e) {}
    try { localStorage.removeItem("nt:token"); } catch (e) {}
    setAuth({ loading: false, token: "", session: null, needsSetup: false });
  };

  if (auth.loading) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <h1>Norte Telemetria</h1>
          <div className="sub">Carregando acesso...</div>
        </div>
      </div>
    );
  }

  if (!auth.session) {
    return <LoginScreen needsSetup={auth.needsSetup} onSuccess={onAuthSuccess}/>;
  }

  const activeNav = NAV.find(n => n.id === route.screen) || NAV.find(n => n.id === "vehicles");
  const onlineCount = D.FLEET.filter(v => v.status === "online").length;

  const onNavigate = (screen, params) => go(screen, params ? { params } : {});

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
      body = <Alerts data={D} onGoToVehicle={goVehicle} initialFilters={route.params}/>;
      break;
    case "reports":
      body = <Reports data={D} onGoToVehicle={goVehicle}/>;
      break;
    case "integration":
      body = <Integration data={D}/>;
      break;
    case "settings":
      body = (
        <SettingsScreen
          theme={theme}
          setTheme={persistTheme}
          density={density}
          setDensity={persistDensity}
          token={auth.token}
          credentialStatus={credentialStatus}
          onCredentialsSaved={(status) => setCredentialStatus({ loading: false, ...status })}
          isPlatformAdmin={Boolean(auth.session?.user?.isPlatformAdmin)}
        />
      );
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

          {auth.session?.user?.isPlatformAdmin && Array.isArray(auth.session?.clients) && (
            <select
              className="topbar-select"
              value={auth.session.client.id}
              onChange={(event) => switchClient(event.target.value)}
              title="Ambiente"
            >
              {auth.session.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          )}

          <button className="btn ghost sm" style={{ marginRight: 10 }} onClick={cycleTheme} title="Alternar tema">
            Tema: {theme === "auto" ? "Auto" : theme === "light" ? "Claro" : "Escuro"}
          </button>

          <button className="btn ghost sm" style={{ marginRight: 10 }} onClick={logout} title="Sair">
            Sair
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

      {!credentialStatus.loading && !credentialStatus.configured && (
        <CredentialsModal token={auth.token} onSaved={(status) => setCredentialStatus({ loading: false, ...status })}/>
      )}

    </div>
  );
};

const LoginScreen = ({ needsSetup, onSuccess }) => {
  const [mode] = useState(needsSetup ? "setup" : "login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    clientName: "Norte",
    schemaName: "trucks",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiJson(mode === "setup" ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        body: form,
      });
      onSuccess(result);
    } catch (e) {
      setError("Nao foi possivel acessar. Confira os dados informados.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="auth-shell">
      <form className="auth-panel" onSubmit={submit}>
        <div>
          <h1>{mode === "setup" ? "Primeiro acesso" : "Entrar"}</h1>
          <div className="sub">{mode === "setup" ? "Crie o admin e vincule o cliente inicial" : "Acesse o painel Norte Telemetria"}</div>
        </div>
        {mode === "setup" && (
          <>
            <label className="form-field">Nome<input {...field("name")} required autoComplete="name"/></label>
            <label className="form-field">Cliente<input {...field("clientName")} required/></label>
            <label className="form-field">Schema do cliente<input {...field("schemaName")} required pattern="[a-z][a-z0-9_]*"/></label>
          </>
        )}
        <label className="form-field">Email<input type="email" {...field("email")} required autoComplete="email"/></label>
        <label className="form-field">Senha<input type="password" {...field("password")} required autoComplete={mode === "setup" ? "new-password" : "current-password"}/></label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" type="submit" disabled={saving}>{saving ? "Entrando..." : mode === "setup" ? "Criar acesso" : "Entrar"}</button>
      </form>
    </div>
  );
};

const CredentialsModal = ({ token, onSaved }) => {
  const [form, setForm] = useState({
    apiUrl: "https://webservice.newrastreamentoonline.com.br/",
    login: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const status = await apiJson("/api/integration/credentials", {
        method: "POST",
        token,
        body: form,
      });
      onSaved(status);
    } catch (e) {
      setError("Nao foi possivel salvar. Confira a chave APP_ENCRYPTION_KEY e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submit}>
        <div className="section-head">
          <h2>Credenciais Trucks</h2>
        </div>
        <label className="form-field">URL da API<input {...field("apiUrl")} required/></label>
        <label className="form-field">Login<input {...field("login")} required autoComplete="off"/></label>
        <label className="form-field">Senha<input type="password" {...field("password")} required autoComplete="new-password"/></label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar credenciais"}</button>
      </form>
    </div>
  );
};

// Settings — with theme + density switchers
const SettingsScreen = ({ theme, setTheme, density, setDensity, token, credentialStatus, onCredentialsSaved, isPlatformAdmin }) => {
  const [settingsView, setSettingsView] = useState("home");
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

  if (settingsView === "trucks") {
    return (
      <TrucksCredentialsSettings
        token={token}
        credential={credentialStatus.credential}
        onBack={() => setSettingsView("home")}
        onSaved={onCredentialsSaved}
      />
    );
  }

  if (settingsView === "clients" && isPlatformAdmin) {
    return <ClientsSettings token={token} onBack={() => setSettingsView("home")}/>;
  }

  if (settingsView === "users" && isPlatformAdmin) {
    return <UsersSettings token={token} onBack={() => setSettingsView("home")}/>;
  }

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
          ...(isPlatformAdmin
            ? [
                { t: "Clientes", d: "Criar acesso e schema do cliente", i: "user", onClick: () => setSettingsView("clients") },
                { t: "Usuários e permissões", d: "Criar acessos para ambientes", i: "user", onClick: () => setSettingsView("users") },
              ]
            : []),
          { t: "Perfis de alerta", d: "Velocidade · RPM · Cerca virtual · Sirene", i: "bell" },
          {
            t: "Integração Trucks",
            d: credentialStatus.configured
              ? `${credentialStatus.credential?.login || "Credencial ativa"} · configurada`
              : "Credenciais pendentes",
            i: "plug",
            onClick: () => setSettingsView("trucks"),
          },
          { t: "Webhooks e notificações", d: "2 webhooks ativos", i: "external" },
          { t: "Exportação e BI", d: "PowerBI · Looker Studio · CSV", i: "download" },
        ].map((c, i) => (
          <button key={i} className="card settings-card-button" onClick={c.onClick || (() => {})} type="button">
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
          </button>
        ))}
      </div>
    </div>
  );
};

const TrucksCredentialsSettings = ({ token, credential, onBack, onSaved }) => {
  const [form, setForm] = useState({
    apiUrl: credential?.apiUrl || "https://webservice.newrastreamentoonline.com.br/",
    login: credential?.login || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      apiUrl: credential?.apiUrl || "https://webservice.newrastreamentoonline.com.br/",
      login: credential?.login || "",
      password: "",
    });
  }, [credential]);

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const status = await apiJson("/api/integration/credentials", {
        method: "POST",
        token,
        body: form,
      });
      onSaved(status);
      setForm((current) => ({ ...current, password: "" }));
      setMessage("Credenciais salvas.");
    } catch (e) {
      setError("Não foi possível salvar as credenciais.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <button className="btn ghost sm" onClick={onBack} type="button">Voltar</button>
          <h1 style={{marginTop: 10}}>Integração Trucks</h1>
          <div className="sub">Credenciais usadas pela ingestão para consultar a API da Trucks</div>
        </div>
      </div>

      <form className="card settings-form" onSubmit={submit}>
        <label className="form-field">URL da API<input {...field("apiUrl")} required/></label>
        <label className="form-field">Login<input {...field("login")} required autoComplete="off"/></label>
        <label className="form-field">
          Senha
          <input type="password" {...field("password")} placeholder={credential ? "Deixe em branco para manter a senha atual" : ""} autoComplete="new-password"/>
        </label>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <div className="row" style={{gap: 8}}>
          <button className="btn primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar credenciais"}</button>
          <button className="btn ghost" type="button" onClick={onBack}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

const ClientsSettings = ({ token, onBack }) => {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    clientName: "",
    slug: "",
    schemaName: "",
    sourceSchema: "trucks",
    copyData: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const rows = await apiJson("/api/clients", { token });
      setClients(rows);
      setError("");
    } catch (e) {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [token]);

  const field = (key) => ({
    value: form[key],
    onChange: (event) => {
      const value = event.target.value;
      setForm((current) => {
        const next = { ...current, [key]: value };
        if (key === "clientName" && !current.slug && !current.schemaName) {
          const slug = slugify(value);
          next.slug = slug;
          next.schemaName = slug.replace(/-/g, "_");
        }
        if (key === "slug" && !current.schemaName) {
          next.schemaName = slugify(value).replace(/-/g, "_");
        }
        return next;
      });
    },
  });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiJson("/api/clients", {
        method: "POST",
        token,
        body: form,
      });
      setForm({ clientName: "", slug: "", schemaName: "", sourceSchema: "trucks", copyData: false });
      setMessage("Cliente criado.");
      await loadClients();
    } catch (e) {
      setError("Não foi possível criar o cliente. Confira se slug e schema ainda não existem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <button className="btn ghost sm" onClick={onBack} type="button">Voltar</button>
          <h1 style={{marginTop: 10}}>Clientes</h1>
          <div className="sub">Criação manual do acesso e schema operacional do cliente</div>
        </div>
      </div>

      <form className="card settings-form" onSubmit={submit} style={{marginBottom: 16}}>
        <div className="section-head"><h2>Novo cliente</h2></div>
        <label className="form-field">Nome do cliente<input {...field("clientName")} required/></label>
        <div className="grid cols-2" style={{gap: 12}}>
          <label className="form-field">Slug<input {...field("slug")} required pattern="[a-z0-9][a-z0-9_-]*"/></label>
          <label className="form-field">Schema<input {...field("schemaName")} required pattern="[a-z][a-z0-9_]*"/></label>
        </div>
        <div className="grid cols-2" style={{gap: 12}}>
          <label className="form-field">Schema base<input {...field("sourceSchema")} placeholder="trucks" pattern="[a-z][a-z0-9_]*"/></label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.copyData}
              onChange={(event) => setForm((current) => ({ ...current, copyData: event.target.checked }))}
            />
            Copiar dados do schema base
          </label>
        </div>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" type="submit" disabled={saving}>{saving ? "Criando..." : "Criar cliente"}</button>
      </form>

      <div className="card card-flush">
        <div className="card-header">
          <h3>Clientes cadastrados</h3>
          <span className="meta">{loading ? "carregando" : `${clients.length} clientes`}</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Slug</th>
              <th>Schema</th>
              <th>Status</th>
              <th style={{textAlign: "right"}}>Usuários</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td className="num muted">{client.slug}</td>
                <td className="num">{client.schemaName}</td>
                <td>{client.enabled ? <span className="badge ok">Ativo</span> : <span className="badge">Inativo</span>}</td>
                <td className="num" style={{textAlign: "right"}}>{client.users}</td>
              </tr>
            ))}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={5} className="muted">Nenhum cliente cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UsersSettings = ({ token, onBack }) => {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", clientId: "", role: "viewer" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [userRows, clientRows] = await Promise.all([
        apiJson("/api/users", { token }),
        apiJson("/api/clients", { token }),
      ]);
      setUsers(userRows);
      setClients(clientRows);
      setForm((current) => ({ ...current, clientId: current.clientId || String(clientRows[0]?.id || "") }));
      setError("");
    } catch (e) {
      setError("Não foi possível carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiJson("/api/users", {
        method: "POST",
        token,
        body: form,
      });
      setForm((current) => ({ name: "", email: "", password: "", clientId: current.clientId, role: "viewer" }));
      setMessage("Usuário criado.");
      await load();
    } catch (e) {
      setError("Não foi possível criar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <button className="btn ghost sm" onClick={onBack} type="button">Voltar</button>
          <h1 style={{marginTop: 10}}>Usuários e permissões</h1>
          <div className="sub">Crie acessos para ambientes existentes, sem criar novos schemas</div>
        </div>
      </div>

      <form className="card settings-form" onSubmit={submit} style={{marginBottom: 16}}>
        <div className="section-head"><h2>Novo usuário</h2></div>
        <div className="grid cols-2" style={{gap: 12}}>
          <label className="form-field">Nome<input {...field("name")} required/></label>
          <label className="form-field">Email<input type="email" {...field("email")} required/></label>
        </div>
        <label className="form-field">Senha inicial<input type="password" {...field("password")} required autoComplete="new-password"/></label>
        <div className="grid cols-2" style={{gap: 12}}>
          <label className="form-field">
            Ambiente
            <select className="form-select" {...field("clientId")} required>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Perfil
            <select className="form-select" {...field("role")}>
              <option value="viewer">Visualizador</option>
              <option value="operator">Operador</option>
              <option value="admin">Admin do ambiente</option>
              <option value="owner">Dono do ambiente</option>
            </select>
          </label>
        </div>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <button className="btn primary" type="submit" disabled={saving || !clients.length}>{saving ? "Criando..." : "Criar usuário"}</button>
      </form>

      <div className="card card-flush">
        <div className="card-header">
          <h3>Usuários cadastrados</h3>
          <span className="meta">{loading ? "carregando" : `${users.length} vínculos`}</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Ambiente</th>
              <th>Perfil</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={`${user.id}-${user.clientId || index}`}>
                <td>{user.name}</td>
                <td className="num muted">{user.email}</td>
                <td>{user.clientName || (user.isPlatformAdmin ? "Todos" : "-")}</td>
                <td className="num">{user.isPlatformAdmin ? "platform_admin" : user.role}</td>
                <td>{user.enabled ? <span className="badge ok">Ativo</span> : <span className="badge">Inativo</span>}</td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="muted">Nenhum usuário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default App;
