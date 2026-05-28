import * as React from "react";
import { EMPTY_DATA } from "../live-data";
import { Icon, KPI, Plate, SelectFilter, SeverityBadge, fmtNum } from "../components";

// Alertas e Ocorrencias - Norte Telemetria
export const Alerts = ({ data, onGoToVehicle, initialFilters = {} }) => {
  const D = data || EMPTY_DATA;
  const [search, setSearch] = React.useState("");
  const [sevFilter, setSevFilter] = React.useState(initialFilters.severity || "todos");
  const [statusFilter, setStatusFilter] = React.useState(initialFilters.status || "todos");
  const [ufFilter, setUfFilter] = React.useState(initialFilters.uf || "todos");
  const [eventFilter, setEventFilter] = React.useState(initialFilters.eventType || "todos");
  const [vehicleFilter, setVehicleFilter] = React.useState(initialFilters.vehicle || "todos");
  const [period, setPeriod] = React.useState(initialFilters.period || "24h");
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  const all = D.ALERTS;
  const periodCutoff = period === "24h" ? 1440 : period === "7d" ? 10080 : period === "30d" ? 43200 : Infinity;
  const vehicleByPlate = new Map(D.FLEET.map((v) => [v.plate, v]));
  const eventOptions = [
    { value: "todos", label: "Todos eventos" },
    ...Array.from(new Set(all.map((a) => a.label))).sort().map((label) => ({ value: label, label })),
  ];
  const vehicleOptions = [
    { value: "todos", label: "Todos veiculos" },
    ...D.FLEET.map((v) => ({ value: v.plate, label: v.plate })),
  ];
  const ufOptions = [
    { value: "todos", label: "Todas UF" },
    ...Array.from(new Set(D.FLEET.map((v) => v.uf).filter(Boolean))).sort().map((uf) => ({ value: uf, label: uf })),
  ];
  const severityOptions = [
    { value: "todos", label: "Todas" },
    { value: "crit", label: "Critico" },
    { value: "warn", label: "Atencao" },
    { value: "info", label: "Info" },
  ];
  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "online", label: "Online" },
    { value: "atrasado", label: "Atrasado" },
    { value: "sem-comm", label: "Sem comunicacao" },
  ];
  const periodOptions = [
    { value: "24h", label: "Ultimas 24h" },
    { value: "7d", label: "Ultimos 7 dias" },
    { value: "30d", label: "Ultimos 30 dias" },
  ];
  const periodLabel = periodOptions.find((option) => option.value === period)?.label || period;

  React.useEffect(() => {
    setSevFilter(initialFilters.severity || "todos");
    setStatusFilter(initialFilters.status || "todos");
    setUfFilter(initialFilters.uf || "todos");
    setEventFilter(initialFilters.eventType || "todos");
    setVehicleFilter(initialFilters.vehicle || "todos");
    setPeriod(initialFilters.period || "24h");
    setPage(1);
  }, [initialFilters.severity, initialFilters.status, initialFilters.uf, initialFilters.eventType, initialFilters.vehicle, initialFilters.period]);

  let rows = all.filter(a => {
    const vehicle = vehicleByPlate.get(a.veh);
    if (a.minAgo > periodCutoff) return false;
    if (sevFilter !== "todos" && a.sev !== sevFilter) return false;
    if (statusFilter !== "todos" && vehicle?.status !== statusFilter) return false;
    if (ufFilter !== "todos" && vehicle?.uf !== ufFilter) return false;
    if (eventFilter !== "todos" && a.label !== eventFilter) return false;
    if (vehicleFilter !== "todos" && a.veh !== vehicleFilter) return false;
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
          <div className="sub">Eventos de telemetria, bordo e bloqueio · {periodLabel.toLowerCase()}</div>
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
          <button style={{display: "none"}} className={`tbl-filter ${sevFilter !== "todos" ? "active" : ""}`}
                  onClick={() => {
                    const opts = ["todos", "crit", "warn", "info"];
                    setSevFilter(opts[(opts.indexOf(sevFilter) + 1) % opts.length]);
                    setPage(1);
                  }}>
            Severidade <span className="v">{sevFilter === "crit" ? "Crítico" : sevFilter === "warn" ? "Atenção" : sevFilter === "info" ? "Info" : "todas"}</span>
          </button>
        </div>

        <div className="tbl-toolbar tbl-toolbar-secondary">
          <SelectFilter label="Periodo" value={period} options={periodOptions} onChange={(v) => { setPeriod(v); setPage(1); }} active={period !== "24h"}/>
          <SelectFilter label="Severidade" value={sevFilter} options={severityOptions} onChange={(v) => { setSevFilter(v); setPage(1); }} active={sevFilter !== "todos"}/>
          <SelectFilter label="Status" value={statusFilter} options={statusOptions} onChange={(v) => { setStatusFilter(v); setPage(1); }} active={statusFilter !== "todos"}/>
          <SelectFilter label="UF" value={ufFilter} options={ufOptions} onChange={(v) => { setUfFilter(v); setPage(1); }} active={ufFilter !== "todos"}/>
          <SelectFilter label="Tipo" value={eventFilter} options={eventOptions} onChange={(v) => { setEventFilter(v); setPage(1); }} active={eventFilter !== "todos"}/>
          <SelectFilter label="Veiculo" value={vehicleFilter} options={vehicleOptions} onChange={(v) => { setVehicleFilter(v); setPage(1); }} active={vehicleFilter !== "todos"}/>
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
