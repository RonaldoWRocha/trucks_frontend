import * as React from "react";
import { EMPTY_DATA } from "../live-data";
import { Icon, Plate, StatusBadge } from "../components";

// Mapa da Frota - Norte Telemetria
export const MapScreen = ({ data, onGoToVehicle }) => {
  const D = data || EMPTY_DATA;
  const fleet = D.FLEET;
  const [selected, setSelected] = React.useState(fleet[2]?.plate || fleet[0]?.plate || "");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("online");
  const [ufFilter, setUfFilter] = React.useState("todos");
  const [mapReady, setMapReady] = React.useState(false);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const leafletRef = React.useRef(null);
  const markerLayerRef = React.useRef(null);
  const markersRef = React.useRef({});

  // initialize map
  React.useEffect(() => {
    if (mapInstance.current) return;

    let cancelled = false;
    let map = null;

    import("leaflet").then(({ default: L }) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      const m = L.map(mapRef.current, {
        center: [-15.5, -47.5],
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 18,
      }).addTo(m);

      map = m;
      leafletRef.current = L;
      mapInstance.current = m;
      markerLayerRef.current = L.layerGroup().addTo(m);
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapInstance.current = null;
      leafletRef.current = null;
      markerLayerRef.current = null;
      markersRef.current = {};      setMapReady(false);    };
  }, []);

  const ufs = ["todos", ...new Set(fleet.map(v => v.uf))];
  const filtered = fleet.filter(v => {
    if (statusFilter !== "todos" && v.status !== statusFilter) return false;
    if (ufFilter !== "todos" && v.uf !== ufFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!v.plate.toLowerCase().includes(q) && !v.driver.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sel = fleet.find(v => v.plate === selected);
  React.useEffect(() => {
    if (!fleet.some((v) => v.plate === selected)) {
      setSelected(fleet[0]?.plate || "");
    }
  }, [fleet, selected]);

  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstance.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer || !mapReady) return;

    layer.clearLayers();
    markersRef.current = {};

    const points = [];
    filtered.forEach(v => {
      const lat = Number(v.lat);
      const lng = Number(v.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const cls = v.status === "online" ? "ok" : v.status === "atrasado" ? "warn" : "crit";
      const html = `<div class="truck-marker ${cls}">
        ${v.status === "online" ? '<span class="pulse"></span>' : ""}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
        </svg>
      </div>`;
      const icon = L.divIcon({
        className: "truck-marker-wrap",
        html,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(layer);
      marker.on("click", () => setSelected(v.plate));
      markersRef.current[v.plate] = marker;
      points.push([lat, lng]);
    });

    if (points.length && !filtered.some((v) => v.plate === selected)) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6 });
    }
  }, [filtered, selected, mapReady]);

  React.useEffect(() => {
    const v = fleet.find(x => x.plate === selected);
    const lat = Number(v?.lat);
    const lng = Number(v?.lng);
    if (!v || !Number.isFinite(lat) || !Number.isFinite(lng) || !mapInstance.current) return;
    mapInstance.current.flyTo([lat, lng], Math.max(mapInstance.current.getZoom(), 7), { duration: 0.8 });
  }, [fleet, selected]);
  const lastEvent = sel ? D.ALERTS.find(a => a.veh === sel.plate) : null;

  return (
    <div className="map-layout">
      <div className="map-canvas">
        <div ref={mapRef} style={{ width: "100%", height: "100%" }}/>

        {/* Floating legend */}
        <div style={{
          position: "absolute", left: 16, top: 16, zIndex: 1000,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "8px 12px",
          boxShadow: "var(--shadow)",
          display: "flex", gap: 14, fontSize: 11.5, alignItems: "center",
        }}>
          <span style={{fontWeight: 500, color: "var(--text-2)"}}>Frota</span>
          <span style={{display: "flex", gap: 5, alignItems: "center"}}>
            <span className="dot ok"/> Online <b className="num">{fleet.filter(v=>v.status==="online").length}</b>
          </span>
          <span style={{display: "flex", gap: 5, alignItems: "center"}}>
            <span className="dot warn"/> Atrasado <b className="num">{fleet.filter(v=>v.status==="atrasado").length}</b>
          </span>
          <span style={{display: "flex", gap: 5, alignItems: "center"}}>
            <span className="dot crit"/> Sem comm <b className="num">{fleet.filter(v=>v.status==="sem-comm").length}</b>
          </span>
        </div>

        {/* In-map vehicle detail */}
        {sel && (
          <div className="map-detail">
            <div className="row between" style={{marginBottom: 4}}>
              <h4><Plate value={sel.plate} lg/></h4>
              <StatusBadge status={sel.status}/>
            </div>
            <div className="muted" style={{fontSize: 12, marginTop: 2}}>{sel.driver} · {sel.equip}</div>
            <div className="grid">
              <div><div className="k">Localização</div><div className="v" style={{fontSize: 12, fontFamily: "var(--font-sans)"}}>{sel.city} – {sel.uf}</div></div>
              <div><div className="k">Velocidade</div><div className="v">{sel.speed} km/h</div></div>
              <div><div className="k">Ignição</div><div className="v" style={{color: sel.ignition ? "var(--ok)" : "var(--text-3)"}}>{sel.ignition ? "Ligada" : "Desligada"}</div></div>
              <div><div className="k">Última mensagem</div><div className="v" style={{fontSize: 12}}>{D.timeAgo(sel.lastMessageMin)}</div></div>
            </div>
            <div style={{marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--divider)"}}>
              <div className="k" style={{fontSize: 11, color: "var(--text-3)"}}>Último evento</div>
              <div style={{fontSize: 12.5, marginTop: 2}}>{lastEvent ? lastEvent.label : "—"} <span className="muted num" style={{marginLeft: 6}}>{lastEvent && lastEvent.when}</span></div>
            </div>
            <button className="btn primary" style={{marginTop: 12, width: "100%", justifyContent: "center"}} onClick={() => onGoToVehicle(sel.plate)}>
              Abrir detalhe do veículo <Icon name="arrow-right" size={12}/>
            </button>
          </div>
        )}
      </div>

      <aside className="map-panel">
        <div className="map-panel-head">
          <div className="row between" style={{marginBottom: 10}}>
            <h2 style={{margin: 0, fontSize: 13, fontWeight: 600}}>Veículos</h2>
            <span className="muted num" style={{fontSize: 11.5}}>{filtered.length} / {fleet.length}</span>
          </div>
          <div className="topbar-search" style={{width: "100%"}}>
            <Icon name="search"/>
            <input
              placeholder="Buscar placa ou motorista"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="map-panel-filters">
          <button className={`tbl-filter ${statusFilter !== "todos" ? "active" : ""}`}
                  onClick={() => {
                    const opts = ["todos", "online", "atrasado", "sem-comm"];
                    setStatusFilter(opts[(opts.indexOf(statusFilter) + 1) % opts.length]);
                  }}>
            Status <span className="v">{statusFilter}</span>
            <Icon name="chevron-down" size={11}/>
          </button>
          <button className={`tbl-filter ${ufFilter !== "todos" ? "active" : ""}`}
                  onClick={() => {
                    const i = ufs.indexOf(ufFilter);
                    setUfFilter(ufs[(i + 1) % ufs.length]);
                  }}>
            UF <span className="v">{ufFilter}</span>
            <Icon name="chevron-down" size={11}/>
          </button>
        </div>
        <div className="map-panel-list">
          {filtered.map(v => (
            <div
              key={v.plate}
              className={`map-veh-row ${selected === v.plate ? "selected" : ""}`}
              onClick={() => setSelected(v.plate)}
            >
              <span className={`dot ${v.status === "online" ? "ok" : v.status === "atrasado" ? "warn" : "crit"}`}
                    style={{width: 8, height: 8}}/>
              <div className="meta">
                <div className="top">
                  <Plate value={v.plate}/>
                  <span className="muted num" style={{fontSize: 11, marginLeft: "auto"}}>{v.speed} km/h</span>
                </div>
                <div className="driver">{v.driver}</div>
                <div className="loc">{v.city}, {v.uf} · {D.timeAgo(v.lastMessageMin)}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{padding: 30, textAlign: "center"}} className="muted">Nenhum veículo encontrado.</div>
          )}
        </div>
      </aside>
    </div>
  );
};
