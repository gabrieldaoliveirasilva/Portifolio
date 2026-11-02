"use client";

// AI maintenance map: canonical UI for Historico Prod Esteiras.
// Data normalization/aggregation belongs in lib/historico-packing.ts.
import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/app-header";
import DatePeriodPicker from "@/components/date-period-picker";
import PageActions from "@/components/page-actions";
import type { HistoricoChartRow, HistoricoDistributionRow, HistoricoPackingData } from "@/lib/historico-packing";

type Props = {
  initialData: HistoricoPackingData;
  embedded?: boolean;
};

type Filters = HistoricoPackingData["filtroAplicado"];
type ChartRow = HistoricoChartRow | (HistoricoChartRow & { gap: number });

const emptyFilters: Filters = {
  inicio: "",
  fim: "",
  turno: "",
  esteira: "",
  unitizador: "",
  perfil: "",
  hora: "",
  fifo: ""
};

function defaultFilters(data: HistoricoPackingData): Filters {
  return {
    ...emptyFilters,
    inicio: data.filtroAplicado.inicio,
    fim: data.filtroAplicado.fim
  };
}

function numberFormat(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function compactNumber(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return numberFormat(value);
}

function percentFormat(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function kpiTone(value: number) {
  if (value >= 100) return "green";
  if (value >= 90) return "orange";
  return "red";
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

const HISTORICO_PACKING_BROWSER_CACHE_PREFIX = "one-page:historico-packing:v2:";
const HISTORICO_PACKING_FILTERS_KEY = "one-page:historico-packing:filters:v1";
const HISTORICO_BROWSER_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type HistoricoPackingBrowserCache =
  | HistoricoPackingData
  | {
      cachedAt: number;
      data: HistoricoPackingData;
    };

function unwrapBrowserCache(payload: HistoricoPackingBrowserCache): HistoricoPackingData | null {
  if ("cachedAt" in payload && "data" in payload) {
    if (Date.now() - payload.cachedAt > HISTORICO_BROWSER_CACHE_TTL_MS) return null;
    return payload.data;
  }

  return payload;
}

function browserCacheKey(filters: Filters) {
  return `${HISTORICO_PACKING_BROWSER_CACHE_PREFIX}${buildQuery(filters) || "default"}`;
}

function readBrowserCache(filters: Filters): HistoricoPackingData | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.sessionStorage.getItem(browserCacheKey(filters));
    return cached ? unwrapBrowserCache(JSON.parse(cached) as HistoricoPackingBrowserCache) : null;
  } catch {
    return null;
  }
}

function writeBrowserCache(filters: Filters, data: HistoricoPackingData) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      browserCacheKey(filters),
      JSON.stringify({ cachedAt: Date.now(), data })
    );
  } catch {
    // Se o navegador bloquear o cache local, mantemos a leitura normal pela API.
  }
}

function readStoredFilters(fallback: Filters): Filters {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.sessionStorage.getItem(HISTORICO_PACKING_FILTERS_KEY);
    return stored ? { ...fallback, ...(JSON.parse(stored) as Partial<Filters>) } : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredFilters(filters: Filters) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(HISTORICO_PACKING_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // A pagina continua funcional mesmo sem persistencia dos filtros.
  }
}

function filtersMatchData(filters: Filters, data: HistoricoPackingData) {
  return (Object.keys(filters) as Array<keyof Filters>).every(
    (key) => data.filtroAplicado[key] === filters[key]
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
  allLabel = "Todos"
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <label className="hist-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function KpiCard({ label, real, meta, eficiencia }: { label: string; real: number; meta: number; eficiencia: number }) {
  return (
    <div className="card hist-summary-card">
      <div className="hist-summary-head">
        <span>{label}</span>
        <strong className={kpiTone(eficiencia)}>{percentFormat(eficiencia)}</strong>
      </div>
      <div className="hist-summary-metrics">
        <div>
          <span>Real</span>
          <strong>{compactNumber(real)}</strong>
        </div>
        <div>
          <span>Meta Operacao</span>
          <strong className="meta">{compactNumber(meta)}</strong>
        </div>
      </div>
    </div>
  );
}

function ComboChart({ rows, compact = false }: { rows: ChartRow[]; compact?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => Math.max(row.real, row.meta ?? 0)));
  const points = rows
    .map((row, index) => {
      const x = rows.length > 1 ? (index / (rows.length - 1)) * 100 : 50;
      const y = 100 - Math.min(100, ((row.meta ?? 0) / max) * 100);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`hist-combo ${compact ? "compact" : ""}`}>
      <div className="hist-combo-bars">
        <svg className="hist-meta-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <title>Linha tracejada de meta da operacao</title>
          <polyline points={points} />
        </svg>
        {rows.map((row) => (
          <div
            className="hist-hour"
            key={row.label}
            tabIndex={0}
            title={`${row.label} | Real: ${numberFormat(row.real)} | Meta: ${numberFormat(row.meta ?? 0)} | Eficiencia: ${percentFormat(row.eficiencia ?? 0)}`}
          >
            <div className="hist-plot">
              <span className="hist-meta-label" style={{ bottom: `${Math.min(96, (((row.meta ?? 0) / max) * 100) + 3)}%` }}>
                {(row.meta ?? 0) > 0 ? compactNumber(row.meta ?? 0) : ""}
              </span>
              <div className="hist-bar" style={{ height: `${row.real > 0 ? Math.max(5, (row.real / max) * 100) : 2}%` }}>
                <span>{row.real > 0 ? compactNumber(row.real) : ""}</span>
              </div>
            </div>
            <div className="hist-chart-tooltip" role="tooltip">
              <div><span>Periodo</span><b>{row.label}</b></div>
              <div><span>Real</span><b>{numberFormat(row.real)}</b></div>
              <div><span>Meta</span><b>{numberFormat(row.meta ?? 0)}</b></div>
              <div><span>Eficiencia</span><b>{percentFormat(row.eficiencia ?? 0)}</b></div>
            </div>
            <b>{row.label}</b>
          </div>
        ))}
      </div>
      <div className="hist-legend"><span>Real</span><span>Meta Operacao</span></div>
    </div>
  );
}

function BarChart({
  rows,
  mode = "volume"
}: {
  rows: HistoricoDistributionRow[];
  mode?: "volume" | "percent";
}) {
  const values = rows.map((row) => (mode === "percent" ? row.percentual : row.real));
  const max = Math.max(1, ...values);
  return (
    <div className="hist-bar-list">
      {rows.map((row, index) => {
        const value = values[index] ?? 0;
        return (
          <div
            className="hist-bar-row"
            key={row.label}
            tabIndex={0}
            title={`${row.label} | Volume: ${numberFormat(row.real)} | Participacao: ${percentFormat(row.percentual)}`}
          >
            <span>{row.label}</span>
            <div><i style={{ width: `${Math.max(1, (value / max) * 100)}%` }} /></div>
            <strong>{mode === "percent" ? percentFormat(value) : numberFormat(value)}</strong>
            <div className="hist-chart-tooltip" role="tooltip">
              <div><span>Item</span><b>{row.label}</b></div>
              <div><span>Volume</span><b>{numberFormat(row.real)}</b></div>
              <div><span>Participacao</span><b>{percentFormat(row.percentual)}</b></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistorySidebar() {
  return (
    <aside className="side-nav card hist-sidebar">
      <a className="side-item active" href="/historico-packing">
        <span className="side-icon">H</span>
        <span className="side-label">Histórico Prod Esteiras</span>
      </a>
      <div className="side-section">
        <span className="side-section-title">Paginas</span>
        <a className="side-item old" href="/">
          <span className="side-icon">P</span>
          <span className="side-label">Live Prod HC</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#inbound">
          <span className="side-icon">I</span>
          <span className="side-label">Inbound live</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#programacao">
          <span className="side-icon">P</span>
          <span className="side-label">Programacao</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#geral">
          <span className="side-icon">G</span>
          <span className="side-label">Geral</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#alertas">
          <span className="side-icon">A</span>
          <span className="side-label">Alertas</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#inteligencia">
          <span className="side-icon">I</span>
          <span className="side-label">Inteligencia</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#stage">
          <span className="side-icon">S</span>
          <span className="side-label">Stage Out</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#docas">
          <span className="side-icon">D</span>
          <span className="side-label">Docas</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
        <a className="side-item old" href="/#contagem">
          <span className="side-icon">C</span>
          <span className="side-label">Contagem</span>
          <span className="side-arrow">&rsaquo;</span>
        </a>
      </div>
    </aside>
  );
}

export default function HistoricoPackingPage({ initialData, embedded = false }: Props) {
  const initialFilters = useMemo(() => defaultFilters(initialData), [initialData]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [data, setData] = useState<HistoricoPackingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unitMode, setUnitMode] = useState<"volume" | "percent">("volume");
  const firstLoadRef = useRef(true);

  useEffect(() => {
    const controller = new AbortController();
    const forceRefresh = refreshKey > 0;
    const cached = forceRefresh ? null : readBrowserCache(filters);
    writeStoredFilters(filters);

    if (cached) {
      firstLoadRef.current = false;
      setData(cached);
      return () => controller.abort();
    }

    if (firstLoadRef.current && !forceRefresh && filtersMatchData(filters, initialData)) {
      firstLoadRef.current = false;
      writeBrowserCache(filters, initialData);
      return () => controller.abort();
    }

    firstLoadRef.current = false;

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams(buildQuery(filters));
        if (forceRefresh) query.set("refresh", String(refreshKey));

        const response = await fetch(`/api/historico-packing?${query.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        if (response.ok) {
          const nextData = (await response.json()) as HistoricoPackingData;
          setData(nextData);
          writeBrowserCache(filters, nextData);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Falha ao atualizar historico packing", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [filters, refreshKey]);

  const filterOptions = data.filtros;
  const periodLabel = useMemo(() => {
    if (!filters.inicio && !filters.fim) return "Todos os periodos";
    return `${filters.inicio || "..."} - ${filters.fim || "..."}`;
  }, [filters.inicio, filters.fim]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  function forceRefreshPage() {
    setRefreshKey(Date.now());
  }

  const content = (
    <section className={`${embedded ? "" : "dashboard-content"} hist-page`}>
          <section className="card hist-filter-card">
            <div className="hist-filter-title">
              <span>Filtros</span>
              <small>Clique nos graficos ou use os campos abaixo.</small>
              <PageActions
                onClear={clearFilters}
                onRefresh={forceRefreshPage}
                refreshDisabled={loading}
              />
            </div>
            <DatePeriodPicker
              endDate={filters.fim}
              label="Data / periodo"
              onChange={(inicio, fim) => setFilters((current) => ({ ...current, inicio, fim }))}
              startDate={filters.inicio}
            />
            <SelectField label="Turno" options={filterOptions.turnos} value={filters.turno} onChange={(value) => updateFilter("turno", value)} />
            <SelectField label="Esteira" options={filterOptions.esteiras} value={filters.esteira} onChange={(value) => updateFilter("esteira", value)} />
            <SelectField label="Unitizador" options={filterOptions.unitizadores} value={filters.unitizador} onChange={(value) => updateFilter("unitizador", value)} />
            <SelectField label="Perfil" options={filterOptions.perfis} value={filters.perfil} onChange={(value) => updateFilter("perfil", value)} />
            <SelectField label="Hora" options={filterOptions.horas} value={filters.hora} onChange={(value) => updateFilter("hora", value)} />
            <SelectField label="FIFO" options={filterOptions.fifos} value={filters.fifo} onChange={(value) => updateFilter("fifo", value)} />
            <div className="hist-period-chip">Periodo: {periodLabel}</div>
          </section>

          {data.erro && (
            <section className="card hist-error">
              <strong>{data.erro.mensagem}</strong>
              <span>
                {data.erro.etapa === "permissao"
                  ? "Compartilhe a planilha com o e-mail da conta de servico configurada em GOOGLE_SERVICE_ACCOUNT_EMAIL como Leitor."
                  : data.erro.detalhe || "Revise a configuracao e tente atualizar novamente."}
              </span>
            </section>
          )}

          {data.cacheWarnings?.length ? (
            <section className="cache-warning" role="status">
              {data.cacheWarnings.map((warning) => (
                <span key={warning}>{warning}</span>
              ))}
            </section>
          ) : null}

          <section className="hist-kpi-grid">
            {data.cards.map((card) => (
              <KpiCard key={card.label} label={card.label} real={card.real} meta={card.meta} eficiencia={card.eficiencia} />
            ))}
          </section>

          <div className={`hist-loading ${loading ? "active" : ""}`}>Atualizando historico...</div>

          <section className="hist-main-grid">
            <div className="card hist-panel hist-panel-large">
              <div className="hist-panel-kicker">Grafico</div>
              <div className="panel-title">Producao por Esteira</div>
              <ComboChart rows={data.esteira} compact />
            </div>
            <div className="card hist-panel hist-panel-side">
              <div className="hist-panel-kicker">Resumo</div>
              <div className="panel-title">Producao por Turno</div>
              <ComboChart rows={data.turno} compact />
            </div>
          </section>

          <section className="hist-top-grid">
            <div className="card hist-panel">
              <div className="hist-panel-kicker">Historico</div>
              <div className="panel-title">Producao por Semana</div>
              <ComboChart rows={data.semana} compact />
            </div>
            <div className="card hist-panel wide-scroll">
              <div className="hist-panel-kicker">Historico</div>
              <div className="panel-title">Producao por Dia</div>
              <ComboChart rows={data.dia} compact />
            </div>
            <div className="card hist-panel">
              <div className="hist-panel-kicker">Operacional</div>
              <div className="panel-title">Producao Sinergia</div>
              <ComboChart rows={data.sinergia} compact />
            </div>
          </section>

          <section className="card hist-panel hist-hour-panel">
            <div className="panel-title">Producao por Hora</div>
            <ComboChart rows={data.horas} />
          </section>

          <section className="hist-bottom-grid">
            <div className="card hist-panel">
              <div className="hist-panel-head">
                <div>
                  <div className="hist-panel-kicker">Distribuicao</div>
                  <div className="panel-title">Producao por Unitizador</div>
                </div>
                <div className="hist-toggle">
                  <button className={unitMode === "volume" ? "active" : ""} type="button" onClick={() => setUnitMode("volume")}>VOL</button>
                  <button className={unitMode === "percent" ? "active" : ""} type="button" onClick={() => setUnitMode("percent")}>%</button>
                </div>
              </div>
              <BarChart rows={data.unitizador} mode={unitMode} />
            </div>
            <div className="card hist-panel">
              <div className="hist-panel-kicker">Distribuicao</div>
              <div className="panel-title">Producao por Perfil</div>
              <BarChart rows={data.perfil} />
            </div>
            <div className="card hist-panel">
              <div className="hist-panel-kicker">SLA</div>
              <div className="panel-title">Producao por FIFO</div>
              <BarChart rows={data.fifo} />
            </div>
          </section>

          {!data.kpis.volumeTotal && !loading && !data.erro && (
            <section className="card hist-empty">Sem dados encontrados para o recorte selecionado.</section>
          )}
    </section>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="page">
      <AppHeader title="MG4" />

      <div className="dashboard-layout hist-layout">
        <HistorySidebar />
        {content}
      </div>
    </main>
  );
}
