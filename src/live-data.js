"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export { API_BASE };

export const EMPTY_DATA = {
  FLEET: [],
  ALERTS: [],
  JOBS: [],
  QUEUE: [],
  PAYLOAD_ERRORS: [],
  RECENT_LOG: [],
  ALERT_STATS: { total24h: 0, critical24h: 0 },
  TOP_EVENT_TYPES: [],
  DAILY: [],
  REPORT_SUMMARY: {},
  timeAgo,
  isoMinAgo,
  getVehicle: () => null,
  vehicleTimeline: () => [],
  vehicleRoute: () => [],
};

export function useTelemetryData(token, clientId, refreshKey = 0) {
  const [state, setState] = useState({
    data: EMPTY_DATA,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setState({ data: EMPTY_DATA, loading: false, error: null });
        return;
      }
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const [vehicles, alerts, dashboard, integration, reportSummary] = await Promise.all([
          getJson("/api/vehicles?limit=500", token),
          getJson("/api/alerts?period=30d&limit=5000", token),
          getJson("/api/dashboard", token),
          getJson("/api/integration", token),
          getJson("/api/reports/summary", token),
        ]);

        if (cancelled) return;
        setState({
          data: buildData({ vehicles, alerts, dashboard, integration, reportSummary }),
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          data: EMPTY_DATA,
          loading: false,
          error: error instanceof Error ? error.message : "Falha ao carregar API",
        });
      }
    }

    load();
    const id = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token, clientId, refreshKey]);

  return useMemo(() => state, [state]);
}

export async function apiJson(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, {
    cache: "no-store",
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    let message = `${path}: HTTP ${response.status}`;
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch (e) {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch (err) {}
    }
    throw new Error(message);
  }
  return response.json();
}

async function getJson(path, token) {
  return apiJson(path, { token });
}

function buildData({ vehicles, alerts, dashboard, integration, reportSummary }) {
  const fleet = vehicles.map(mapVehicle);
  const mappedAlerts = alerts.map(mapAlert);
  const jobs = (integration.jobs || []).map(mapJob);
  const queue = (integration.queue || []).map(mapQueueItem);
  const payloadErrors = (integration.errors || []).map(mapPayloadError);
  const daily = mapDaily(dashboard.daily, dashboard.generatedAt);
  const topEventTypes = (dashboard.topEventTypes || []).map((item) => ({
    label: item.label,
    count: Number(item.count || 0),
    sev: item.sev || "info",
  }));
  const alertStats = dashboard.alerts || {};
  const total24h = Number(alertStats.total24h ?? alertStats.total_24h ?? 0);
  const critical24h = Number(alertStats.critical24h ?? alertStats.critical_24h ?? 0);

  const data = {
    FLEET: fleet,
    ALERTS: mappedAlerts,
    JOBS: jobs,
    QUEUE: queue,
    PAYLOAD_ERRORS: payloadErrors,
    RECENT_LOG: buildRecentLog(integration),
    ALERT_STATS: {
      total24h,
      critical24h,
    },
    TOP_EVENT_TYPES: topEventTypes,
    DAILY: daily,
    REPORT_SUMMARY: reportSummary,
    timeAgo,
    isoMinAgo,
  };

  data.FLEET = fleet;
  data.getVehicle = (plate) => data.FLEET.find((v) => v.plate === plate || v.id === plate) || null;
  data.vehicleTimeline = (plate) => {
    const fromAlerts = data.ALERTS.filter((a) => a.veh === plate).slice(0, 8);
    return fromAlerts;
  };
  data.vehicleRoute = (plate) => {
    const v = data.getVehicle(plate);
    if (!Number.isFinite(v?.lat) || !Number.isFinite(v?.lng)) return [];
    return [[v.lat, v.lng]];
  };

  return data;
}

function mapVehicle(v) {
  const lastMessageMin = Number(v.lastMessageMin ?? 9999);
  return {
    id: String(v.id ?? v.veiculoId),
    plate: String(v.plate || v.id),
    driver: v.driver || "Sem motorista",
    chassis: v.chassis || "-",
    equip: v.equip || "Nao informado",
    status: String(v.status || deriveStatusFromMessageMin(lastMessageMin)),
    ignition: parseBool(v.ignition, Number(v.speed || 0) > 0 || Number(v.rpm || 0) > 0),
    speed: Number(v.speed || 0),
    rpm: Number(v.rpm || 0),
    lat: finiteNumber(v.lat),
    lng: finiteNumber(v.lng),
    city: v.city || "Sem posicao",
    uf: v.uf || "--",
    lastMessageMin,
    odometer: Number(v.odometer || 0),
    fuel: Number(v.fuel || 0),
    avgSpeed: Number(v.avgSpeed || 0),
    maxSpeed: Number(v.maxSpeed || 0),
    distance7d: Number(v.distance7d || 0),
    motorOnH: round(Number(v.motorOnH || 0), 1),
    motorOffH: round(Number(v.motorOffH || 0), 1),
    idleH: round(Number(v.idleH || 0), 1),
    alerts7d: Number(v.alerts7d || 0),
  };
}

function deriveStatusFromMessageMin(lastMessageMin) {
  if (!Number.isFinite(lastMessageMin) || lastMessageMin === null) return "sem-comm";
  if (lastMessageMin > 90) return "sem-comm";
  if (lastMessageMin > 10) return "atrasado";
  return "online";
}

function mapAlert(alert) {
  const minAgo = Number(alert.minAgo ?? 0);
  return {
    id: String(alert.id),
    type: String(alert.label || "evento").toLowerCase(),
    label: alert.label || "Evento",
    sev: alert.sev || alert.severity || "info",
    veh: alert.veh || alert.plate || "-",
    driver: alert.driver || "Sem motorista",
    location: alert.location || "",
    speed: alert.speed,
    rpm: alert.rpm,
    minAgo,
    when: formatWhen(alert.whenAt || alert.when),
  };
}

function mapJob(job) {
  const status = job.status === "success" ? "ok" : job.status === "error" ? "err" : "warn";
  return {
    id: job.id,
    label: job.label,
    requestType: job.requestType,
    lastRun: job.lastSuccessAt ? timeAgo(new Date(job.lastSuccessAt)) : "sem execucao",
    status,
    rawStatus: job.status || "pending",
    read: Number(job.inserted || 0) + Number(job.ignored || 0),
    inserted: Number(job.inserted || 0),
    ignored: Number(job.ignored || 0),
    errors: job.status === "error" ? 1 : 0,
    schedule: `a cada ${Math.round(Number(job.intervalSeconds || 0) / 60) || 1} min`,
    nextRunAt: job.nextRunAt,
  };
}

function mapQueueItem(item) {
  return {
    job: item.job || "-",
    status: item.status || "-",
    count: Number(item.count || 0),
  };
}

function mapPayloadError(error) {
  return {
    id: `E-${error.id}`,
    job: error.jobName || "-",
    veh: "-",
    when: formatWhen(error.occurredAt),
    code: error.stage || "ERROR",
    msg: error.errorMessage || "Erro registrado na integracao",
  };
}

function mapDaily(rows, generatedAt) {
  const byDate = new Map(
    (Array.isArray(rows) ? rows : [])
      .filter((row) => row.date)
      .map((row) => [
        String(row.date).slice(0, 10),
        {
          day: String(row.day || "").trim() || "-",
          km: Number(row.km || 0),
          alerts: 0,
          fuel: Number(row.fuel || 0),
        },
      ]),
  );
  const reference = new Date(generatedAt || Date.now());
  if (Number.isNaN(reference.getTime())) return [];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(reference);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
    ].join("-");
    const existing = byDate.get(key);
    if (existing) return existing;
    return {
      day: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      km: 0,
      alerts: 0,
      fuel: 0,
    };
  });
}

function buildRecentLog(integration) {
  const errors = (integration.errors || []).slice(0, 5).map((error) => ({
    ts: formatTime(error.occurredAt),
    lvl: "err",
    msg: `${error.jobName || "integracao"}: ${error.errorMessage || error.stage}`,
  }));
  const jobs = (integration.jobs || []).slice(0, 5).map((job) => ({
    ts: formatTime(job.lastSuccessAt || job.lastErrorAt),
    lvl: job.status === "error" ? "err" : "ok",
    msg: `${job.label}: ${job.status || "pendente"}`,
  }));
  return [...errors, ...jobs].filter((item) => item.ts !== "--:--");
}

function formatWhen(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function timeAgo(value) {
  const min =
    value instanceof Date
      ? Math.max(0, Math.round((Date.now() - value.getTime()) / 60000))
      : Math.max(0, Math.round(Number(value || 0)));
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  return `${Math.floor(min / 1440)}d`;
}

function isoMinAgo(min) {
  return new Date(Date.now() - Math.max(0, Number(min || 0)) * 60000).toISOString();
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function round(value, digits = 0) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function parseBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "s", "ligada", "ligado", "on"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "n", "desligada", "desligado", "off"].includes(normalized)) return false;
  }
  return fallback;
}
