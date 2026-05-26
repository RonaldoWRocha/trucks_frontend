import * as React from "react";
import { EMPTY_DATA } from "../live-data";
import { Icon, KPI, Plate, SeverityBadge, fmtNum } from "../components";

// Alertas e Ocorrencias - Norte Telemetria
export const Alerts = ({ data, onGoToVehicle }) => {
  const D = data || EMPTY_DATA;
  const [search, setSearch] = React.useState("");
  const [sevFilter, setSevFilter] = React.useState("todos");
  const [period, setPeriod] = React.useState("24h");
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  const all = D.ALERTS;
  const periodCutoff = period === "24h" ? 1440 : period === "7d" ? 10080 : period === "30d" ? 43200 : Infinity;

  let rows = all.filter(a => {
    if (a.minAgo > periodCutoff) return false;
    if (sevFilter !== "todos" && a.sev !== sevFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.veh.toLowerCase().includes(q) && !a.driver.toLowerCase().includes(q) && !a.label.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const total = rows.length;
  const inPeriod = all.filter(a => a.minAgo <= periodCutoff);
  const crit = inPeriod.filter(a => a.sev === "crit").length;

  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const visible = rows.slice(start, start + perPage);

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Alertas e ocorrências</h1>
          <div className="sub">Eventos de telemetria, bordo e bloqueio · {period === "24h" ? "últimas 24h" : period}</div>
        </div>
        <div className="actions">
          <div className="row" style={{gap: 4, padding: 2, background: "var(--surface-2)", borderRadius: 6, border: "1px solid var(--border)"}}>
            {["24h", "7d", "30d", "tudo"].map(p => (
              <button key={p}
                      className={`btn ghost sm ${period === p ? "" : ""}`}
                      style={{
                        background: period === p ? "var(--surface)" : "transparent",
                        boxShadow: period === p ? "var(--shadow-sm)" : "none",
                        color: period === p ? "var(--text)" : "var(--text-3)",
                        height: 24, padding: "0 10px",
                      }}
                      onClick={() => { setPeriod(p); setPage(1); }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Total de alertas" icon="alert" value={fmtNum(inPeriod.length)}
             sub={`${total} após filtros`}/>
        <KPI label="Críticos" icon="alarm" value={crit}
             delta={`${((crit/Math.max(1,inPeriod.length))*100).toFixed(0)}%`} deltaDir="down"
             sub="dos eventos"/>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="search">
            <Icon name="search"/>
            <input
              placeholder="Buscar por placa, motorista ou tipo de evento…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className={`tbl-filter ${sevFilter !== "todos" ? "active" : ""}`}
                  onClick={() => {
                    const opts = ["todos", "crit", "warn", "info"];
                    setSevFilter(opts[(opts.indexOf(sevFilter) + 1) % opts.length]);
                    setPage(1);
                  }}>
            Severidade <span className="v">{sevFilter === "crit" ? "Crítico" : sevFilter === "warn" ? "Atenção" : sevFilter === "info" ? "Info" : "todas"}</span>
          </button>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th style={{width: 100}}>Quando</th>
              <th>Evento</th>
              <th>Severidade</th>
              <th>Veículo</th>
              <th>Motorista</th>
              <th>Local</th>
              <th>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(a => (
              <tr key={a.id} className={`row-${a.sev} clickable`} onClick={() => onGoToVehicle(a.veh)}>
                <td className="muted num">{a.when}</td>
                <td>{a.label}</td>
                <td><SeverityBadge sev={a.sev}/></td>
                <td><Plate value={a.veh}/></td>
                <td className="muted">{a.driver}</td>
                <td className="muted">{a.location}</td>
                <td className="num" style={{fontSize: 11.5}}>
                  {a.speed && `${a.speed} km/h`}
                  {a.rpm && `${fmtNum(a.rpm)} rpm`}
                  {!a.speed && !a.rpm && <span className="dim">—</span>}
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={7} className="muted" style={{textAlign: "center", padding: 36}}>Nenhum alerta para os filtros atuais.</td></tr>}
          </tbody>
        </table>

        <div className="tbl-footer">
          <span>Mostrando <b className="num" style={{color: "var(--text)"}}>{Math.min(start + 1, total)}-{Math.min(start + perPage, total)}</b> de <b className="num" style={{color: "var(--text)"}}>{total}</b></span>
          <div className="pager">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({length: pages}, (_, i) => (
              <button key={i} className={page === i + 1 ? "active" : ""} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
};
