import { LIVE_CACHE_TTL_MS, getGerotSpreadsheetId, readSheetValues } from "./data-source";
import { withComputedCache } from "./computed-cache";

const ACOMPANHAMENTO_RANGE = "A:AZ";

export type TesteKpiRow = {
  id: string;
  cluster: string;
  frente: string;
  pilar: string;
  kpi: string;
  abertura: string;
  target: string;
  valores: Record<string, string>;
};

export type TesteData = {
  titulo: string;
  descricao: string;
  atualizadoEm: string;
  periodos: string[];
  filtros: {
    clusters: string[];
    frentes: string[];
    pilares: string[];
    kpis: string[];
    aberturas: string[];
    periodos: string[];
  };
  linhas: TesteKpiRow[];
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: string) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).filter((value) => value !== "-"))).sort((a, b) => a.localeCompare(b));
}

function findHeaderIndex(values: string[][]) {
  return values.findIndex((row) => {
    const normalized = row.map(normalize);
    return normalized.includes("CLUSTER") && (normalized.includes("KPIS") || normalized.includes("KPI"));
  });
}

function findColumn(headers: string[], names: string[]) {
  const normalizedNames = names.map(normalize);
  return headers.findIndex((header) => normalizedNames.includes(normalize(header)));
}

function buildEmptyTeste(): TesteData {
  return {
    titulo: "Teste",
    descricao: "Acompanhamento GEROT - MG4",
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    periodos: [],
    filtros: {
      clusters: [],
      frentes: [],
      pilares: [],
      kpis: [],
      aberturas: [],
      periodos: []
    },
    linhas: []
  };
}

export function mapAcompanhamentoValues(values: string[][]): TesteData {
  const empty = buildEmptyTeste();
  const headerIndex = findHeaderIndex(values);
  if (headerIndex < 0) return empty;

  const headers = values[headerIndex].map(text);
  const clusterIndex = findColumn(headers, ["Cluster"]);
  const frenteIndex = findColumn(headers, ["Frente"]);
  const pilarIndex = findColumn(headers, ["Pilar"]);
  const kpiIndex = findColumn(headers, ["KPIs", "KPI"]);
  const aberturaIndex = findColumn(headers, ["Abertura 1", "Abertura"]);
  const targetIndex = findColumn(headers, ["TARGET", "Target", "Meta"]);
  const fixedIndexes = [clusterIndex, frenteIndex, pilarIndex, kpiIndex, aberturaIndex, targetIndex].filter((index) => index >= 0);
  const firstPeriodIndex = fixedIndexes.length ? Math.max(...fixedIndexes) + 1 : 0;
  const periodos = headers
    .slice(firstPeriodIndex)
    .map(text)
    .filter(Boolean);

  let currentCluster = "";
  let currentFrente = "";
  let currentPilar = "";

  const linhas = values.slice(headerIndex + 1).flatMap((row, rowOffset) => {
    const cluster = clusterIndex >= 0 ? text(row[clusterIndex]) : "";
    const frente = frenteIndex >= 0 ? text(row[frenteIndex]) : "";
    const pilar = pilarIndex >= 0 ? text(row[pilarIndex]) : "";
    const kpi = kpiIndex >= 0 ? text(row[kpiIndex]) : "";
    const abertura = aberturaIndex >= 0 ? text(row[aberturaIndex]) : "";
    const target = targetIndex >= 0 ? text(row[targetIndex]) : "";

    if (cluster) currentCluster = cluster;
    if (frente) currentFrente = frente;
    if (pilar) currentPilar = pilar;

    if (!kpi && !row.some((cell) => text(cell))) return [];

    const valores = periodos.reduce<Record<string, string>>((acc, periodo, index) => {
      acc[periodo] = text(row[firstPeriodIndex + index]);
      return acc;
    }, {});

    return [
      {
        id: `${headerIndex + rowOffset + 2}-${currentCluster}-${kpi}`,
        cluster: currentCluster || "-",
        frente: currentFrente || "-",
        pilar: currentPilar || "-",
        kpi: kpi || "-",
        abertura: abertura || "-",
        target: target || "-",
        valores
      }
    ];
  });

  return {
    ...empty,
    periodos,
    filtros: {
      clusters: uniq(linhas.map((row) => row.cluster)),
      frentes: uniq(linhas.map((row) => row.frente)),
      pilares: uniq(linhas.map((row) => row.pilar)),
      kpis: uniq(linhas.map((row) => row.kpi)),
      aberturas: uniq(linhas.map((row) => row.abertura)),
      periodos
    },
    linhas
  };
}

export function generateMockTesteData(): TesteData {
  const periodos = ["W38", "W39", "W40", "W41", "W42", "W43"];
  const rows: TesteKpiRow[] = [
    {
      id: "1-INBOUND-AWT",
      cluster: "Inbound",
      frente: "Lead Time",
      pilar: "Speed",
      kpi: "AWT Inbound (h)",
      abertura: "Geral",
      target: "< 4.60h",
      valores: { W38: "4.12", W39: "4.35", W40: "3.98", W41: "4.42", W42: "4.10", W43: "3.95" }
    },
    {
      id: "2-INBOUND-DESC",
      cluster: "Inbound",
      frente: "Produtividade",
      pilar: "Cost",
      kpi: "Tempo Médio Descarga (h)",
      abertura: "Carreta",
      target: "< 1.00h",
      valores: { W38: "0.85", W39: "0.92", W40: "0.88", W41: "0.90", W42: "0.84", W43: "0.82" }
    },
    {
      id: "3-PACKING-EFF",
      cluster: "Packing",
      frente: "Eficiência",
      pilar: "Speed",
      kpi: "Eficiência de Packing (%)",
      abertura: "Esteiras 01-06",
      target: "> 95.0%",
      valores: { W38: "96.4%", W39: "97.1%", W40: "95.8%", W41: "98.2%", W42: "96.9%", W43: "97.5%" }
    },
    {
      id: "4-OUTBOUND-CPT",
      cluster: "Outbound",
      frente: "SLA",
      pilar: "Quality",
      kpi: "Aderência ao CPT (%)",
      abertura: "Linehaul",
      target: "> 98.0%",
      valores: { W38: "98.8%", W39: "98.5%", W40: "99.1%", W41: "98.7%", W42: "99.2%", W43: "99.0%" }
    },
    {
      id: "5-PEOPLE-ABS",
      cluster: "People",
      frente: "Assiduidade",
      pilar: "Culture",
      kpi: "Absenteísmo Operacional (%)",
      abertura: "Turnos T1/T2/T3",
      target: "< 3.5%",
      valores: { W38: "2.8%", W39: "3.1%", W40: "2.9%", W41: "3.2%", W42: "2.7%", W43: "2.5%" }
    },
    {
      id: "6-STAGE-OCC",
      cluster: "Stage Out",
      frente: "Ocupação",
      pilar: "Cost",
      kpi: "Giro de Ruas de Stage",
      abertura: "Ruas A/B/C",
      target: "< 24h",
      valores: { W38: "18.2h", W39: "19.5h", W40: "17.8h", W41: "18.0h", W42: "16.9h", W43: "17.2h" }
    }
  ];

  return {
    titulo: "Acompanhamento de Indicadores",
    descricao: "Controle Executivo de Metas e Faróis Operacionais",
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    periodos,
    filtros: {
      clusters: uniq(rows.map((r) => r.cluster)),
      frentes: uniq(rows.map((r) => r.frente)),
      pilares: uniq(rows.map((r) => r.pilar)),
      kpis: uniq(rows.map((r) => r.kpi)),
      aberturas: uniq(rows.map((r) => r.abertura)),
      periodos
    },
    linhas: rows
  };
}

export async function getTesteData(options?: { forceRefresh?: boolean }): Promise<TesteData> {
  try {
    const spreadsheetId = getGerotSpreadsheetId();
    if (!spreadsheetId) return generateMockTesteData();
    return withComputedCache(
      {
        key: `gerot-acompanhamento:v1:${spreadsheetId}`,
        label: "Acompanhamento GEROT",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const values = await readSheetValues("Acompanhamento", ACOMPANHAMENTO_RANGE, spreadsheetId, {
          ttlMs: LIVE_CACHE_TTL_MS,
          forceRefresh: options?.forceRefresh,
          cacheLabel: "Acompanhamento"
        });
        const mapped = mapAcompanhamentoValues(values);
        return mapped.linhas.length ? mapped : generateMockTesteData();
      }
    );
  } catch (error) {
    return generateMockTesteData();
  }
}
