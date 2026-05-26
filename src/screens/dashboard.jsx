import { EMPTY_DATA } from "../live-data";
import { BarChart, Icon, KPI, MiniBar, Plate, fmtNum } from "../components";

// Dashboard screen - Norte Telemetria
export const Dashboard = ({ data, onGoToVehicle, onNavigate }) => {
  const D = data || EMPTY_DATA;
  const fleet = D.FLEET;
  const n = (value) => Number(value) || 0;

  const online = fleet.filter(v => v.status === "online").length;
  const atrasados = fleet.filter(v => v.status === "atrasado").length;
  const semComm = fleet.filter(v => v.status === "sem-comm").length;
  const totalAlerts24h = D.ALERTS.filter(a => a.minAgo <= 1440).length;
  const criticos24h = D.ALERTS.filter(a => a.minAgo <= 1440 && a.sev === "crit").length;
  const km7d = D.DAILY.reduce((s, d) => s + n(d.km), 0);
  const fuelAvg = (D.DAILY.reduce((s, d) => s + n(d.fuel), 0) / Math.max(D.DAILY.length, 1)).toFixed(1);
  const idleAvg = (fleet.reduce((s, v) => s + n(v.idleH), 0) / Math.max(fleet.length, 1)).toFixed(1);

  // Ranking: top 6 vehicles by alerts
  const ranking = [...fleet].sort((a, b) => b.alerts7d - a.alerts7d).slice(0, 6);
  const critical = D.ALERTS.filter(a => a.sev === "crit").slice(0, 5);

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Visão geral</h1>
          <div className="sub">Frota Norte Logística · dados vindos da API</div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Veículos monitorados" icon="truck" value={fleet.length}/>
        <KPI label="Comunicando hoje" icon="wifi" value={online + atrasados}
             delta={`${online} online · ${atrasados} atrasados`}
             deltaDir="flat"/>
        <KPI label="Sem comunicação" icon="wifi-off" value={semComm}/>
        <KPI label="Alertas em 24h" icon="alert" value={totalAlerts24h}
             delta={`${criticos24h} críticos`} deltaDir="down"/>
      </div>

      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Km rodados (7 dias)" icon="chart" value={fmtNum(km7d)} unit="km"/>
        <KPI label="Consumo médio" icon="fuel" value={fuelAvg} unit="km/l"/>
        <KPI label="Motor ligado parado" icon="idle" value={idleAvg} unit="h/veíc"/>
        <KPI label="Jobs de integração" icon="plug" value={D.JOBS.length}/>
      </div>

      <div className="grid cols-2-1" style={{marginBottom: 16}}>
        {/* Alerts by type */}
        <div className="card card-flush">
          <div className="card-header">
            <h3>Alertas por tipo · últimas 24h</h3>
            <span className="meta num">{totalAlerts24h} eventos</span>
          </div>
          <div className="card-body">
            <BarChart rows={D.TOP_EVENT_TYPES.map(t => ({
              label: t.label, value: t.count, sev: t.sev
            }))}/>
          </div>
        </div>

        {/* Ranking ocorrências */}
        <div className="card card-flush">
          <div className="card-header">
            <h3>Mais ocorrências · 7 dias</h3>
            <a className="link muted" onClick={() => onNavigate("alerts")}>Ver alertas <Icon name="arrow-right" size={11}/></a>
          </div>
          <table className="tbl">
            <tbody>
              {ranking.map(v => (
                <tr key={v.id} className="clickable" onClick={() => onGoToVehicle(v.plate)}>
                  <td><Plate value={v.plate}/></td>
                  <td className="muted" style={{maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                    {v.driver}
                  </td>
                  <td className="num" style={{width: 60}}>{v.alerts7d}</td>
                  <td style={{width: 90}}>
                    <MiniBar values={[3,5,2,4,v.alerts7d/2,6,v.alerts7d]} accent/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical events recent + activity */}
      <div className="grid cols-2-1">
        <div className="card card-flush">
          <div className="card-header">
            <h3>Eventos críticos recentes</h3>
            <a className="link muted" onClick={() => onNavigate("alerts")}>Ver todos <Icon name="arrow-right" size={11}/></a>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{width: 90}}>Quando</th>
                <th>Evento</th>
                <th>Veículo</th>
                <th>Motorista</th>
                <th>Local</th>
              </tr>
            </thead>
            <tbody>
              {critical.map(a => (
                <tr key={a.id} className={`row-${a.sev} clickable`} onClick={() => onGoToVehicle(a.veh)}>
                  <td className="muted num">{a.when}</td>
                  <td>{a.label}</td>
                  <td><Plate value={a.veh}/></td>
                  <td className="muted">{a.driver}</td>
                  <td className="muted">{a.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col" style={{gap: 16}}>
          <div className="card">
            <div className="section-head">
              <h2>Atividade da frota · 7 dias</h2>
              <span className="muted num" style={{fontSize: 11.5}}>km/dia</span>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, alignItems: "end", height: 84}}>
              {D.DAILY.map(d => {
                const max = Math.max(...D.DAILY.map(x => x.km), 1);
                return (
                  <div key={d.day} className="col" style={{alignItems: "center", gap: 4, justifyContent: "flex-end"}}>
                    <div style={{
                      width: "100%",
                      height: `${(d.km / max) * 70}px`,
                      background: d.day === "Ter" ? "var(--brand-blue)" : "var(--brand-navy)",
                      borderRadius: 3,
                      opacity: d.day === "Ter" ? 1 : 0.18 + (d.km / max) * 0.55,
                    }}/>
                    <span className="muted" style={{fontSize: 10.5}}>{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="row between" style={{marginTop: 12, fontSize: 11.5}}>
              <span className="muted">Total: <b className="num" style={{color: "var(--text)"}}>{fmtNum(km7d)} km</b></span>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h2>Saúde da integração</h2>
              <a className="link muted" onClick={() => onNavigate("integration")}>Detalhes <Icon name="arrow-right" size={11}/></a>
            </div>
            <div className="col" style={{gap: 8}}>
              {D.JOBS.map(j => (
                <div key={j.id} className="row between" style={{fontSize: 12}}>
                  <span className="row" style={{gap: 8}}>
                    <span className={`dot ${j.status === "ok" ? "ok" : j.status === "warn" ? "warn" : "crit"}`}/>
                    <span className="num" style={{color: "var(--text-2)"}}>{j.label}</span>
                  </span>
                  <span className="muted num">{j.lastRun}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
