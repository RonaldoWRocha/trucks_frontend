import { EMPTY_DATA } from "../live-data";
import { Hint, Icon, KPI, Plate, fmtNum } from "../components";

// Saude da Integracao - Norte Telemetria
export const Integration = ({ data }) => {
  const D = data || EMPTY_DATA;

  const statusBadge = (s) => {
    if (s === "ok") return <span className="badge ok"><span className="dot"/>Sucesso</span>;
    if (s === "warn") return <span className="badge warn"><span className="dot"/>Atenção</span>;
    if (s === "err") return <span className="badge crit"><span className="dot"/>Erro</span>;
    return <span className="badge">Pendente</span>;
  };

  const totalRead = D.JOBS.reduce((s, j) => s + j.read, 0);
  const totalIns = D.JOBS.reduce((s, j) => s + j.inserted, 0);
  const totalErr = D.JOBS.reduce((s, j) => s + j.errors, 0);
  const totalQueue = D.QUEUE.reduce((s, item) => s + item.count, 0);
  const successRate = totalRead > 0 ? (totalIns / totalRead) * 100 : 0;

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Saúde da integração</h1>
          <div className="sub">Sincronização Trucks → PostgreSQL · ambiente <span className="num">prod</span></div>
        </div>
      </div>

      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Status geral" icon="plug" value="Operacional"
             sub="1 job com timeout"
             hint="Resumo operacional dos jobs de integração configurados para o cliente."/>
        <KPI label="Registros lidos · última execução" icon="chart" value={fmtNum(totalRead)}
             hint="Soma de inseridos e ignorados reportada na última execução registrada de cada job."/>
        <KPI label="Registros inseridos" icon="check" value={fmtNum(totalIns)}
             sub={`${successRate.toFixed(1)}% taxa de sucesso`}
             hint="Quantidade de registros novos gravados na última execução dos jobs. Taxa = inseridos / lidos."/>
        <KPI label="Erros registrados" icon="alert" value={totalErr}
             sub={`DLQ: ${D.PAYLOAD_ERRORS.length} itens`}
             hint="Jobs com erro na última execução e payloads registrados na fila de erro."/>
      </div>

      <div className="card card-flush" style={{marginBottom: 16}}>
        <div className="card-header">
          <h3>Jobs de sincronização <Hint text="Lista das rotinas que buscam payloads na Trucks e importam para o banco do cliente."/></h3>
          <span className="meta">4 jobs · scheduler ativo</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Última execução</th>
              <th>Periodicidade</th>
              <th style={{textAlign: "right"}}>Lidos</th>
              <th style={{textAlign: "right"}}>Inseridos</th>
              <th style={{textAlign: "right"}}>Ignorados</th>
              <th style={{textAlign: "right"}}>Erros</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {D.JOBS.map(j => (
              <tr key={j.id}>
                <td className="num" style={{fontWeight: 500}}>{j.label}</td>
                <td>{statusBadge(j.status)}</td>
                <td className="muted num">{j.lastRun}</td>
                <td className="muted">{j.schedule}</td>
                <td className="num" style={{textAlign: "right"}}>{fmtNum(j.read)}</td>
                <td className="num" style={{textAlign: "right"}}>{fmtNum(j.inserted)}</td>
                <td className="num" style={{textAlign: "right"}}>{fmtNum(j.ignored)}</td>
                <td className="num" style={{textAlign: "right", color: j.errors > 0 ? "var(--crit)" : "inherit"}}>{j.errors}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid cols-2-1" style={{marginBottom: 16}}>
        <div className="card card-flush">
          <div className="card-header">
            <h3>Payloads em erro · DLQ <Hint text="Payloads que falharam no parse ou importação e precisam de revisão."/></h3>
            <div className="row" style={{gap: 6}}>
              <span className="meta">{D.PAYLOAD_ERRORS.length} itens</span>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Veículo</th>
                <th>Quando</th>
                <th>Código</th>
                <th>Mensagem</th>
                <th style={{width: 90}}></th>
              </tr>
            </thead>
            <tbody>
              {D.PAYLOAD_ERRORS.map(p => (
                <tr key={p.id} className="row-crit">
                  <td className="num">{p.id}</td>
                  <td className="num muted">{p.job}</td>
                  <td>{p.veh === "—" ? <span className="dim">—</span> : <Plate value={p.veh}/>}</td>
                  <td className="muted num">{p.when}</td>
                  <td><span className="badge crit">{p.code}</span></td>
                  <td className="num" style={{fontSize: 11.5}}>{p.msg}</td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="col" style={{gap: 16}}>
          <div className="card">
            <div className="section-head"><h2>Pendentes na fila <Hint text="Itens nas tabelas temporárias aguardando processamento, agrupados por job e status."/></h2></div>
            <div className="row between" style={{marginBottom: 10}}>
              <span style={{fontSize: 24, fontWeight: 500}} className="num">{fmtNum(totalQueue)}</span>
              <span className="muted" style={{fontSize: 12}}>itens aguardando processamento</span>
            </div>
            <div className="col" style={{gap: 6, fontSize: 12}}>
              {D.QUEUE.map((item) => (
                <div className="row between" key={`${item.job}-${item.status}`}>
                  <span className="muted">{item.job} · {item.status}</span>
                  <b className="num">{fmtNum(item.count)}</b>
                </div>
              ))}
              {D.QUEUE.length === 0 && <div className="muted">Fila vazia</div>}
            </div>
          </div>

          <div className="card">
            <div className="section-head"><h2>Taxa de sucesso · última execução <Hint text="Percentual de registros inseridos sobre registros lidos na última execução dos jobs."/></h2></div>
            <div className="row" style={{gap: 14, alignItems: "center"}}>
              <div className="donut" style={{["--p"]: successRate, ["--c"]: "var(--ok)", ["--size"]: "76px", ["--thick"]: "9px"}}>
                <div className="donut-val" style={{fontSize: 13}}>{successRate.toFixed(1)}%</div>
              </div>
              <div className="col" style={{gap: 4, fontSize: 12, flex: 1}}>
                <div className="row between"><span className="muted">Inseridos</span><b className="num">{fmtNum(totalIns)}</b></div>
                <div className="row between"><span className="muted">Ignorados</span><b className="num">{fmtNum(totalRead - totalIns - totalErr)}</b></div>
                <div className="row between"><span className="muted">Erros</span><b className="num" style={{color: "var(--crit)"}}>{totalErr}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-head">
          <h2>Log recente da integração</h2>
          <span className="muted num" style={{fontSize: 11.5}}>stream · ambiente prod</span>
        </div>
        <div className="log">
          {D.RECENT_LOG.map((l, i) => (
            <div key={i}>
              <span className="ts">[{l.ts}]</span>{" "}
              <span className={l.lvl === "ok" ? "ok" : l.lvl === "err" ? "err" : ""}>
                {l.lvl.toUpperCase()}
              </span>{" "}
              <span>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
