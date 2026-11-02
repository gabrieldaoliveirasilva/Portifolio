export type PeriodType = "week" | "date" | "month";

export interface KpiPeriod {
  key: string;
  label: string;
  type: PeriodType;
  date?: string; // YYYY-MM-DD
  week?: string; // e.g. W40, W41, W42, W43
  sourceColumn: number;
}

export type KpiCellStatus = "good" | "bad" | "warning" | "neutral";

export interface KpiCell {
  display: string;
  raw: number | null;
  status: KpiCellStatus;
  hasData: boolean;
}

export interface KpiTarget {
  display: string;
  operator: "gte" | "lte" | "eq" | "none";
  value: number;
}

export interface KpiRow {
  id: string;
  group: "Cost" | "Quality & HSE" | "Speed" | "Fluxo Operacional";
  label: string;
  detail: boolean;
  parentId?: string;
  target: KpiTarget;
  results: Record<string, KpiCell>; // keyed by period.key
}

export interface KpiPayload {
  generatedAt: string;
  source: string;
  cacheHit: boolean;
  periods: KpiPeriod[];
  rows: KpiRow[];
}

// Generate October 2026 dataset (01/10 to 25/10) with W40, W41, W42, W43
function generateMockPayload(): KpiPayload {
  const periods: KpiPeriod[] = [];
  let colIndex = 4;

  const weeksConfig = [
    {
      week: "W40",
      days: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]
    },
    {
      week: "W41",
      days: ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]
    },
    {
      week: "W42",
      days: ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]
    },
    {
      week: "W43",
      days: ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]
    }
  ];

  weeksConfig.forEach((w) => {
    // Add Week aggregate period first
    periods.push({
      key: `col-${w.week}`,
      label: w.week,
      type: "week",
      week: w.week,
      sourceColumn: colIndex++
    });

    // Add Daily periods
    w.days.forEach((dayStr) => {
      const parts = dayStr.split("-");
      const dayFormatted = `${parts[2]}/${parts[1]}`;
      periods.push({
        key: `col-${dayStr}`,
        label: dayFormatted,
        type: "date",
        date: dayStr,
        week: w.week,
        sourceColumn: colIndex++
      });
    });
  });

  type MetricDef = {
    id: string;
    group: "Cost" | "Quality & HSE" | "Speed" | "Fluxo Operacional";
    label: string;
    detail?: boolean;
    parentId?: string;
    target: { display: string; operator: "gte" | "lte" | "eq" | "none"; value: number };
    unit: "%" | "un/h" | "un" | "h" | "rate" | "count";
    baseVal: number;
    variance: number;
    decimals: number;
    children?: { label: string; offset: number }[];
  };

  const metricDefs: MetricDef[] = [
    // --- COST ---
    {
      id: "cpt-on-time",
      group: "Cost",
      label: "CPT on Time",
      target: { display: "≥ 98.0%", operator: "gte", value: 98.0 },
      unit: "%",
      baseVal: 98.4,
      variance: 0.9,
      decimals: 1,
      children: [
        { label: "CPT 06:00", offset: 0.5 },
        { label: "CPT 14:00", offset: -0.4 },
        { label: "CPT 22:00", offset: -0.2 }
      ]
    },
    {
      id: "conversao-sacas",
      group: "Cost",
      label: "Conversão de Sacas",
      target: { display: "≥ 90.0%", operator: "gte", value: 90.0 },
      unit: "%",
      baseVal: 91.2,
      variance: 2.1,
      decimals: 1,
      children: [
        { label: "Turno 1 (T1)", offset: 1.2 },
        { label: "Turno 2 (T2)", offset: -1.0 },
        { label: "Turno 3 (T3)", offset: -0.2 }
      ]
    },
    {
      id: "spr",
      group: "Cost",
      label: "SPR",
      target: { display: "≥ 95.0%", operator: "gte", value: 95.0 },
      unit: "%",
      baseVal: 96.1,
      variance: 1.4,
      decimals: 1,
      children: [
        { label: "SPR - Linha 1", offset: 0.8 },
        { label: "SPR - Linha 2", offset: -0.7 }
      ]
    },
    {
      id: "producao-saca",
      group: "Cost",
      label: "Produção de Saca",
      target: { display: "≥ 1.200", operator: "gte", value: 1200 },
      unit: "un",
      baseVal: 1320,
      variance: 120,
      decimals: 0,
      children: [
        { label: "Produção T1", offset: -880 }, // Shift share
        { label: "Produção T2", offset: -910 },
        { label: "Produção T3", offset: -930 }
      ]
    },
    {
      id: "packed-productivity",
      group: "Cost",
      label: "Packed Productivity",
      target: { display: "≥ 300", operator: "gte", value: 300 },
      unit: "un/h",
      baseVal: 312,
      variance: 18,
      decimals: 0,
      children: [
        { label: "Produtividade T1", offset: 12 },
        { label: "Produtividade T2", offset: -8 },
        { label: "Produtividade T3", offset: -4 }
      ]
    },
    {
      id: "absenteeism",
      group: "Cost",
      label: "% Absenteeism",
      target: { display: "≤ 4.0%", operator: "lte", value: 4.0 },
      unit: "%",
      baseVal: 3.6,
      variance: 0.9,
      decimals: 1,
      children: [
        { label: "Absenteísmo FTE", offset: -0.8 },
        { label: "Absenteísmo Parceiros", offset: 1.2 }
      ]
    },
    {
      id: "turnover-fte",
      group: "Cost",
      label: "% Turnover FTE",
      target: { display: "≤ 3.0%", operator: "lte", value: 3.0 },
      unit: "%",
      baseVal: 2.4,
      variance: 0.7,
      decimals: 1
    },
    {
      id: "daily-workers",
      group: "Cost",
      label: "% Daily Workers",
      target: { display: "≤ 15.0%", operator: "lte", value: 15.0 },
      unit: "%",
      baseVal: 12.8,
      variance: 2.2,
      decimals: 1
    },

    // --- QUALITY & HSE ---
    {
      id: "fifo-broken",
      group: "Quality & HSE",
      label: "% FIFO Broken",
      target: { display: "≤ 0.50%", operator: "lte", value: 0.5 },
      unit: "%",
      baseVal: 0.38,
      variance: 0.16,
      decimals: 2,
      children: [
        { label: "FIFO Inbound", offset: -0.1 },
        { label: "FIFO Sorting", offset: 0.15 }
      ]
    },
    {
      id: "mis-routing",
      group: "Quality & HSE",
      label: "% Mis-routing",
      target: { display: "≤ 0.10%", operator: "lte", value: 0.1 },
      unit: "%",
      baseVal: 0.08,
      variance: 0.04,
      decimals: 2,
      children: [
        { label: "Inter-Hub Transfer", offset: -0.02 },
        { label: "Last-Mile Distribution", offset: 0.03 }
      ]
    },
    {
      id: "mis-scanning",
      group: "Quality & HSE",
      label: "% Mis-scanning (SoC>LMH)",
      target: { display: "≤ 0.20%", operator: "lte", value: 0.2 },
      unit: "%",
      baseVal: 0.15,
      variance: 0.07,
      decimals: 2,
      children: [
        { label: "Turno 1", offset: -0.04 },
        { label: "Turno 2", offset: 0.05 },
        { label: "Turno 3", offset: 0.01 }
      ]
    },
    {
      id: "loss-rate-soc",
      group: "Quality & HSE",
      label: "Loss Rate SOC by Report Date",
      target: { display: "≤ 0.05%", operator: "lte", value: 0.05 },
      unit: "%",
      baseVal: 0.03,
      variance: 0.02,
      decimals: 2
    },
    {
      id: "loss-rate-rts",
      group: "Quality & HSE",
      label: "Loss Rate RTS",
      target: { display: "≤ 0.03%", operator: "lte", value: 0.03 },
      unit: "%",
      baseVal: 0.02,
      variance: 0.01,
      decimals: 2
    },
    {
      id: "ltir",
      group: "Quality & HSE",
      label: "LTIR - Loss-Time Injury Rate",
      target: { display: "≤ 1.00", operator: "lte", value: 1.0 },
      unit: "rate",
      baseVal: 0.45,
      variance: 0.35,
      decimals: 2
    },
    {
      id: "spi",
      group: "Quality & HSE",
      label: "SPI - Safety Performance Indicator",
      target: { display: "≤ 0.80", operator: "lte", value: 0.8 },
      unit: "rate",
      baseVal: 0.62,
      variance: 0.15,
      decimals: 2
    },
    {
      id: "tg-gravidade",
      group: "Quality & HSE",
      label: "TG - Taxa de Gravidade",
      target: { display: "≤ 10.0", operator: "lte", value: 10.0 },
      unit: "rate",
      baseVal: 4.8,
      variance: 3.5,
      decimals: 1
    },

    // --- SPEED ---
    {
      id: "lmh-cap-fulfillment",
      group: "Speed",
      label: "LMH Cap Fulfillment (2h packed)",
      target: { display: "≥ 98.0%", operator: "gte", value: 98.0 },
      unit: "%",
      baseVal: 98.6,
      variance: 1.1,
      decimals: 1
    },
    {
      id: "avg-wait-time-lh",
      group: "Speed",
      label: "Average Waiting Time - LH (FMH + Intersoc) [h]",
      target: { display: "≤ 2.0h", operator: "lte", value: 2.0 },
      unit: "h",
      baseVal: 1.6,
      variance: 0.5,
      decimals: 1,
      children: [
        { label: "Espera FMH", offset: -0.3 },
        { label: "Espera Inter-Hub", offset: 0.4 }
      ]
    },
    {
      id: "lead-time-rec-pack",
      group: "Speed",
      label: "Lead Time - Received to Packed (by received date)",
      target: { display: "≤ 4.0h", operator: "lte", value: 4.0 },
      unit: "h",
      baseVal: 3.4,
      variance: 0.7,
      decimals: 1,
      children: [
        { label: "Turno 1", offset: -0.5 },
        { label: "Turno 2", offset: 0.2 },
        { label: "Turno 3", offset: 0.6 }
      ]
    },
    {
      id: "lead-time-rec-handover",
      group: "Speed",
      label: "Lead Time - Received to Handover - Inter-SoC",
      target: { display: "≤ 6.0h", operator: "lte", value: 6.0 },
      unit: "h",
      baseVal: 5.1,
      variance: 0.9,
      decimals: 1
    },
    {
      id: "packed-on-time",
      group: "Speed",
      label: "Packed on time",
      target: { display: "≥ 98.0%", operator: "gte", value: 98.0 },
      unit: "%",
      baseVal: 98.5,
      variance: 1.2,
      decimals: 1,
      children: [
        { label: "Packed on time - Manhã", offset: 0.6 },
        { label: "Packed on time - Noite", offset: -0.8 }
      ]
    },
    {
      id: "backlog-inbounded",
      group: "Speed",
      label: "% Backlog Inbounded (>= 24h)",
      target: { display: "≤ 1.0%", operator: "lte", value: 1.0 },
      unit: "%",
      baseVal: 0.72,
      variance: 0.35,
      decimals: 2
    },
    {
      id: "leftover-total",
      group: "Speed",
      label: "LEFTOVER",
      target: { display: "≤ 500", operator: "lte", value: 500 },
      unit: "un",
      baseVal: 360,
      variance: 140,
      decimals: 0,
      children: [
        { label: "Leftover D0", offset: -160 },
        { label: "Leftover Histórico (>D0)", offset: -200 }
      ]
    },

    // --- FLUXO OPERACIONAL (GEROT) ---
    {
      id: "forecast-vol",
      group: "Fluxo Operacional",
      label: "Forecast Volume",
      target: { display: "Projeção", operator: "none", value: 0 },
      unit: "un",
      baseVal: 165000,
      variance: 15000,
      decimals: 0
    },
    {
      id: "volume-arrived-lh",
      group: "Fluxo Operacional",
      label: "Volume Arrived (Only LH)",
      target: { display: "Realizado", operator: "none", value: 0 },
      unit: "un",
      baseVal: 162400,
      variance: 14200,
      decimals: 0
    },
    {
      id: "volume-received",
      group: "Fluxo Operacional",
      label: "Volume Received",
      target: { display: "Processado", operator: "none", value: 0 },
      unit: "un",
      baseVal: 159800,
      variance: 13500,
      decimals: 0,
      children: [
        { label: "Received T1", offset: -108000 },
        { label: "Received T2", offset: -96000 },
        { label: "Received T3", offset: -115000 }
      ]
    },
    {
      id: "volume-packing",
      group: "Fluxo Operacional",
      label: "Volume Packing",
      target: { display: "Embalado", operator: "none", value: 0 },
      unit: "un",
      baseVal: 158200,
      variance: 13100,
      decimals: 0,
      children: [
        { label: "Packing T1", offset: -109000 },
        { label: "Packing T2", offset: -97000 },
        { label: "Packing T3", offset: -114000 }
      ]
    },
    {
      id: "volume-handover",
      group: "Fluxo Operacional",
      label: "Volume Handover",
      target: { display: "Expedido", operator: "none", value: 0 },
      unit: "un",
      baseVal: 155900,
      variance: 12800,
      decimals: 0
    }
  ];

  // Helper to format values
  function formatMetricValue(val: number, unit: MetricDef["unit"], decimals: number): string {
    if (unit === "%") {
      return `${val.toFixed(decimals)}%`;
    }
    if (unit === "h") {
      return `${val.toFixed(decimals)}h`;
    }
    if (unit === "un" || unit === "un/h" || unit === "count") {
      return Math.round(val).toLocaleString("pt-BR");
    }
    return val.toFixed(decimals);
  }

  // Deterministic pseudorandom generator based on seed
  function pseudoRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function evaluateStatus(val: number, target: MetricDef["target"]): KpiCellStatus {
    if (target.operator === "none") return "neutral";
    if (target.operator === "gte") {
      return val >= target.value ? "good" : "bad";
    }
    if (target.operator === "lte") {
      return val <= target.value ? "good" : "bad";
    }
    if (target.operator === "eq") {
      return Math.abs(val - target.value) < 0.01 ? "good" : "bad";
    }
    return "neutral";
  }

  const rows: KpiRow[] = [];

  metricDefs.forEach((def, defIdx) => {
    const parentRowId = `row-${def.id}`;
    const parentResults: Record<string, KpiCell> = {};

    // First generate daily values, then aggregate weeks
    const dailyValuesByWeek: Record<string, number[]> = {};

    periods.forEach((period, pIdx) => {
      if (period.type === "date") {
        const seed = (defIdx + 1) * 997 + (pIdx + 1) * 31;
        const norm = pseudoRandom(seed) * 2 - 1; // -1 to 1
        const rawVal = Math.max(0, Number((def.baseVal + norm * def.variance).toFixed(def.decimals)));
        const display = formatMetricValue(rawVal, def.unit, def.decimals);
        const status = evaluateStatus(rawVal, def.target);

        parentResults[period.key] = {
          raw: rawVal,
          display: display,
          status: status,
          hasData: true
        };

        if (period.week) {
          if (!dailyValuesByWeek[period.week]) dailyValuesByWeek[period.week] = [];
          dailyValuesByWeek[period.week].push(rawVal);
        }
      }
    });

    // Compute weekly summaries
    periods.forEach((period) => {
      if (period.type === "week" && period.week) {
        const vals = dailyValuesByWeek[period.week] || [];
        if (vals.length > 0) {
          let summaryVal = 0;
          if (def.unit === "un" && def.group === "Fluxo Operacional") {
            // Volume metric sums up over the week
            summaryVal = vals.reduce((a, b) => a + b, 0);
          } else {
            // Rates and averages
            summaryVal = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(def.decimals));
          }
          const display = formatMetricValue(summaryVal, def.unit, def.decimals);
          const status = evaluateStatus(summaryVal, def.target);

          parentResults[period.key] = {
            raw: summaryVal,
            display: display,
            status: status,
            hasData: true
          };
        } else {
          parentResults[period.key] = {
            raw: null,
            display: "-",
            status: "neutral",
            hasData: false
          };
        }
      }
    });

    rows.push({
      id: parentRowId,
      group: def.group,
      label: def.label,
      detail: false,
      target: def.target,
      results: parentResults
    });

    // Generate children detail rows if defined
    if (def.children && def.children.length > 0) {
      def.children.forEach((child, cIdx) => {
        const childRowId = `${parentRowId}-detail-${cIdx}`;
        const childResults: Record<string, KpiCell> = {};
        const childDailyByWeek: Record<string, number[]> = {};

        periods.forEach((period, pIdx) => {
          if (period.type === "date") {
            const parentCell = parentResults[period.key];
            const pVal = parentCell?.raw ?? def.baseVal;
            const seed = (defIdx + 1) * 333 + (cIdx + 1) * 127 + (pIdx + 1) * 17;
            const wobble = (pseudoRandom(seed) - 0.5) * (def.variance * 0.4);
            const childVal = Math.max(0, Number((pVal + child.offset + wobble).toFixed(def.decimals)));
            const display = formatMetricValue(childVal, def.unit, def.decimals);
            const status = evaluateStatus(childVal, def.target);

            childResults[period.key] = {
              raw: childVal,
              display: display,
              status: status,
              hasData: true
            };

            if (period.week) {
              if (!childDailyByWeek[period.week]) childDailyByWeek[period.week] = [];
              childDailyByWeek[period.week].push(childVal);
            }
          }
        });

        periods.forEach((period) => {
          if (period.type === "week" && period.week) {
            const vals = childDailyByWeek[period.week] || [];
            if (vals.length > 0) {
              let summaryVal = 0;
              if (def.unit === "un" && def.group === "Fluxo Operacional") {
                summaryVal = vals.reduce((a, b) => a + b, 0);
              } else {
                summaryVal = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(def.decimals));
              }
              const display = formatMetricValue(summaryVal, def.unit, def.decimals);
              const status = evaluateStatus(summaryVal, def.target);

              childResults[period.key] = {
                raw: summaryVal,
                display: display,
                status: status,
                hasData: true
              };
            } else {
              childResults[period.key] = {
                raw: null,
                display: "-",
                status: "neutral",
                hasData: false
              };
            }
          }
        });

        rows.push({
          id: childRowId,
          group: def.group,
          label: child.label,
          detail: true,
          parentId: parentRowId,
          target: { ...def.target, display: "-" },
          results: childResults
        });
      });
    }
  });

  return {
    generatedAt: "2026-10-25T11:30:00Z",
    source: "GEROT / KPIs Performance MG4 (Sintético Mock)",
    cacheHit: true,
    periods: periods,
    rows: rows
  };
}

export const mockKpiPayload: KpiPayload = generateMockPayload();
