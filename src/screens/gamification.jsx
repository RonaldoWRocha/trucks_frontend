import * as React from "react";
import { apiJson } from "../live-data";
import { Icon, KPI, fmtNum } from "../components";

const DEFAULT_DAYS = 30;

export const Gamification = ({ token }) => {
  const [drivers, setDrivers] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [period, setPeriod] = React.useState(() => defaultPeriod());
  const [report, setReport] = React.useState(null);
  const [evidenceRow, setEvidenceRow] = React.useState(null);
  const [loadingDrivers, setLoadingDrivers] = React.useState(true);
  const [loadingReport, setLoadingReport] = React.useState(false);
  const [error, setError] = React.useState("");

  const loadDrivers = React.useCallback(async () => {
    setLoadingDrivers(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search.trim()) params.set("search", search.trim());
      setDrivers(await apiJson(`/api/gamification/drivers?${params.toString()}`, { token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar motoristas.");
    } finally {
      setLoadingDrivers(false);
    }
  }, [search, token]);

  React.useEffect(() => {
    const timer = window.setTimeout(loadDrivers, 180);
    return () => window.clearTimeout(timer);
  }, [loadDrivers]);

  const selectDriver = (driver) => {
    setSelected(driver);
    setReport(null);
    setError("");
  };

  const loadReport = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setLoadingReport(true);
    setError("");
    try {
      const params = new URLSearchParams({ start: period.start, end: period.end });
      const path = `/api/gamification/drivers/${encodeURIComponent(selected.name)}/report?${params.toString()}`;
      const nextReport = await apiJson(path, { token });
      setReport(nextReport);
      setEvidenceRow(nextReport.rows?.[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel gamificar esse periodo.");
    } finally {
      setLoadingReport(false);
    }
  };

  const totals = report?.totals || {};

  return (
    <div className="view gamification-view">
      <div className="page-head">
        <div>
          <h1>Análises</h1>
          <div className="sub">Análise gamificada de condução com evidências por indicador</div>
        </div>
      </div>

      {error && <div className="form-error" style={{marginBottom: 12}}>{error}</div>}

      <div className="gamification-layout">
        <section className="card card-flush gamification-drivers">
          <div className="tbl-toolbar">
            <div className="search">
              <Icon name="search"/>
              <input
                placeholder="Buscar motorista..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="driver-rank-list">
            {drivers.map((driver, index) => (
              <button
                key={driver.name}
                type="button"
                className={`driver-rank-row ${selected?.name === driver.name ? "active" : ""}`}
                onClick={() => selectDriver(driver)}
              >
                <span className="rank-pos">{index + 1}</span>
                <span className="rank-main">
                  <strong>{driver.name}</strong>
                  <small>{driver.plates || "Sem placa vinculada"}</small>
                </span>
                <span className="rank-metric">
                  <b>{fmtNum(Number(driver.distance30d || 0), {maximumFractionDigits: 0})}</b>
                  <small>km 30d</small>
                </span>
              </button>
            ))}
            {!loadingDrivers && drivers.length === 0 && (
              <div className="empty-state">Nenhum motorista com telemetria encontrada.</div>
            )}
            {loadingDrivers && <div className="empty-state">Carregando motoristas...</div>}
          </div>
        </section>

        <section className="gamification-report">
          <form className="card period-panel" onSubmit={loadReport}>
            <div>
              <div className="section-head"><h2>Análise gamificada</h2></div>
              <div className="selected-driver">
                <Icon name="user"/>
                <span>{selected?.name || "Selecione um motorista"}</span>
              </div>
            </div>
            <div className="period-fields">
              <label className="form-field">Data inicio<input type="date" value={period.start} onChange={(event) => setPeriod((current) => ({ ...current, start: event.target.value }))}/></label>
              <label className="form-field">Data fim<input type="date" value={period.end} onChange={(event) => setPeriod((current) => ({ ...current, end: event.target.value }))}/></label>
              <button className="btn primary" type="submit" disabled={!selected || loadingReport}>
                <Icon name="chart"/>
                {loadingReport ? "Analisando..." : "Gerar análise"}
              </button>
            </div>
          </form>

          {report && (
            <>
              <div className="grid cols-5 gamification-kpis">
                <KPI label="Nota geral" icon="award" value={fmtNum(totals.score || 0)}/>
                <KPI label="Distancia" icon="map" value={fmtNum(totals.distance || 0, {maximumFractionDigits: 0})} unit="km"/>
                <KPI label="Faixa verde" icon="gauge" value={fmtNum(totals.greenBandScore || 0)}/>
                <KPI label="Embalo" icon="fuel" value={fmtNum(totals.coastScore || 0)}/>
                <KPI label="Motor parado" icon="idle" value={fmtNum(totals.idleScore || 0)}/>
              </div>

              <div className="card card-flush report-table-card">
                <div className="card-header">
                  <h3>Resultado da análise</h3>
                  <span className="meta">{report.rows.length} registro(s)</span>
                </div>
                {evidenceRow && <EvidencePanel row={evidenceRow}/>}
                <div className="wide-table-scroll">
                  <table className="tbl gamification-table">
                    <thead>
                      <tr>
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Placa</th>
                        <th>Frota</th>
                        <th>Dist. percorrida</th>
                        <th>Nota geral</th>
                        <th>Inicio faixa verde</th>
                        <th>Aproveitamento embalo</th>
                        <th>Motor ligado parado</th>
                        <th>Velocidade</th>
                        <th>Consumo medio</th>
                        <th>RPM medio</th>
                        <th>Provas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, index) => (
                        <tr
                          key={`${row.date}-${row.plate}-${index}`}
                          className={evidenceRow === row ? "selected-analysis-row" : ""}
                        >
                          <td className="num">{row.startAt}</td>
                          <td className="num">{row.endAt}</td>
                          <td className="num">{row.plate || "-"}</td>
                          <td className="num muted">{row.fleet || "-"}</td>
                          <td className="num">{fmtNum(row.distance || 0, {maximumFractionDigits: 1})}</td>
                          <td><ScorePill value={row.score}/></td>
                          <td><ScorePill value={row.greenBandScore}/></td>
                          <td><ScorePill value={row.coastScore}/></td>
                          <td><ScorePill value={row.idleScore}/></td>
                          <td><ScorePill value={row.speedScore}/></td>
                          <td className="num">{fmtNum(row.avgFuel || 0, {maximumFractionDigits: 2})}</td>
                          <td className="num">{fmtNum(row.avgRpm || 0, {maximumFractionDigits: 0})}</td>
                          <td>
                            <button className="btn ghost sm" type="button" onClick={() => setEvidenceRow(row)}>
                              Ver provas
                            </button>
                          </td>
                        </tr>
                      ))}
                      {report.rows.length === 0 && (
                        <tr><td colSpan={13} className="muted" style={{textAlign: "center", padding: 36}}>Nenhum registro encontrado nesse periodo.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const ScorePill = ({ value }) => {
  const score = Math.round(Number(value || 0));
  const cls = score >= 90 ? "great" : score >= 75 ? "good" : score >= 60 ? "warn" : "bad";
  return <span className={`score-pill ${cls}`}>{score}</span>;
};

const EvidencePanel = ({ row }) => (
  <div className="evidence-panel">
    <div className="evidence-head">
      <div>
        <h4>Provas da nota</h4>
        <span>{row.plate || "-"} · {row.startAt} a {row.endAt}</span>
      </div>
      <ScorePill value={row.score}/>
    </div>
    <div className="evidence-grid">
      {(row.evidence || []).map((item) => (
        <div className="evidence-card" key={item.key}>
          <div className="row between">
            <strong>{item.label}</strong>
            <ScorePill value={item.score}/>
          </div>
          <dl>
            {Object.entries(item.measured || {}).map(([key, value]) => (
              <React.Fragment key={key}>
                <dt>{metricLabel(key)}</dt>
                <dd>{formatMetric(key, value)}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p>{item.reference}</p>
          <small>{item.reason}</small>
        </div>
      ))}
    </div>
  </div>
);

function metricLabel(key) {
  const map = {
    avgRpm: "RPM medio",
    maxRpm: "RPM maximo",
    avgFuel: "Consumo medio",
    avgSpeed: "Velocidade media",
    maxSpeed: "Velocidade maxima",
    idlePercent: "Motor parado",
  };
  return map[key] || key;
}

function formatMetric(key, value) {
  if (key === "avgFuel") return `${fmtNum(Number(value || 0), {maximumFractionDigits: 2})} km/l`;
  if (key === "idlePercent") return `${fmtNum(Number(value || 0), {maximumFractionDigits: 0})}%`;
  if (key.toLowerCase().includes("speed")) return `${fmtNum(Number(value || 0), {maximumFractionDigits: 0})} km/h`;
  if (key.toLowerCase().includes("rpm")) return `${fmtNum(Number(value || 0), {maximumFractionDigits: 0})} rpm`;
  return fmtNum(Number(value || 0), {maximumFractionDigits: 1});
}

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - DEFAULT_DAYS + 1);
  return {
    start: toDateInput(start),
    end: toDateInput(end),
  };
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
