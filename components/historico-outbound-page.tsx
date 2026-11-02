"use client";

// AI maintenance map: shared historical UI for LH Outbound and LH Inbound.
// The variant prop selects the domain; server mappings stay in lib/historico-*.ts.
import { useEffect, useMemo, useState } from "react";
import DatePeriodPicker, { todayIsoDate } from "@/components/date-period-picker";
import PageActions from "@/components/page-actions";
import type { HistoricoOutboundData, HistoricoOutboundRow } from "@/lib/historico-outbound";

type Filters = {
  startDate: string;
  endDate: string;
  turno: string;
  destino: string;
  fluxo: string;
  query: string;
};

const OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);
const TURNOS = ["T1", "T2", "T3"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value || 0));
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value || 0);
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalize(value: string) {
  return String(value ?? "").trim().toUpperCase();
}

function dayLabel(value: string) {
  const [year, month, day] = String(value || "").split("-");
  if (!year || !month || !day) return value || "-";
  return `${day}/${month}/${year.slice(-2)}`;
}

function buildDefaultFilters(availableDates?: string[]): Filters {
  const lastDate = availableDates && availableDates.length > 0 ? availableDates[availableDates.length - 1] : todayIsoDate();
  const firstDate = availableDates && availableDates.length > 0 ? availableDates[0] : lastDate;

  return {
    startDate: firstDate,
    endDate: lastDate,
    turno: "",
    destino: "",
    fluxo: "",
    query: ""
  };
}

function filterRows(
  rows: HistoricoOutboundRow[],
  filters: Filters,
  dateReference: "dataExpedicao" | "dataOperacional" = "dataExpedicao"
) {
  const query = normalize(filters.query);
  return rows.filter((row) => {
    const referenceDate = dateReference === "dataOperacional" ? row.dataOperacional || row.dataExpedicao : row.dataExpedicao;
    const queryOk =
      !query ||
      [row.tripNumber, row.destino, row.origin, row.vehicleNumber, row.usedVehicle, row.statusAgrupado, row.solicitationBy].some((field) =>
        normalize(field).includes(query)
      );

    return (
      queryOk &&
      (!filters.startDate || referenceDate >= filters.startDate) &&
      (!filters.endDate || referenceDate <= filters.endDate) &&
      (!filters.turno || row.turno === filters.turno) &&
      (!filters.destino || row.destino === filters.destino) &&
      (!filters.fluxo || row.statusAgrupado === filters.fluxo)
    );
  });
}

function uniqueCount(rows: HistoricoOutboundRow[], getter: (row: HistoricoOutboundRow) => string) {
  return new Set(rows.map(getter).filter((value) => value && value !== "-")).size;
}

function sum(rows: HistoricoOutboundRow[], getter: (row: HistoricoOutboundRow) => number) {
  return rows.reduce((total, row) => total + (getter(row) || 0), 0);
}

function average(rows: HistoricoOutboundRow[], getter: (row: HistoricoOutboundRow) => number) {
  const values = rows.map(getter).filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function byTurno<T>(rows: HistoricoOutboundRow[], getter: (rows: HistoricoOutboundRow[]) => T) {
  return {
    geral: getter(rows),
    T1: getter(rows.filter((row) => row.turno === "T1")),
    T2: getter(rows.filter((row) => row.turno === "T2")),
    T3: getter(rows.filter((row) => row.turno === "T3"))
  };
}

function hourSeries(rows: HistoricoOutboundRow[]) {
  return OPERATION_HOURS.map((hour) => {
    const hourRows = rows.filter((row) => row.horaExpedicao === hour);
    return {
      label: String(hour).padStart(2, "0"),
      qtd: uniqueCount(hourRows, (row) => row.tripNumber)
    };
  });
}

function sacaCluster(rows: HistoricoOutboundRow[]) {
  const bands = [
    { label: "Sem Sacas", test: (row: HistoricoOutboundRow) => row.toSaca <= 0 },
    { label: "Ate 50 Sacas", test: (row: HistoricoOutboundRow) => row.toSaca > 0 && row.toSaca <= 50 },
    { label: "Entre 50 e 100 Sacas", test: (row: HistoricoOutboundRow) => row.toSaca > 50 && row.toSaca <= 100 },
    { label: "Entre 100 e 200 Sacas", test: (row: HistoricoOutboundRow) => row.toSaca > 100 && row.toSaca <= 200 },
    { label: "Mais que 200 Sacas", test: (row: HistoricoOutboundRow) => row.toSaca > 200 }
  ];

  return bands.map((band) => ({
    label: band.label,
    qtd: uniqueCount(rows.filter(band.test), (row) => row.tripNumber)
  }));
}

function activeFilters(filters: Filters) {
  return Object.values(filters).filter(Boolean).length;
}

function downloadCsv(rows: HistoricoOutboundRow[]) {
  const headers = ["trip_number", "destino", "turno", "fluxo", "total_orders", "to_total", "unseal_datetime", "unloaded_datetime"];
  const body = rows.map((row) =>
    [row.tripNumber, row.destino, row.turno, row.statusAgrupado, row.totalOrders, row.toTotal, row.unsealDatetime, row.unloadedDatetime]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob([[headers.join(";"), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "historico-expedicao.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function browserCacheKey(variant: "outbound" | "inbound") {
  const version = variant === "inbound" ? "v14" : "v3";
  return `one-page:${variant}:historico:${version}`;
}

const HISTORICO_BROWSER_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type HistoricoBrowserCache =
  | HistoricoOutboundData
  | {
      cachedAt: number;
      data: HistoricoOutboundData;
    };

function unwrapBrowserCache(payload: HistoricoBrowserCache): HistoricoOutboundData | null {
  if ("cachedAt" in payload && "data" in payload) {
    if (Date.now() - payload.cachedAt > HISTORICO_BROWSER_CACHE_TTL_MS) return null;
    return payload.data;
  }

  return payload;
}

function readBrowserCache(key: string): HistoricoOutboundData | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.sessionStorage.getItem(key);
    return cached ? unwrapBrowserCache(JSON.parse(cached) as HistoricoBrowserCache) : null;
  } catch {
    return null;
  }
}

function writeBrowserCache(key: string, data: HistoricoOutboundData) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Sem espaço ou bloqueio do navegador: a página continua funcionando sem cache local.
  }
}

function IconBox() {
  return (
    <span className="hist-out-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 7h10v9H4zM14 10h3.5l2.5 3v3h-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="hist-out-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="hist-out-mini-card" title={`${label}: ${value}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
      <i>◴</i>
    </article>
  );
}

function TimePanel({
  fila,
  doca,
  variant = "outbound"
}: {
  fila: Record<string, number>;
  doca: Record<string, number>;
  variant?: "outbound" | "inbound";
}) {
  const stages = [
    { label: "Tempo em fila", values: fila, hint: variant === "inbound" ? "Chegada no destino ate unseal" : "Chegada ate unseal" },
    { label: "Tempo em doca", values: doca, hint: variant === "inbound" ? "Media do tempo de descarga" : "Unseal ate expedicao" }
  ];

  return (
    <section className="hist-out-panel hist-out-time-panel">
      <div className="hist-out-section-title">
        <span>Media</span>
        <h3>Tempos operacionais</h3>
      </div>
      <div className="hist-out-time-clean">
        {stages.map((stage) => (
          <article key={stage.label}>
            <div className="hist-out-time-copy">
              <strong>{stage.label}</strong>
              <span>{stage.hint}</span>
            </div>
            <div className="hist-out-time-values">
              {["geral", "T1", "T2", "T3"].map((key) => (
                <p key={key}>
                  <b>{key === "geral" ? "Total" : key}</b>
                  <em>{formatDuration(stage.values[key] ?? 0)}</em>
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HourBarChart({ rows, variant = "outbound" }: { rows: { label: string; qtd: number }[]; variant?: "outbound" | "inbound" }) {
  const max = Math.max(...rows.map((row) => row.qtd), 1);
  const title = variant === "inbound" ? "LHS recebidos por hora" : "LHS expedidos por hora";
  const eyebrow = variant === "inbound" ? "Recebimento" : "Expedicao";

  return (
    <section className="hist-out-panel hist-out-hour-card hist-out-hour-wide">
      <div className="hist-out-section-title">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      <div className="hist-out-hour-chart" role="img" aria-label={title}>
        {rows.map((row) => (
          <div className="hist-out-hour-item" key={row.label} tabIndex={0} title={`${row.label}h: ${formatNumber(row.qtd)} LHS`}>
            <div className="hist-out-hour-plot">
              <span>{row.qtd > 0 ? formatNumber(row.qtd) : ""}</span>
              <i style={{ height: `${Math.max(6, (row.qtd / max) * 100)}%` }} />
            </div>
            <div className="hist-chart-tooltip" role="tooltip">
              <div><span>Hora</span><b>{row.label}h</b></div>
              <div><span>LHS</span><b>{formatNumber(row.qtd)}</b></div>
            </div>
            <b>{row.label}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClusterTable({ rows }: { rows: { label: string; qtd: number }[] }) {
  return (
    <section className="hist-out-panel hist-out-cluster-table">
      <div className="hist-out-section-title">
        <span>Sacas</span>
        <h3>Cluster</h3>
      </div>
      <div className="hist-out-table-like">
        <div>
          <span>Faixa</span>
          <span>LHS</span>
        </div>
        {rows.map((row) => (
          <div key={row.label} tabIndex={0} title={`${row.label}: ${formatNumber(row.qtd)} LHS`}>
            <strong>{row.label}</strong>
            <b>{formatNumber(row.qtd)}</b>
            <div className="hist-chart-tooltip" role="tooltip">
              <div><span>Faixa</span><b>{row.label}</b></div>
              <div><span>LHS</span><b>{formatNumber(row.qtd)}</b></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SppPanel({ sppScuttle, sppSaca }: { sppScuttle: number; sppSaca: number }) {
  return (
    <section className="hist-out-panel">
      <div className="hist-out-section-title">
        <span>Pacotes por TO</span>
        <h3>Acompanhamento de SPP</h3>
      </div>
      <div className="hist-out-spp-grid">
        <div tabIndex={0} title={`SPP Scuttle: ${formatDecimal(sppScuttle)}`}>
          <span>SPP Scuttle</span>
          <strong>{formatDecimal(sppScuttle)}</strong>
          <div className="hist-chart-tooltip" role="tooltip">
            <div><span>Indicador</span><b>SPP Scuttle</b></div>
            <div><span>Valor</span><b>{formatDecimal(sppScuttle)}</b></div>
          </div>
        </div>
        <div tabIndex={0} title={`SPP Saca: ${formatDecimal(sppSaca)}`}>
          <span>SPP Saca</span>
          <strong>{formatDecimal(sppSaca)}</strong>
          <div className="hist-chart-tooltip" role="tooltip">
            <div><span>Indicador</span><b>SPP Saca</b></div>
            <div><span>Valor</span><b>{formatDecimal(sppSaca)}</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AberturaPanel({ rows, variant = "outbound" }: { rows: HistoricoOutboundRow[]; variant?: "outbound" | "inbound" }) {
  const metric = (label: string, tos: (row: HistoricoOutboundRow) => number, pcts?: (row: HistoricoOutboundRow) => number) => (
    <article key={label} tabIndex={0} title={`${label}: ${formatNumber(sum(rows, tos))} TOs${pcts ? ` | ${formatNumber(sum(rows, pcts))} Pcts` : ""}`}>
      <small>{label}</small>
      <strong>{formatNumber(sum(rows, tos))}</strong>
      {pcts && <span>{formatNumber(sum(rows, pcts))} pcts</span>}
      <div className="hist-chart-tooltip" role="tooltip">
        <div><span>Grupo</span><b>{label}</b></div>
        <div><span>TOs</span><b>{formatNumber(sum(rows, tos))}</b></div>
        {pcts && <div><span>Pcts</span><b>{formatNumber(sum(rows, pcts))}</b></div>}
      </div>
    </article>
  );

  return (
    <section className="hist-out-panel hist-out-abertura-panel">
      <div className="hist-out-section-title">
        <span>{variant === "inbound" ? "Historico Inbound" : "Historico Expedicao"}</span>
        <h3>Abertura por pacotes e fluxo</h3>
      </div>
      <div className="hist-out-abertura-grid">
        <div className="hist-out-abertura-block total">
          <span>Geral</span>
          <div>
            {metric("Sacas", (row) => row.contagemTosSacas, (row) => row.contagemIdsSacas)}
            {metric("Scuttle/Pallet", (row) => row.contagemTosScuttleOrPallet, (row) => row.contagemIdsScuttleOrPallets)}
          </div>
        </div>
        <div className="hist-out-abertura-block nao">
          <span>Nao Transbordo</span>
          <div>
            {metric("Sacas", (row) => row.contagemTosSacasNaoTransbordo, (row) => row.contagemIdsSacasNaoTransbordo)}
            {metric("Scuttle/Pallet", (row) => row.contagemTosScuttleOrPalletNaoTransbordo, (row) => row.contagemIdsScuttleOrPalletsNaoTransbordo)}
          </div>
        </div>
        <div className="hist-out-abertura-block transbordo">
          <span>Transbordo</span>
          <div>
            {metric("Sacas", (row) => row.contagemTosSacasTransbordo, (row) => row.contagemIdsSacasTransbordo)}
            {metric("Scuttle/Pallet", (row) => row.contagemTosScuttleOrPalletTransbordo, (row) => row.contagemIdsScuttleOrPalletsTransbordo)}
          </div>
        </div>
        {variant !== "inbound" && (
          <div className="hist-out-abertura-block perfil">
            <span>Distribuicao por Perfil (TOs)</span>
            <div>
              {metric("P/PP", (row) => row.contagemTosPOrPpNaoTransbordo + row.contagemTosPOrPpTransbordo)}
              {metric("M", (row) => row.contagemTosMNaoTransbordo + row.contagemTosMTransbordo)}
              {metric("G", (row) => row.contagemTosGNaoTransbordo + row.contagemTosGTransbordo)}
              {metric("Bulky/Ultra", (row) => row.contagemTosBulkyOrUltrabulkyNaoTransbordo + row.contagemTosBulkyOrUltrabulkyTransbordo)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HistoricoOutboundPage({
  initialData,
  variant = "outbound"
}: {
  initialData: HistoricoOutboundData;
  variant?: "outbound" | "inbound";
}) {
  const [data, setData] = useState<HistoricoOutboundData>(initialData);
  const [filters, setFilters] = useState<Filters>(() => buildDefaultFilters(initialData?.filtros?.datas));
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("one-page:outbound:historico:v3");
        window.sessionStorage.removeItem("one-page:inbound:historico:v14");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (initialData && initialData.linhas && initialData.linhas.length > 0) {
      setData(initialData);
      setFilters((current) => (current.startDate || current.endDate ? current : buildDefaultFilters(initialData.filtros?.datas)));
    }
  }, [initialData]);

  useEffect(() => {
    if (!refreshKey) return;

    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      try {
        const endpoint = variant === "inbound" ? "/api/historico-inbound" : "/api/historico-outbound";
        const query = `?refresh=${encodeURIComponent(refreshKey)}`;
        const response = await fetch(`${endpoint}${query}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;

        const nextData = (await response.json()) as HistoricoOutboundData;
        if (nextData && nextData.linhas && nextData.linhas.length > 0) {
          setData(nextData);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Falha ao carregar historico", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [refreshKey, variant]);

  const filteredRows = useMemo(() => filterRows(data.linhas, filters), [data.linhas, filters]);
  const historicoView = useMemo(() => {
    const fila = byTurno(filteredRows, (rows) => average(rows, (row) => row.tempoFilaMs));
    const doca = byTurno(filteredRows, (rows) => average(rows, (row) => row.tempoDocaMs));
    const sppScuttleTo = sum(filteredRows, (row) => row.toScuttle + row.toPallet + row.toOthers);
    const sppSacaTo = sum(filteredRows, (row) => row.toSaca);

    return {
      hourRows: hourSeries(filteredRows),
      sacaRows: sacaCluster(filteredRows),
      fila,
      doca,
      totalTrips: uniqueCount(filteredRows, (row) => row.tripNumber),
      ordersTotal: sum(filteredRows, (row) => row.totalOrders),
      tosTotal: sum(filteredRows, (row) => row.toTotal),
      sppScuttle:
        sppScuttleTo > 0
          ? sum(filteredRows, (row) => row.ordersScuttle + row.ordersPallet + row.ordersOthers) / sppScuttleTo
          : 0,
      sppSaca: sppSacaTo > 0 ? sum(filteredRows, (row) => row.ordersSaca) / sppSacaTo : 0
    };
  }, [filteredRows]);
  const {
    hourRows,
    sacaRows,
    fila,
    doca,
    totalTrips,
    ordersTotal,
    tosTotal,
    sppScuttle,
    sppSaca
  } = historicoView;
  const filterCount = activeFilters(filters);

  return (
    <section className="hist-out-page hist-out-expedition">
      {data.erro && (
        <section className="card hist-out-error">
          <strong>{data.erro.mensagem}</strong>
          {data.erro.detalhe && <small>{data.erro.detalhe}</small>}
        </section>
      )}

      <section className="card hist-out-filters">
        <div className="hist-out-filter-top">
          <div />
          <div className="hist-out-filter-actions">
            <span>{loading ? "Atualizando..." : `Atualizado ${data.atualizadoEm}`}</span>
            <span>{filterCount} filtros ativos</span>
            <PageActions
              onClear={() => setFilters(buildDefaultFilters(data.filtros.datas))}
              onRefresh={() => setRefreshKey(Date.now())}
              refreshDisabled={loading}
            />
          </div>
        </div>
        <div className="hist-out-filter-grid outbound">
          <DatePeriodPicker
            endDate={filters.endDate}
            label={variant === "inbound" ? "Data descarga" : "Data expedicao"}
            onChange={(startDate, endDate) => setFilters((current) => ({ ...current, startDate, endDate }))}
            startDate={filters.startDate}
          />
          <FilterSelect label="Turno" options={TURNOS} value={filters.turno} onChange={(turno) => setFilters((current) => ({ ...current, turno }))} />
          <FilterSelect label="Destino" options={data.filtros.destinos} value={filters.destino} onChange={(destino) => setFilters((current) => ({ ...current, destino }))} />
          <FilterSelect label="Fluxo" options={data.filtros.fluxos} value={filters.fluxo} onChange={(fluxo) => setFilters((current) => ({ ...current, fluxo }))} />
          <label className="hist-out-filter-field">
            <span>Digite a LT</span>
            <input placeholder="Insira um valor" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} />
          </label>
        </div>
        <div className="hist-out-filter-bottom">
          <span>Periodo: {filters.startDate || filters.endDate ? `${dayLabel(filters.startDate)} - ${dayLabel(filters.endDate)}` : "todos"}</span>
          <div>
            <button className="button ghost" type="button" onClick={() => downloadCsv(filteredRows)}>
              CSV
            </button>
          </div>
        </div>
      </section>

      <section className="hist-out-kpi-strip">
        <MetricCard label={variant === "inbound" ? "LHS recebidos" : "LHS expedidos"} value={formatNumber(totalTrips)} hint={`${dayLabel(filters.startDate)} ate ${dayLabel(filters.endDate)}`} />
        <MetricCard label="Pedidos" value={formatNumber(ordersTotal)} hint="total_orders" />
        <MetricCard label="TOs" value={formatNumber(tosTotal)} hint="to_total" />
        <MetricCard label="Tempo em fila" value={formatDuration(fila.geral)} hint="Chegada ate unseal" />
        <MetricCard label="Tempo em doca" value={formatDuration(doca.geral)} hint={variant === "inbound" ? "Media do tempo de descarga" : "Unseal ate expedicao"} />
      </section>

      <HourBarChart rows={hourRows} variant={variant} />

      <section className="hist-out-lower-grid">
        <TimePanel fila={fila} doca={doca} variant={variant} />
        <ClusterTable rows={sacaRows} />
        <SppPanel sppScuttle={sppScuttle} sppSaca={sppSaca} />
        <AberturaPanel rows={filteredRows} variant={variant} />
      </section>
    </section>
  );
}
