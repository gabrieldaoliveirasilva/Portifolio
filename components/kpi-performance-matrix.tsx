"use client";

import { useMemo, useState, useEffect } from "react";
import {
  KpiCell,
  KpiPeriod,
  KpiRow,
  mockKpiPayload
} from "@/lib/kpi-performance-data";

interface KpiPerformanceMatrixProps {
  initialTab?: "kpi" | "gerot" | "analise";
  initialCategory?: string;
  initialKpiSearch?: string;
}

export default function KpiPerformanceMatrix({
  initialTab = "kpi",
  initialCategory = "",
  initialKpiSearch = ""
}: KpiPerformanceMatrixProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"kpi" | "gerot" | "analise">(initialTab);

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [weekFilter, setWeekFilter] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "weekly">("all");
  const [dataFilter, setDataFilter] = useState<"all" | "with-data">("all");
  const [searchQuery, setSearchQuery] = useState(initialKpiSearch);
  const [detailFilter, setDetailFilter] = useState<"expandable" | "all" | "details">("expandable");

  // Date calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-25");
  const [draftStart, setDraftStart] = useState("2026-10-01");
  const [draftEnd, setDraftEnd] = useState("2026-10-25");
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 9, 1)); // Oct 2026

  // Expanded rows set
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Maximized full-screen state
  const [isMaximized, setIsMaximized] = useState(false);

  // Selected KPI for "Análise de Indicadores" tab
  const [selectedAnalysisKpiId, setSelectedAnalysisKpiId] = useState("row-cpt-on-time");

  // Filter periods
  const visiblePeriods = useMemo(() => {
    const all = mockKpiPayload.periods;
    return all.filter((period) => {
      // Week filter
      if (weekFilter && period.week !== weekFilter) return false;

      // Weekly only view
      if (viewFilter === "weekly") {
        return period.type === "week";
      }

      // Date range filtering
      if (period.type === "date" && period.date) {
        if (startDate && period.date < startDate) return false;
        if (endDate && period.date > endDate) return false;
      }

      return true;
    });
  }, [weekFilter, viewFilter, startDate, endDate]);

  // Filter rows based on tab, category, search, and detail
  const { filteredRows, parentRowsWithChildren } = useMemo(() => {
    let rows = mockKpiPayload.rows;

    // Filter by tab
    if (activeTab === "kpi") {
      rows = rows.filter((r) => r.group !== "Fluxo Operacional");
    }

    // Category filter
    if (categoryFilter) {
      rows = rows.filter((r) => r.group === categoryFilter);
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    const matchedParentIds = new Set<string>();
    if (query) {
      rows.forEach((r) => {
        if (r.label.toLowerCase().includes(query)) {
          matchedParentIds.add(r.detail && r.parentId ? r.parentId : r.id);
        }
      });
      rows = rows.filter((r) => matchedParentIds.has(r.detail && r.parentId ? r.parentId : r.id));
    }

    // Map parent rows to their children
    const parentMap = new Map<string, KpiRow[]>();
    mockKpiPayload.rows.forEach((r) => {
      if (r.detail && r.parentId) {
        const list = parentMap.get(r.parentId) || [];
        list.push(r);
        parentMap.set(r.parentId, list);
      }
    });

    // Detail visibility filtering
    let visibleRows: KpiRow[] = [];
    if (detailFilter === "details") {
      visibleRows = rows.filter((r) => r.detail);
    } else if (detailFilter === "all") {
      visibleRows = rows;
    } else {
      // "expandable": parent rows always shown; child rows only shown if parent is expanded
      visibleRows = rows.filter((r) => {
        if (!r.detail) return true;
        return r.parentId ? expandedRowIds.has(r.parentId) : false;
      });
    }

    return { filteredRows: visibleRows, parentRowsWithChildren: parentMap };
  }, [activeTab, categoryFilter, searchQuery, detailFilter, expandedRowIds]);

  // Calculate summary counts
  const summaryCounts = useMemo(() => {
    let good = 0;
    let bad = 0;
    let visibleKpiCount = 0;

    filteredRows.forEach((row) => {
      if (!row.detail) visibleKpiCount++;
      visiblePeriods.forEach((period) => {
        const cell = row.results[period.key];
        if (cell?.hasData) {
          if (cell.status === "good") good++;
          else if (cell.status === "bad") bad++;
        }
      });
    });

    return {
      good,
      bad,
      kpiCount: visibleKpiCount,
      totalRows: filteredRows.length
    };
  }, [filteredRows, visiblePeriods]);

  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  // Calendar helpers
  const handleCalendarShortcut = (type: "today" | "last7" | "month" | "last30") => {
    if (type === "today") {
      setDraftStart("2026-10-25");
      setDraftEnd("2026-10-25");
      setStartDate("2026-10-25");
      setEndDate("2026-10-25");
    } else if (type === "last7") {
      setDraftStart("2026-10-19");
      setDraftEnd("2026-10-25");
      setStartDate("2026-10-19");
      setEndDate("2026-10-25");
    } else if (type === "last30" || type === "month") {
      setDraftStart("2026-10-01");
      setDraftEnd("2026-10-25");
      setStartDate("2026-10-01");
      setEndDate("2026-10-25");
    }
    setAwaitingEnd(false);
    setIsCalendarOpen(false);
  };

  const handleDayClick = (dayStr: string) => {
    if (!draftStart || !awaitingEnd) {
      setDraftStart(dayStr);
      setDraftEnd(dayStr);
      setAwaitingEnd(true);
    } else {
      if (dayStr < draftStart) {
        setDraftEnd(draftStart);
        setDraftStart(dayStr);
      } else {
        setDraftEnd(dayStr);
      }
      setAwaitingEnd(false);
    }
  };

  const confirmCalendarSelection = () => {
    setStartDate(draftStart);
    setEndDate(draftEnd || draftStart);
    setIsCalendarOpen(false);
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setWeekFilter("");
    setViewFilter("all");
    setDataFilter("all");
    setSearchQuery("");
    setDetailFilter("expandable");
    setStartDate("2026-10-01");
    setEndDate("2026-10-25");
    setDraftStart("2026-10-01");
    setDraftEnd("2026-10-25");
    setExpandedRowIds(new Set());
  };

  // Trend computation between adjacent days
  const previousPeriodMap = useMemo(() => {
    const dates = visiblePeriods.filter((p) => p.type === "date");
    const map = new Map<string, KpiPeriod>();
    for (let i = 1; i < dates.length; i++) {
      map.set(dates[i].key, dates[i - 1]);
    }
    return map;
  }, [visiblePeriods]);

  function getTrendBadge(
    currentCell: KpiCell | undefined,
    previousCell: KpiCell | undefined,
    row: KpiRow
  ) {
    if (!currentCell?.hasData || !previousCell?.hasData) return null;
    if (currentCell.raw == null || previousCell.raw == null) return null;

    const diff = currentCell.raw - previousCell.raw;
    if (Math.abs(diff) < 0.001) {
      return <span className="kpi-trend stable" title="Estável">●</span>;
    }

    const isUp = diff > 0;
    const operator = row.target.operator;
    let isPositive = isUp;
    if (operator === "lte") {
      isPositive = !isUp;
    }

    return (
      <span
        className={`kpi-trend ${isPositive ? "up" : "down"}`}
        title={`Comparado ao dia anterior: ${isUp ? "+" : ""}${diff.toFixed(1)}`}
      >
        {isUp ? "▲" : "▼"}
      </span>
    );
  }

  // Categories list based on active tab
  const categoryOptions = activeTab === "kpi"
    ? ["Cost", "Quality & HSE", "Speed"]
    : ["Cost", "Quality & HSE", "Speed", "Fluxo Operacional"];

  // Selected row for analysis tab
  const selectedAnalysisRow = useMemo(() => {
    return mockKpiPayload.rows.find((r) => r.id === selectedAnalysisKpiId) || mockKpiPayload.rows[0];
  }, [selectedAnalysisKpiId]);

  return (
    <div className={`kpi-matrix-container ${isMaximized ? "is-maximized" : ""}`}>
      {/* Top Nav Sub-Bar matching Apps Script project */}
      <nav className="kpi-nav-bar" aria-label="Navegação entre painéis">
        <button
          className={`kpi-nav-btn ${activeTab === "kpi" ? "active" : ""}`}
          onClick={() => setActiveTab("kpi")}
          type="button"
        >
          KPI Performance
        </button>
        <button
          className={`kpi-nav-btn ${activeTab === "gerot" ? "active" : ""}`}
          onClick={() => setActiveTab("gerot")}
          type="button"
        >
          GEROT
        </button>
        <button
          className={`kpi-nav-btn ${activeTab === "analise" ? "active" : ""}`}
          onClick={() => setActiveTab("analise")}
          type="button"
        >
          Análise de Indicadores
        </button>
      </nav>

      {/* Header bar */}
      <header className="kpi-topbar">
        <div className="kpi-brand">
          <div className="kpi-brand-mark">
            {activeTab === "kpi" ? "KPI" : activeTab === "gerot" ? "GER" : "BI"}
          </div>
          <div>
            <p className="kpi-eyebrow">PERFORMANCE OPERACIONAL</p>
            <h1>
              {activeTab === "kpi"
                ? "KPI Performance"
                : activeTab === "gerot"
                ? "GEROT"
                : "Análise de Indicadores"}
            </h1>
            <p className="kpi-subtitle">
              {activeTab === "kpi"
                ? "Resultados diários e consolidados dos indicadores operacionais"
                : activeTab === "gerot"
                ? "Painel unificado com KPIs e fluxo de volume diário por turno"
                : "Evolução detalhada, curvas de tendência e distribuição por turno"}
            </p>
          </div>
        </div>

        <div className="kpi-top-actions">
          <div className="kpi-reading-info">
            <span>ÚLTIMA LEITURA</span>
            <strong>25/10/2026, 11:30</strong>
          </div>
          <button
            className="kpi-action-btn"
            onClick={resetFilters}
            title="Recarregar dados e restaurar visão padrão"
            type="button"
          >
            🔄 Atualizar
          </button>
        </div>
      </header>

      {/* Filters toolbar */}
      <section className="kpi-filters-panel" aria-label="Filtros da Matriz">
        <div className="kpi-filter-header">
          <strong>FILTROS DA MATRIZ</strong>
          <span>
            {categoryFilter || weekFilter || searchQuery || viewFilter !== "all"
              ? "Filtros aplicados"
              : "Visão padrão • Outubro 2026"}
          </span>
        </div>

        <div className="kpi-filters-grid">
          {/* Date / Period Popover trigger */}
          <div className="kpi-field calendar-filter">
            <span className="kpi-field-label">DATA / PERÍODO</span>
            <div className="kpi-date-control">
              <button
                className="kpi-date-trigger"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                type="button"
              >
                📅 {startDate ? `${startDate.slice(8, 10)}/${startDate.slice(5, 7)}` : "Início"} a{" "}
                {endDate ? `${endDate.slice(8, 10)}/${endDate.slice(5, 7)}` : "Fim"}
              </button>
              <button
                className="kpi-date-clear"
                onClick={() => {
                  setStartDate("2026-10-01");
                  setEndDate("2026-10-25");
                }}
                title="Restaurar período completo"
                type="button"
              >
                ✕
              </button>
            </div>

            {isCalendarOpen && (
              <div className="kpi-calendar-popover">
                <div className="kpi-calendar-body">
                  <aside className="kpi-calendar-shortcuts">
                    <button
                      className="kpi-shortcut-btn"
                      onClick={() => handleCalendarShortcut("today")}
                      type="button"
                    >
                      Hoje (25/10)
                    </button>
                    <button
                      className="kpi-shortcut-btn"
                      onClick={() => handleCalendarShortcut("last7")}
                      type="button"
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      className="kpi-shortcut-btn"
                      onClick={() => handleCalendarShortcut("last30")}
                      type="button"
                    >
                      Mês Completo (Out/26)
                    </button>
                  </aside>

                  <div className="kpi-calendar-main">
                    <div className="kpi-calendar-month-bar">
                      <button
                        className="kpi-month-nav"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() - 1,
                              1
                            )
                          )
                        }
                        type="button"
                      >
                        ◀
                      </button>
                      <strong>
                        {calendarMonth.toLocaleString("pt-BR", {
                          month: "long",
                          year: "numeric"
                        })}
                      </strong>
                      <button
                        className="kpi-month-nav"
                        onClick={() =>
                          setCalendarMonth(
                            new Date(
                              calendarMonth.getFullYear(),
                              calendarMonth.getMonth() + 1,
                              1
                            )
                          )
                        }
                        type="button"
                      >
                        ▶
                      </button>
                    </div>

                    <div className="kpi-weekdays">
                      <span>S</span>
                      <span>T</span>
                      <span>Q</span>
                      <span>Q</span>
                      <span>S</span>
                      <span>S</span>
                      <span>D</span>
                    </div>

                    <div className="kpi-days-grid">
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1;
                        const dayPad = String(day).padStart(2, "0");
                        const dateKey = `2026-10-${dayPad}`;
                        const isStart = dateKey === draftStart;
                        const isEnd = dateKey === draftEnd;
                        const inRange =
                          draftStart &&
                          draftEnd &&
                          dateKey > draftStart &&
                          dateKey < draftEnd;

                        return (
                          <button
                            className={`kpi-day-cell ${
                              isStart || isEnd ? "selected" : ""
                            } ${inRange ? "in-range" : ""}`}
                            key={dateKey}
                            onClick={() => handleDayClick(dateKey)}
                            type="button"
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="kpi-calendar-footer">
                  <span className="kpi-range-display">
                    Intervalo: {draftStart} até {draftEnd || draftStart}
                  </span>
                  <button
                    className="kpi-confirm-date-btn"
                    onClick={confirmCalendarSelection}
                    type="button"
                  >
                    Confirmar Seleção
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Categoria */}
          <label className="kpi-field">
            <span className="kpi-field-label">CATEGORIA</span>
            <select
              className="kpi-select"
              onChange={(e) => setCategoryFilter(e.target.value)}
              value={categoryFilter}
            >
              <option value="">Todas</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {/* Semana */}
          <label className="kpi-field">
            <span className="kpi-field-label">SEMANA</span>
            <select
              className="kpi-select"
              onChange={(e) => setWeekFilter(e.target.value)}
              value={weekFilter}
            >
              <option value="">Todas</option>
              <option value="W40">W40 (01/10 a 04/10)</option>
              <option value="W41">W41 (05/10 a 11/10)</option>
              <option value="W42">W42 (12/10 a 18/10)</option>
              <option value="W43">W43 (19/10 a 25/10)</option>
            </select>
          </label>

          {/* Visualização */}
          <label className="kpi-field">
            <span className="kpi-field-label">VISUALIZAÇÃO</span>
            <select
              className="kpi-select"
              onChange={(e) => setViewFilter(e.target.value as "all" | "weekly")}
              value={viewFilter}
            >
              <option value="all">Tudo (Semanas e Dias)</option>
              <option value="weekly">Semanal (Apenas Wxx)</option>
            </select>
          </label>

          {/* Pesquisar KPI */}
          <label className="kpi-field">
            <span className="kpi-field-label">PESQUISAR KPI</span>
            <input
              className="kpi-input"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o indicador..."
              type="search"
              value={searchQuery}
            />
          </label>

          {/* Detalhes */}
          <label className="kpi-field">
            <span className="kpi-field-label">DETALHES</span>
            <select
              className="kpi-select"
              onChange={(e) =>
                setDetailFilter(e.target.value as "expandable" | "all" | "details")
              }
              value={detailFilter}
            >
              <option value="expandable">Recolhidos (+)</option>
              <option value="all">Todos expandidos</option>
              <option value="details">Somente detalhes</option>
            </select>
          </label>

          {/* Clear button */}
          <button
            className="kpi-clear-btn"
            onClick={resetFilters}
            type="button"
          >
            Limpar Filtros
          </button>
        </div>
      </section>

      {/* Summary KPI Counters */}
      <section className="kpi-summary-grid" aria-label="Resumo dos dados filtrados">
        <article className="kpi-summary-card good">
          <span>KPIS NO TARGET</span>
          <strong>{summaryCounts.good}</strong>
          <small>Dentro da meta esperada</small>
        </article>

        <article className="kpi-summary-card neutral">
          <span>KPIS VISÍVEIS</span>
          <strong>{summaryCounts.kpiCount}</strong>
          <small>{summaryCounts.totalRows} linhas na visualização</small>
        </article>

        <article className="kpi-summary-card bad">
          <span>KPIS FORA DO TARGET</span>
          <strong>{summaryCounts.bad}</strong>
          <small>Abaixo ou acima do limite</small>
        </article>

        <article className="kpi-summary-card info">
          <span>PERÍODOS EXIBIDOS</span>
          <strong>{visiblePeriods.length}</strong>
          <small>{viewFilter === "weekly" ? "Consolidados semanais" : "Dias + Semanas"}</small>
        </article>
      </section>

      {/* Active Tab Content */}
      {activeTab === "analise" ? (
        <section className="kpi-analise-panel">
          <header className="kpi-panel-head">
            <div>
              <strong>ANÁLISE PROFUNDA DO INDICADOR</strong>
              <span>Selecione uma métrica para inspecionar curvas de tendência e distribuição</span>
            </div>
            <select
              className="kpi-select analise-select"
              onChange={(e) => setSelectedAnalysisKpiId(e.target.value)}
              value={selectedAnalysisKpiId}
            >
              {mockKpiPayload.rows
                .filter((r) => !r.detail)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.group}] {r.label} (Meta: {r.target.display})
                  </option>
                ))}
            </select>
          </header>

          <div className="kpi-analise-body">
            <div className="kpi-analise-chart-card">
              <h3>Evolução Diária - Outubro 2026</h3>
              <p className="kpi-chart-meta">
                Meta definida: <strong>{selectedAnalysisRow.target.display}</strong> • Linha de base operacional
              </p>

              {/* Responsive SVG Area Chart */}
              <div className="kpi-svg-container">
                <svg className="kpi-svg-chart" viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4a7bb0" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#4a7bb0" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line stroke="#e2e8f0" strokeDasharray="3 3" x1="40" x2="780" y1="40" y2="40" />
                  <line stroke="#e2e8f0" strokeDasharray="3 3" x1="40" x2="780" y1="100" y2="100" />
                  <line stroke="#e2e8f0" strokeDasharray="3 3" x1="40" x2="780" y1="160" y2="160" />
                  <line stroke="#cbd5e1" x1="40" x2="780" y1="200" y2="200" />

                  {/* Target reference dashed line */}
                  <line
                    stroke="#d99b64"
                    strokeDasharray="5 4"
                    strokeWidth="2"
                    x1="40"
                    x2="780"
                    y1="110"
                    y2="110"
                  />
                  <text fill="#b45309" fontSize="10" fontWeight="bold" x="710" y="105">
                    Meta ({selectedAnalysisRow.target.display})
                  </text>

                  {/* Points & Line */}
                  {(() => {
                    const datePeriods = visiblePeriods.filter((p) => p.type === "date");
                    if (datePeriods.length === 0) return null;

                    const values = datePeriods.map((p) => selectedAnalysisRow.results[p.key]?.raw ?? 0);
                    const minVal = Math.min(...values);
                    const maxVal = Math.max(...values);
                    const range = maxVal - minVal || 1;

                    const points = datePeriods.map((p, idx) => {
                      const x = 50 + (idx / Math.max(1, datePeriods.length - 1)) * 710;
                      const val = selectedAnalysisRow.results[p.key]?.raw ?? 0;
                      const y = 180 - ((val - minVal) / range) * 120;
                      return { x, y, label: p.label, val, status: selectedAnalysisRow.results[p.key]?.status };
                    });

                    const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "");
                    const areaD = `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#areaGradient)" />
                        <path d={pathD} fill="none" stroke="#4a7bb0" strokeWidth="2.5" />
                        {points.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              fill={pt.status === "good" ? "#48a984" : pt.status === "bad" ? "#d66870" : "#4a7bb0"}
                              r="4.5"
                              stroke="#fff"
                              strokeWidth="2"
                            />
                            {i % 3 === 0 && (
                              <text fill="#64748b" fontSize="9" textAnchor="middle" x={pt.x} y="215">
                                {pt.label}
                              </text>
                            )}
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Shift Breakdown comparison */}
            <div className="kpi-analise-side-card">
              <h3>Desempenho por Turno</h3>
              <p>Média consolidada do indicador no período filtrado</p>

              <div className="kpi-shifts-list">
                <div className="kpi-shift-row">
                  <div className="kpi-shift-label">
                    <strong>Turno 1 (T1 - Manhã)</strong>
                    <span className="tag good">Dentro da meta</span>
                  </div>
                  <div className="kpi-shift-bar-bg">
                    <div className="kpi-shift-bar-fill good" style={{ width: "94%" }}></div>
                  </div>
                  <div className="kpi-shift-values">
                    <span>Aderência: 94.2%</span>
                    <strong>Excelente</strong>
                  </div>
                </div>

                <div className="kpi-shift-row">
                  <div className="kpi-shift-label">
                    <strong>Turno 2 (T2 - Tarde)</strong>
                    <span className="tag good">Dentro da meta</span>
                  </div>
                  <div className="kpi-shift-bar-bg">
                    <div className="kpi-shift-bar-fill good" style={{ width: "91%" }}></div>
                  </div>
                  <div className="kpi-shift-values">
                    <span>Aderência: 91.5%</span>
                    <strong>Estável</strong>
                  </div>
                </div>

                <div className="kpi-shift-row">
                  <div className="kpi-shift-label">
                    <strong>Turno 3 (T3 - Noite)</strong>
                    <span className="tag warning">Atenção</span>
                  </div>
                  <div className="kpi-shift-bar-bg">
                    <div className="kpi-shift-bar-fill warning" style={{ width: "86%" }}></div>
                  </div>
                  <div className="kpi-shift-values">
                    <span>Aderência: 86.8%</span>
                    <strong>Oportunidade</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Matrix Table Panel */
        <article className={`kpi-table-panel ${isMaximized ? "maximized" : ""}`}>
          <header className="kpi-panel-head">
            <div className="kpi-head-title">
              <strong>MATRIZ DE INDICADORES</strong>
              <span className="kpi-badge-count">{filteredRows.length} linhas exibidas</span>
            </div>
            <div className="kpi-head-actions">
              <button
                aria-label={isMaximized ? "Restaurar tamanho normal" : "Maximizar matriz"}
                className="kpi-btn-maximize"
                onClick={() => setIsMaximized(!isMaximized)}
                type="button"
              >
                {isMaximized ? "🗗 Restaurar" : "🗖 Maximizar"}
              </button>
            </div>
          </header>

          <div className="kpi-matrix-scroll-wrapper">
            <table className="kpi-matrix-table">
              <thead>
                <tr>
                  <th className="col-sticky col-topic">TÓPICO PRINCIPAL</th>
                  <th className="col-sticky col-kpi">INDICADOR</th>
                  <th className="col-sticky col-target">TARGET</th>
                  {visiblePeriods.map((p) => (
                    <th
                      className={`col-period ${p.type === "week" ? "col-week" : ""}`}
                      key={p.key}
                      title={p.type === "week" ? `Consolidado ${p.label}` : `Resultado ${p.label}`}
                    >
                      <div className="period-head-content">
                        <span>{p.label}</span>
                        {p.type === "week" && <small className="week-tag">W</small>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      className="kpi-empty-message"
                      colSpan={visiblePeriods.length + 3}
                    >
                      Nenhum indicador corresponde aos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const hasChildren = parentRowsWithChildren.has(row.id);
                    const isExpanded = expandedRowIds.has(row.id);

                    return (
                      <tr
                        className={`kpi-row ${row.detail ? "is-detail-row" : "is-parent-row"}`}
                        key={row.id}
                      >
                        {/* Tópico Principal */}
                        <td className="col-sticky col-topic">
                          {!row.detail && (
                            <span
                              className={`kpi-topic-badge group-${row.group
                                .toLowerCase()
                                .replace(/[^a-z]/g, "")}`}
                            >
                              {row.group}
                            </span>
                          )}
                        </td>

                        {/* Indicador Name */}
                        <td className="col-sticky col-kpi">
                          <div className="kpi-name-cell">
                            {!row.detail && hasChildren && (
                              <button
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                                className="kpi-expand-btn"
                                onClick={() => toggleRowExpansion(row.id)}
                                type="button"
                              >
                                {isExpanded ? "−" : "+"}
                              </button>
                            )}
                            {row.detail && <span className="kpi-detail-indent-dot" />}
                            <strong className={row.detail ? "kpi-detail-title" : "kpi-main-title"}>
                              {row.label}
                            </strong>
                          </div>
                        </td>

                        {/* Target */}
                        <td className="col-sticky col-target">
                          <span
                            className={`kpi-target-badge ${
                              row.target.display === "-" ? "empty" : ""
                            }`}
                          >
                            {row.target.display}
                          </span>
                        </td>

                        {/* Periods Values */}
                        {visiblePeriods.map((period) => {
                          const cell = row.results[period.key];
                          const previousPeriod =
                            period.type === "date"
                              ? previousPeriodMap.get(period.key)
                              : undefined;
                          const previousCell = previousPeriod
                            ? row.results[previousPeriod.key]
                            : undefined;

                          return (
                            <td
                              className={`col-period-cell ${
                                period.type === "week" ? "col-week-cell" : ""
                              }`}
                              key={period.key}
                            >
                              {cell?.hasData ? (
                                <div className="kpi-value-wrapper">
                                  <span
                                    className={`kpi-value-pill ${cell.status}`}
                                    title={`${row.label} (${period.label}): ${cell.display}`}
                                  >
                                    {cell.display}
                                  </span>
                                  {period.type === "date" &&
                                    getTrendBadge(cell, previousCell, row)}
                                </div>
                              ) : (
                                <span className="kpi-value-empty">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Footer metadata */}
      <footer className="kpi-footer-info">
        <span>
          Versão 2026.08.17.1 • Fonte: Base Consolidada / KPIs Performance MG4 • {filteredRows.length} linhas
          carregadas • Snapshot local persistido
        </span>
      </footer>
    </div>
  );
}
