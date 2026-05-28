import { EMPTY_DATA } from "../live-data";
import { BarChart, Icon, KPI, MiniBar, Plate, fmtNum } from "../components";

// Relatorios de Desempenho - Norte Telemetria
export const Reports = ({ data, onGoToVehicle }) => {
  const D = data || EMPTY_DATA;
  const fleet = D.FLEET;

  const n = (value) => Number(value) || 0;
  const totalKm = fleet.reduce((s, v) => s + n(v.distance7d), 0);
  const avgSpeed = (fleet.reduce((s, v) => s + n(v.avgSpeed), 0) / Math.max(fleet.length, 1)).toFixed(0);
  const avgFuel = (fleet.reduce((s, v) => s + n(v.fuel), 0) / Math.max(fleet.length, 1)).toFixed(2);
  const totalIdle = fleet.reduce((s, v) => s + n(v.idleH), 0).toFixed(0);

  const mostEfficient = [...fleet].sort((a, b) => n(b.fuel) - n(a.fuel)).slice(0, 5);
  const leastEfficient = [...fleet].sort((a, b) => n(a.fuel) - n(b.fuel)).slice(0, 5);

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Relatórios de desempenho</h1>
          <div className="sub">Visão comparativa da frota · últimos 7 dias</div>
        </div>
      </div>

      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Distância total" icon="chart" value={fmtNum(totalKm)} unit="km"/>
        <KPI label="Velocidade média" icon="speedometer" value={avgSpeed} unit="km/h"
             delta="estável" deltaDir="flat"/>
        <KPI label="Consumo médio" icon="fuel" value={avgFuel} unit="km/l"/>
        <KPI label="Motor ligado parado" icon="idle" value={totalIdle} unit="h"/>
      </div>

      <div className="grid cols-2" style={{marginBottom: 16}}>
        <div className="card">
          <div className="section-head">
            <h2>Distância por veículo · 7 dias</h2>
            <span className="muted num" style={{fontSize: 11.5}}>{fleet.length} veículos</span>
          </div>
          <BarChart rows={[...fleet]
            .sort((a, b) => n(b.distance7d) - n(a.distance7d))
            .slice(0, 10)
            .map(v => ({ label: v.plate, value: n(v.distance7d) }))}/>
        </div>
        <div className="card">
          <div className="section-head">
            <h2>Distribuição da operação · frota</h2>
            <span className="muted" style={{fontSize: 11.5}}>tempo total</span>
          </div>
          {(() => {
            const moving = fleet.reduce((s, v) => s + (n(v.motorOnH) - n(v.idleH)), 0);
            const idle = fleet.reduce((s, v) => s + n(v.idleH), 0);
            const off = fleet.reduce((s, v) => s + n(v.motorOffH), 0);
            const total = moving + idle + off;
            return (
              <div className="col" style={{gap: 16, marginTop: 8}}>
                <div style={{height: 28, display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)"}}>
                  <div style={{width: `${(moving/total)*100}%`, background: "var(--brand-navy)"}}/>
                  <div style={{width: `${(idle/total)*100}%`, background: "var(--warn)"}}/>
                  <div style={{width: `${(off/total)*100}%`, background: "var(--surface-3)"}}/>
                </div>
                <div className="grid cols-3" style={{gap: 14}}>
                  <div>
                    <div className="row" style={{gap: 6, marginBottom: 4}}>
                      <span className="dot" style={{background: "var(--brand-navy)"}}/>
                      <span className="muted" style={{fontSize: 11.5}}>Em movimento</span>
                    </div>
                    <div className="num" style={{fontSize: 17, fontWeight: 500}}>{fmtNum(Math.round(moving))}h</div>
                    <div className="muted num" style={{fontSize: 11.5}}>{((moving/total)*100).toFixed(0)}% do tempo</div>
                  </div>
                  <div>
                    <div className="row" style={{gap: 6, marginBottom: 4}}>
                      <span className="dot warn"/>
                      <span className="muted" style={{fontSize: 11.5}}>Parado · motor ligado</span>
                    </div>
                    <div className="num" style={{fontSize: 17, fontWeight: 500}}>{fmtNum(Math.round(idle))}h</div>
                    <div className="muted num" style={{fontSize: 11.5}}>{((idle/total)*100).toFixed(0)}% · perda estimada</div>
                  </div>
                  <div>
                    <div className="row" style={{gap: 6, marginBottom: 4}}>
                      <span className="dot" style={{background: "var(--text-4)"}}/>
                      <span className="muted" style={{fontSize: 11.5}}>Motor desligado</span>
                    </div>
                    <div className="num" style={{fontSize: 17, fontWeight: 500}}>{fmtNum(Math.round(off))}h</div>
                    <div className="muted num" style={{fontSize: 11.5}}>{((off/total)*100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="grid cols-2" style={{marginBottom: 16}}>
        <div className="card card-flush">
          <div className="card-header">
            <h3>Mais eficientes · consumo</h3>
            <span className="meta">km/l</span>
          </div>
          <table className="tbl">
            <thead><tr><th>#</th><th>Placa</th><th>Motorista</th><th style={{textAlign: "right"}}>Consumo</th><th>Tendência</th></tr></thead>
            <tbody>
              {mostEfficient.map((v, i) => (
                <tr key={v.plate} className="clickable" onClick={() => onGoToVehicle(v.plate)}>
                  <td className="muted num">{i + 1}</td>
                  <td><Plate value={v.plate}/></td>
                  <td className="muted">{v.driver}</td>
                  <td className="num" style={{textAlign: "right", color: "var(--ok)"}}>{v.fuel}</td>
                  <td><MiniBar values={[2.4, 2.6, 2.8, 2.9, n(v.fuel) - 0.1, n(v.fuel), n(v.fuel)]} accent/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-flush">
          <div className="card-header">
            <h3>Menos eficientes · consumo</h3>
            <span className="meta">km/l</span>
          </div>
          <table className="tbl">
            <thead><tr><th>#</th><th>Placa</th><th>Motorista</th><th style={{textAlign: "right"}}>Consumo</th><th>Tendência</th></tr></thead>
            <tbody>
              {leastEfficient.map((v, i) => (
                <tr key={v.plate} className="clickable" onClick={() => onGoToVehicle(v.plate)}>
                  <td className="muted num">{i + 1}</td>
                  <td><Plate value={v.plate}/></td>
                  <td className="muted">{v.driver}</td>
                  <td className="num" style={{textAlign: "right", color: "var(--crit)"}}>{v.fuel}</td>
                  <td><MiniBar values={[3.1, 2.9, 2.8, 2.6, 2.5, n(v.fuel) + 0.1, n(v.fuel)]}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-header">
          <h3>Desempenho por veículo · 7 dias</h3>
          <span className="meta">{fleet.length} veículos</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Motorista</th>
              <th style={{textAlign:"right"}}>Distância</th>
              <th style={{textAlign:"right"}}>Vel. média</th>
              <th style={{textAlign:"right"}}>Vel. máx</th>
              <th style={{textAlign:"right"}}>Consumo</th>
              <th style={{textAlign:"right"}}>Motor ligado</th>
              <th style={{textAlign:"right"}}>Em mov.</th>
              <th style={{textAlign:"right"}}>Parado lig.</th>
              <th style={{textAlign:"right"}}>Alertas</th>
            </tr>
          </thead>
          <tbody>
            {fleet.map(v => (
              <tr key={v.plate} className="clickable" onClick={() => onGoToVehicle(v.plate)}>
                <td><Plate value={v.plate}/></td>
                <td className="muted">{v.driver}</td>
                <td className="num" style={{textAlign:"right"}}>{fmtNum(v.distance7d)}</td>
                <td className="num" style={{textAlign:"right"}}>{v.avgSpeed}</td>
                <td className="num" style={{textAlign:"right", color: v.maxSpeed > 110 ? "var(--crit)" : "inherit"}}>{v.maxSpeed}</td>
                <td className="num" style={{textAlign:"right", color: v.fuel < 2.5 ? "var(--crit)" : v.fuel > 3.1 ? "var(--ok)" : "inherit"}}>{v.fuel}</td>
                <td className="num" style={{textAlign:"right"}}>{v.motorOnH}h</td>
                <td className="num" style={{textAlign:"right"}}>{(n(v.motorOnH) - n(v.idleH)).toFixed(1)}h</td>
                <td className="num" style={{textAlign:"right", color: v.idleH > 15 ? "var(--warn)" : "inherit"}}>{v.idleH}h</td>
                <td className="num" style={{textAlign:"right"}}>{v.alerts7d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
