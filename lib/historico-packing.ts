// AI maintenance map: source mapping, filters and aggregations for Historico
// Prod Esteiras. Its UI lives in components/historico-packing-page.tsx.
import { HISTORICO_CACHE_TTL_MS, getHistoricoPackingSpreadsheetId, readSheetRows } from "./data-source";

const OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);
const FIFO_ORDER = ["0-1h", "1-2h", "2-6h", "6-12h", "12-24h", "24-48h", "48-72h", ">72h"];
const SINERGIA_HOURS = [6, 14, 22];
const HISTORICO_PACKING_RANGE = "A:N";

export type HistoricoPackingFilters = {
  inicio?: string;
  fim?: string;
  turno?: string;
  esteira?: string;
  unitizador?: string;
  perfil?: string;
  hora?: string;
  fifo?: string;
};

export type HistoricoPackingRow = {
  data: string;
  hora: number;
  horaLabel: string;
  turno: "T1" | "T2" | "T3";
  semana: string;
  esteira: string;
  unitizador: string;
  perfil: string;
  fifo: string;
  real: number;
  meta: number;
  metaKey: string;
};

export type HistoricoChartRow = {
  label: string;
  real: number;
  meta: number;
  eficiencia: number;
  gap?: number;
};

export type HistoricoDistributionRow = {
  label: string;
  real: number;
  percentual: number;
};

export type HistoricoKpiCard = {
  label: string;
  real: number;
  meta: number;
  eficiencia: number;
};

export type HistoricoPackingData = {
  atualizadoEm: string;
  cacheWarnings?: string[];
  erro?: {
    etapa: "variavel" | "permissao" | "leitura";
    mensagem: string;
    detalhe?: string;
  };
  filtros: {
    datas: string[];
    turnos: string[];
    esteiras: string[];
    unitizadores: string[];
    perfis: string[];
    horas: string[];
    fifos: string[];
  };
  filtroAplicado: Required<HistoricoPackingFilters>;
  cards: HistoricoKpiCard[];
  kpis: {
    volumeTotal: number;
    metaOperacao: number;
    eficiencia: number;
    mediaDiaria: number;
    dias: number;
  };
  esteira: HistoricoChartRow[];
  turno: HistoricoChartRow[];
  semana: HistoricoChartRow[];
  dia: HistoricoChartRow[];
  sinergia: HistoricoChartRow[];
  horas: Array<HistoricoChartRow & { gap: number }>;
  unitizador: HistoricoDistributionRow[];
  perfil: HistoricoDistributionRow[];
  fifo: HistoricoDistributionRow[];
};

type PreparedHistoricoPacking = {
  rows: HistoricoPackingRow[];
  filtros: HistoricoPackingData["filtros"];
};

const preparedRowsCache = new WeakMap<Record<string, string>[], PreparedHistoricoPacking>();
const aggregatedDataCache = new WeakMap<Record<string, string>[], Map<string, HistoricoPackingData>>();

function normalizeHeader(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeRawRow(row: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()])
  );
}

function pick(row: Record<string, string>, ...columns: string[]) {
  for (const column of columns) {
    const value = row[normalizeHeader(column)];
    if (value) return value;
  }
  return "";
}

function numberValue(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/%$/, "");
  if (!raw) return 0;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(raw)
      ? raw.replace(/\./g, "")
      : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDateKey(value: string) {
  const textValue = String(value ?? "").trim();
  const iso = textValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const br = textValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;

  return textValue;
}

function saoPauloDateKey(offsetDays = 0) {
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function defaultHistoricoDate() {
  return saoPauloDateKey(-1);
}

function hourNumber(value: string) {
  const text = String(value ?? "").trim();
  const clock = text.match(/^(\d{1,2})(?::\d{2})?/);
  const parsed = clock ? Number(clock[1]) : Number(text.replace("h", ""));
  return Number.isFinite(parsed) ? ((parsed % 24) + 24) % 24 : -1;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function turnFromHour(hour: number): "T1" | "T2" | "T3" {
  if (hour >= 6 && hour < 14) return "T1";
  if (hour >= 14 && hour < 22) return "T2";
  return "T3";
}

function normalizeTurno(value: string, hour: number): "T1" | "T2" | "T3" {
  const turno = value.trim().toUpperCase();
  if (turno === "T1" || turno === "T2" || turno === "T3") return turno;
  return turnFromHour(hour);
}

function isoWeek(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return `W${String(Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}

function normalizeWeek(value: string, dateKey: string) {
  const text = value.trim().toUpperCase();
  if (!text) return isoWeek(dateKey);
  const number = text.match(/\d+/)?.[0];
  return number ? `W${number.padStart(2, "0")}` : text;
}

function normalizeLabel(value: string, fallback = "N/A") {
  const text = value.trim();
  return text || fallback;
}

function normalizeFifo(value: string) {
  const text = value.trim();
  if (!text) return "N/A";
  const compact = text
    .replace(/entre/gi, "")
    .replace(/horas?/gi, "h")
    .replace(/\s+/g, "")
    .replace(/e/gi, "-");
  const mapped = compact.match(/(\d+)-(\d+)h/i);
  if (mapped) return `${mapped[1]}-${mapped[2]}h`;
  const single = compact.match(/(\d+)h/i);
  return single ? `${single[1]}h` : text;
}

function efficiency(real: number, meta: number) {
  return meta > 0 ? (real / meta) * 100 : 0;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).filter((value) => value !== "N/A"))).sort((a, b) => a.localeCompare(b));
}

function aggregateBy(rows: HistoricoPackingRow[], keyFn: (row: HistoricoPackingRow) => string, order?: string[]) {
  const map = new Map<string, { real: number; meta: number }>();
  const metaKeys = new Map<string, Set<string>>();
  rows.forEach((row) => {
    const key = keyFn(row);
    const current = map.get(key) ?? { real: 0, meta: 0 };
    const seen = metaKeys.get(key) ?? new Set<string>();
    current.real += row.real;
    if (!seen.has(row.metaKey)) {
      current.meta += row.meta;
      seen.add(row.metaKey);
      metaKeys.set(key, seen);
    }
    map.set(key, current);
  });

  const labels = order ?? Array.from(map.keys()).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  return labels.map((label) => {
    const item = map.get(label) ?? { real: 0, meta: 0 };
    return { label, real: item.real, meta: item.meta, eficiencia: efficiency(item.real, item.meta) };
  });
}

function distribution(rows: HistoricoPackingRow[], keyFn: (row: HistoricoPackingRow) => string, order?: string[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + row.real);
  });
  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0);
  const labels = order ?? Array.from(map.keys()).sort((a, b) => (map.get(b) ?? 0) - (map.get(a) ?? 0));
  return labels
    .filter((label) => map.has(label) || order)
    .map((label) => {
      const real = map.get(label) ?? 0;
      return { label, real, percentual: total > 0 ? (real / total) * 100 : 0 };
    });
}

function mapRow(row: Record<string, string>): HistoricoPackingRow {
  const data = normalizeDateKey(pick(row, "cutoff_data", "cutoff data", "data", "Data"));
  const hora = hourNumber(pick(row, "Hora", "hora"));
  const turno = normalizeTurno(pick(row, "TURNO", "turno"), hora);
  const esteira = normalizeLabel(pick(row, "nome_esteira", "esteira", "nome esteira"));

  return {
    data,
    hora,
    horaLabel: hourLabel(hora),
    turno,
    semana: normalizeWeek(pick(row, "SEMANA", "Semana", "semana"), data),
    esteira,
    unitizador: normalizeLabel(pick(row, "pack_name", "pack name", "unitizador")).toUpperCase(),
    perfil: normalizeLabel(pick(row, "parcel_size", "parcel size", "perfil")).toUpperCase(),
    fifo: normalizeFifo(pick(row, "range_bwt", "range bwt", "fifo")),
    real: numberValue(pick(row, "contagem_shipment_id", "contagem shipment id", "real", "volume")),
    meta: numberValue(pick(row, "Meta", "META", "meta", "META HORA", "Meta Hora")),
    metaKey: `${data}|${hora}|${esteira}`
  };
}

function prepareRows(rawRows: Record<string, string>[]): PreparedHistoricoPacking {
  const cached = preparedRowsCache.get(rawRows);
  if (cached) return cached;

  const rows = rawRows
    .map((row) => mapRow(normalizeRawRow(row)))
    .filter((row) => row.data && row.hora >= 0 && row.esteira !== "N/A");

  const prepared: PreparedHistoricoPacking = {
    rows,
    filtros: {
      datas: uniq(rows.map((row) => row.data)),
      turnos: ["T1", "T2", "T3"],
      esteiras: uniq(rows.map((row) => row.esteira)),
      unitizadores: uniq(rows.map((row) => row.unitizador)),
      perfis: uniq(rows.map((row) => row.perfil)),
      horas: OPERATION_HOURS.map(hourLabel),
      fifos: uniq(rows.map((row) => row.fifo))
    }
  };

  preparedRowsCache.set(rawRows, prepared);
  return prepared;
}

function filterCacheKey(filters: Required<HistoricoPackingFilters>) {
  return [
    filters.inicio,
    filters.fim,
    filters.turno,
    filters.esteira,
    filters.unitizador,
    filters.perfil,
    filters.hora,
    filters.fifo
  ].join("|");
}

function readAggregatedData(rawRows: Record<string, string>[], key: string) {
  return aggregatedDataCache.get(rawRows)?.get(key);
}

function writeAggregatedData(
  rawRows: Record<string, string>[],
  key: string,
  data: HistoricoPackingData
) {
  const cache = aggregatedDataCache.get(rawRows) ?? new Map<string, HistoricoPackingData>();
  if (cache.size >= 48 && !cache.has(key)) cache.clear();
  cache.set(key, data);
  aggregatedDataCache.set(rawRows, cache);
}

function applyFilters(rows: HistoricoPackingRow[], filters: Required<HistoricoPackingFilters>) {
  return rows.filter((row) => {
    return (
      (!filters.inicio || row.data >= filters.inicio) &&
      (!filters.fim || row.data <= filters.fim) &&
      (!filters.turno || row.turno === filters.turno) &&
      (!filters.esteira || row.esteira === filters.esteira) &&
      (!filters.unitizador || row.unitizador === filters.unitizador) &&
      (!filters.perfil || row.perfil === filters.perfil) &&
      (!filters.hora || row.horaLabel === filters.hora) &&
      (!filters.fifo || row.fifo === filters.fifo)
    );
  });
}

function makeCards(rows: HistoricoPackingRow[]) {
  const geral = aggregateBy(rows, () => "Geral", ["Geral"])[0];
  const turnos = aggregateBy(rows, (row) => row.turno, ["T1", "T2", "T3"]);
  return [
    { label: "Geral", real: geral.real, meta: geral.meta, eficiencia: geral.eficiencia },
    ...turnos.map((row) => ({ label: row.label, real: row.real, meta: row.meta, eficiencia: row.eficiencia }))
  ];
}

export function emptyHistoricoPackingData(
  filters: HistoricoPackingFilters = {},
  erro?: HistoricoPackingData["erro"]
): HistoricoPackingData {
  const defaultDate = defaultHistoricoDate();
  const filtroAplicado: Required<HistoricoPackingFilters> = {
    inicio: filters.inicio || defaultDate,
    fim: filters.fim || defaultDate,
    turno: filters.turno || "",
    esteira: filters.esteira || "",
    unitizador: filters.unitizador || "",
    perfil: filters.perfil || "",
    hora: filters.hora || "",
    fifo: filters.fifo || ""
  };

  return {
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    erro,
    filtros: { datas: [], turnos: ["T1", "T2", "T3"], esteiras: [], unitizadores: [], perfis: [], horas: OPERATION_HOURS.map(hourLabel), fifos: [] },
    filtroAplicado,
    cards: makeCards([]),
    kpis: { volumeTotal: 0, metaOperacao: 0, eficiencia: 0, mediaDiaria: 0, dias: 0 },
    esteira: [],
    turno: aggregateBy([], (row) => row.turno, ["T1", "T2", "T3"]),
    semana: [],
    dia: [],
    sinergia: aggregateBy([], (row) => row.horaLabel, SINERGIA_HOURS.map(hourLabel)),
    horas: OPERATION_HOURS.map((hour) => ({ label: hourLabel(hour), real: 0, meta: 0, eficiencia: 0, gap: 0 })),
    unitizador: [],
    perfil: [],
    fifo: FIFO_ORDER.map((label) => ({ label, real: 0, percentual: 0 }))
  };
}

export function generateMockHistoricoPackingRawRows(): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const unitizadores = ["SACA", "SCUTTLE"];
  const perfis = ["P", "M", "G", "BULKY"];
  const fifos = ["0-1h", "1-2h", "2-6h", "6-12h", "12-24h", "24-48h"];

  for (let offset = 0; offset >= -6; offset--) {
    const dateStr = saoPauloDateKey(offset);
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayNumber = dateObj.getUTCDay() || 7;
    dateObj.setUTCDate(dateObj.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 1));
    const semana = `W${String(Math.ceil(((dateObj.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`;

    for (let h = 0; h < 24; h += 2) {
      const turno = turnFromHour(h);
      for (let e = 1; e <= 6; e++) {
        const esteira = `ESTEIRA 0${e}`;
        const u = unitizadores[(h + e) % unitizadores.length];
        const p = perfis[(h + e * 2) % perfis.length];
        const f = fifos[(h + e * 3) % fifos.length];
        const seed = (Math.abs(offset) * 100 + h * 10 + e) % 17;
        const real = 240 + seed * 28 + e * 15;
        const meta = 320 + e * 20;

        rows.push({
          cutoff_data: dateStr,
          Hora: `${h}h`,
          TURNO: turno,
          SEMANA: semana,
          nome_esteira: esteira,
          pack_name: u,
          parcel_size: p,
          range_bwt: f,
          contagem_shipment_id: String(real),
          Meta: String(meta)
        });
      }
    }
  }

  return rows;
}

export async function getHistoricoPackingData(
  filters: HistoricoPackingFilters = {},
  options?: { forceRefresh?: boolean }
): Promise<HistoricoPackingData> {
  const spreadsheetId = getHistoricoPackingSpreadsheetId();

  let rawRows: Record<string, string>[];
  if (!spreadsheetId) {
    rawRows = generateMockHistoricoPackingRawRows();
  } else {
    try {
      rawRows = await readSheetRows("hist_prod", HISTORICO_PACKING_RANGE, spreadsheetId, {
        ttlMs: HISTORICO_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh,
        cacheLabel: "Historico Prod Esteiras"
      });
      if (rawRows.length === 0) {
        rawRows = generateMockHistoricoPackingRawRows();
      }
    } catch {
      rawRows = generateMockHistoricoPackingRawRows();
    }
  }

  const prepared = prepareRows(rawRows);
  const { rows, filtros } = prepared;
  const datas = filtros.datas;
  const defaultDate = defaultHistoricoDate();
  const filtroAplicado: Required<HistoricoPackingFilters> = {
    inicio: filters.inicio || defaultDate || datas[0] || "",
    fim: filters.fim || defaultDate || datas[datas.length - 1] || "",
    turno: filters.turno || "",
    esteira: filters.esteira || "",
    unitizador: filters.unitizador || "",
    perfil: filters.perfil || "",
    hora: filters.hora || "",
    fifo: filters.fifo || ""
  };

  const aggregationKey = filterCacheKey(filtroAplicado);
  const cachedData = readAggregatedData(rawRows, aggregationKey);
  if (cachedData) return cachedData;

  const filteredRows = applyFilters(rows, filtroAplicado);
  const total = aggregateBy(filteredRows, () => "Total", ["Total"])[0];
  const real = total.real;
  const meta = total.meta;
  const days = new Set(filteredRows.map((row) => row.data)).size;
  const horas = aggregateBy(filteredRows, (row) => row.horaLabel, OPERATION_HOURS.map(hourLabel)).map((row) => ({
    ...row,
    gap: row.real - row.meta
  }));

  const data: HistoricoPackingData = {
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    filtros,
    filtroAplicado,
    cards: makeCards(filteredRows),
    kpis: {
      volumeTotal: real,
      metaOperacao: meta,
      eficiencia: efficiency(real, meta),
      mediaDiaria: days > 0 ? real / days : 0,
      dias: days
    },
    esteira: aggregateBy(filteredRows, (row) => row.esteira),
    turno: aggregateBy(filteredRows, (row) => row.turno, ["T1", "T2", "T3"]),
    semana: aggregateBy(filteredRows, (row) => row.semana),
    dia: aggregateBy(filteredRows, (row) => row.data),
    sinergia: aggregateBy(filteredRows, (row) => row.horaLabel, SINERGIA_HOURS.map(hourLabel)),
    horas,
    unitizador: distribution(filteredRows, (row) => row.unitizador),
    perfil: distribution(filteredRows, (row) => row.perfil),
    fifo: distribution(filteredRows, (row) => row.fifo, FIFO_ORDER)
  };

  writeAggregatedData(rawRows, aggregationKey, data);
  return data;
}
