import * as React from "react";
import { apiJson } from "../live-data";
import { Icon, KPI, fmtNum } from "../components";

const TEMPLATE_COLUMNS = [
  ["name", "Nome completo"],
  ["cpf", "CPF"],
  ["rg", "RG"],
  ["birthDate", "Data nascimento"],
  ["phone", "Telefone"],
  ["email", "Email"],
  ["cnhNumber", "Numero CNH"],
  ["cnhCategory", "Categoria CNH"],
  ["cnhExpiresAt", "Validade CNH"],
  ["moppExpiresAt", "Validade MOPP"],
  ["admissionDate", "Data admissao"],
  ["contractType", "Tipo contrato"],
  ["registrationNumber", "Matricula"],
  ["status", "Status"],
  ["assignedVehiclePlate", "Placa vinculada"],
  ["base", "Base/filial"],
  ["address", "Endereco"],
  ["emergencyContactName", "Contato emergencia"],
  ["emergencyContactPhone", "Telefone emergencia"],
  ["notes", "Observacoes"],
];

const EMPTY_FORM = Object.fromEntries(TEMPLATE_COLUMNS.map(([key]) => [key, ""]));
const STATUS_OPTIONS = ["ativo", "inativo", "afastado", "ferias", "desligado"];

export const Drivers = ({ token }) => {
  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ ...EMPTY_FORM, status: "ativo" });
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setDrivers(await apiJson("/api/drivers", { token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar motoristas.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = drivers.filter((driver) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [driver.name, driver.cpf, driver.phone, driver.email, driver.cnhNumber, driver.assignedVehiclePlate, driver.base]
      .some((value) => String(value || "").toLowerCase().includes(q));
  });

  const expiring = drivers.filter((driver) => daysUntil(driver.cnhExpiresAt) <= 30 && daysUntil(driver.cnhExpiresAt) >= 0).length;
  const expired = drivers.filter((driver) => daysUntil(driver.cnhExpiresAt) < 0).length;

  const field = (key) => ({
    value: form[key] || "",
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  const editDriver = (driver) => {
    setEditing(driver);
    setMessage("");
    setError("");
    setForm({
      ...EMPTY_FORM,
      ...Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, formatInputValue(driver[key])])),
      status: driver.status || "ativo",
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, status: "ativo" });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editing) {
        await apiJson(`/api/drivers/${editing.id}`, { method: "PATCH", token, body: form });
        setMessage("Motorista atualizado.");
      } else {
        await apiJson("/api/drivers", { method: "POST", token, body: form });
        setMessage("Motorista cadastrado.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar motorista.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (driver) => {
    if (!window.confirm(`Excluir o cadastro de ${driver.name}?`)) return;
    setError("");
    setMessage("");
    try {
      await apiJson(`/api/drivers/${driver.id}`, { method: "DELETE", token });
      setMessage("Motorista excluido.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel excluir motorista.");
    }
  };

  const downloadTemplate = () => {
    const header = TEMPLATE_COLUMNS.map(([, label]) => label).join(";");
    const sample = [
      "Joao da Silva",
      "12345678901",
      "1234567",
      "1985-04-20",
      "(11) 99999-9999",
      "joao@email.com",
      "12345678900",
      "E",
      "2028-12-31",
      "2027-12-31",
      "2024-01-15",
      "CLT",
      "MOT-001",
      "ativo",
      "ABC1D23",
      "Matriz",
      "Rua Exemplo, 100",
      "Maria da Silva",
      "(11) 98888-8888",
      "Motorista carreteiro",
    ].map(csvCell).join(";");
    downloadFile("modelo_motoristas.csv", `\uFEFF${header}\r\n${sample}\r\n`);
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const result = await apiJson("/api/drivers/import", { method: "POST", token, body: { rows } });
      const failed = result.errors?.length ? ` ${result.errors.length} linha(s) com erro.` : "";
      setMessage(`Importacao concluida: ${result.inserted} novo(s), ${result.updated} atualizado(s).${failed}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel importar a planilha.");
    }
  };

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1>Motoristas</h1>
          <div className="sub">{drivers.length} cadastros · CNH vencida: {expired} · vence em 30 dias: {expiring}</div>
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={downloadTemplate}><Icon name="download"/>Download modelo</button>
          <button className="btn" type="button" onClick={() => fileInputRef.current?.click()}><Icon name="upload"/>Importar planilha</button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={importCsv} style={{display: "none"}}/>
        </div>
      </div>

      <div className="grid cols-4" style={{marginBottom: 16}}>
        <KPI label="Motoristas ativos" icon="user" value={fmtNum(drivers.filter((d) => d.status === "ativo").length)}/>
        <KPI label="CNH vencida" icon="alert" value={fmtNum(expired)}/>
        <KPI label="CNH a vencer" icon="clock" value={fmtNum(expiring)} sub="proximos 30 dias"/>
        <KPI label="Com veiculo vinculado" icon="truck" value={fmtNum(drivers.filter((d) => d.assignedVehiclePlate).length)}/>
      </div>

      {(error || message) && (
        <div className={error ? "form-error" : "form-success"} style={{marginBottom: 12}}>
          {error || message}
        </div>
      )}

      <div className="grid cols-2-1" style={{alignItems: "start"}}>
        <div className="tbl-wrap">
          <div className="tbl-toolbar">
            <div className="search">
              <Icon name="search"/>
              <input placeholder="Buscar por nome, CPF, CNH, placa ou base..." value={search} onChange={(event) => setSearch(event.target.value)}/>
            </div>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>CNH</th>
                <th>Validade</th>
                <th>Status</th>
                <th>Base</th>
                <th style={{textAlign: "right"}}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((driver) => (
                <tr key={driver.id}>
                  <td>{driver.name}</td>
                  <td className="num muted">{formatCpf(driver.cpf)}</td>
                  <td className="muted">{driver.phone || "-"}</td>
                  <td className="num muted">{driver.cnhNumber || "-"} {driver.cnhCategory && `· ${driver.cnhCategory}`}</td>
                  <td className={daysUntil(driver.cnhExpiresAt) < 0 ? "num" : "num muted"} style={{color: daysUntil(driver.cnhExpiresAt) < 0 ? "var(--crit)" : undefined}}>
                    {formatDate(driver.cnhExpiresAt)}
                  </td>
                  <td><span className={`badge ${driver.status === "ativo" ? "ok" : "warn"}`}><span className="dot"/>{driver.status}</span></td>
                  <td className="muted">{driver.base || "-"}</td>
                  <td style={{textAlign: "right"}}>
                    <button className="btn ghost sm" type="button" onClick={() => editDriver(driver)}>Editar</button>
                    <button className="btn ghost sm danger" type="button" onClick={() => remove(driver)}>Excluir</button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="muted" style={{textAlign: "center", padding: 36}}>Nenhum motorista encontrado.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={8} className="muted" style={{textAlign: "center", padding: 36}}>Carregando motoristas...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="card driver-form" onSubmit={submit}>
          <div className="section-head">
            <h2>{editing ? "Editar motorista" : "Novo motorista"}</h2>
            {editing && <button className="btn ghost sm" type="button" onClick={resetForm}>Novo</button>}
          </div>
          <label className="form-field">Nome completo<input {...field("name")} required/></label>
          <div className="form-grid-2">
            <label className="form-field">CPF<input {...field("cpf")} inputMode="numeric"/></label>
            <label className="form-field">RG<input {...field("rg")}/></label>
          </div>
          <div className="form-grid-2">
            <label className="form-field">Nascimento<input type="date" {...field("birthDate")}/></label>
            <label className="form-field">Telefone<input {...field("phone")}/></label>
          </div>
          <label className="form-field">Email<input type="email" {...field("email")}/></label>
          <div className="form-grid-2">
            <label className="form-field">Numero CNH<input {...field("cnhNumber")}/></label>
            <label className="form-field">Categoria<input {...field("cnhCategory")} placeholder="B, C, D, E"/></label>
          </div>
          <div className="form-grid-2">
            <label className="form-field">Validade CNH<input type="date" {...field("cnhExpiresAt")}/></label>
            <label className="form-field">Validade MOPP<input type="date" {...field("moppExpiresAt")}/></label>
          </div>
          <div className="form-grid-2">
            <label className="form-field">Admissao<input type="date" {...field("admissionDate")}/></label>
            <label className="form-field">Status<select {...field("status")}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          </div>
          <div className="form-grid-2">
            <label className="form-field">Tipo contrato<input {...field("contractType")} placeholder="CLT, PJ, agregado"/></label>
            <label className="form-field">Matricula<input {...field("registrationNumber")}/></label>
          </div>
          <div className="form-grid-2">
            <label className="form-field">Placa vinculada<input {...field("assignedVehiclePlate")}/></label>
            <label className="form-field">Base/filial<input {...field("base")}/></label>
          </div>
          <label className="form-field">Endereco<input {...field("address")}/></label>
          <div className="form-grid-2">
            <label className="form-field">Contato emergencia<input {...field("emergencyContactName")}/></label>
            <label className="form-field">Telefone emergencia<input {...field("emergencyContactPhone")}/></label>
          </div>
          <label className="form-field">Observacoes<textarea {...field("notes")} rows={3}/></label>
          <button className="btn primary" type="submit" disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar alteracoes" : "Cadastrar motorista"}</button>
        </form>
      </div>
    </div>
  );
};

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((value) => normalizeHeader(value));
  const mappedHeaders = headers.map((header) => {
    const found = TEMPLATE_COLUMNS.find(([key, label]) => normalizeHeader(label) === header || normalizeHeader(key) === header);
    return found?.[0] || header;
  });
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return Object.fromEntries(mappedHeaders.map((key, index) => [key, values[index] || ""]));
  }).filter((row) => row.name);
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function formatInputValue(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value).slice(0, 10);
  const [year, month, day] = text.split("-");
  return year && month && day ? `${day}/${month}/${year}` : text;
}

function daysUntil(value) {
  if (!value) return Infinity;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return Infinity;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 11) return value || "-";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
