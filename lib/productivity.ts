// AI maintenance map: server mapping and calculations for Live Prod HC and
// Live Prod Esteiras. Both pages read the raw sheet from the productivity ID.
import { LIVE_CACHE_TTL_MS, getNewPageSpreadsheetId, readSheetRows } from "./data-source";
import { withComputedCache } from "./computed-cache";
import type { ProductivityBelt, ProductivityDashboard, ProductivityHour, ProductivityRawRow } from "./types";

const PRODUCTIVITY_RAW_RANGE = "A:Q";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function pick(row: Record<string, string>, ...columns: string[]) {
  for (const column of columns) {
    const value = text(row[column]);
    if (value) return value;
  }

  const entries = Object.entries(row);
  for (const column of columns) {
    const target = normalizeColumnName(column);
    const match = entries.find(([key]) => normalizeColumnName(key) === target);
    const value = match ? text(match[1]) : "";
    if (value) return value;
  }

  return "";
}

function normalizeColumnName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function numberValue(value: unknown) {
  const raw = text(value);
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(raw)
      ? raw.replace(/\./g, "")
      : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function efficiency(real: number, meta: number) {
  return meta > 0 ? Math.round((real / meta) * 1000) / 10 : 0;
}

const OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);

function hourNumber(value: string) {
  const parsed = Number(text(value).replace("h", ""));
  return Number.isFinite(parsed) ? parsed : -1;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function saoPauloNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    dateKey: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour"))
  };
}

function saoPauloTodayKey() {
  return saoPauloNowParts().dateKey;
}

function normalizeDateKey(value: string) {
  const textValue = text(value);
  const iso = textValue.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const br = textValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;

  return textValue;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function operationalDateKey(row: ProductivityRawRow) {
  const dateKey = normalizeDateKey(row.cutoffData);
  return hourNumber(row.hora) < 6 ? addDays(dateKey, -1) : dateKey;
}

function operationalHourIndex(hour: number) {
  return OPERATION_HOURS.indexOf(hour);
}

function currentOperationalDateAndIndex() {
  const now = saoPauloNowParts();
  const currentHour = Number.isFinite(now.hour) ? now.hour : 0;
  return {
    dateKey: currentHour < 6 ? addDays(now.dateKey, -1) : now.dateKey,
    hourIndex: operationalHourIndex(currentHour)
  };
}

function isMetaAteMomento(row: ProductivityRawRow) {
  const now = currentOperationalDateAndIndex();
  const rowDate = operationalDateKey(row);
  const rowIndex = operationalHourIndex(hourNumber(row.hora));

  if (rowDate < now.dateKey) return true;
  if (rowDate > now.dateKey) return false;
  return rowIndex >= 0 && rowIndex <= now.hourIndex;
}

function topEntries(map: Map<string, number>, limit = 5) {
  return Array.from(map.entries())
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, limit);
}

function mapRawRow(row: Record<string, string>): ProductivityRawRow {
  const cutoffData = pick(row, "cutoff_data", "cutoff data", "Cutoff Data", "DATA", "Data", "data", "Data Operacional");
  return {
    opsId: pick(row, "Opsid", "opsid", "Ops ID"),
    nome: pick(row, "Nome", "nome", "Operador", "operador"),
    estacao: pick(row, "Esta\u00e7\u00e3o", "Estacao", "estacao", "station", "Station", "Estacao Atual"),
    atividade: pick(row, "Ativ", "Atividade", "atividade"),
    horasTrabalhadas: numberValue(pick(row, "Horas", "horas")),
    hin: pick(row, "Hin", "hin", "HIN"),
    hout: pick(row, "Hout", "hout", "HOUT"),
    cutoffData: cutoffData || saoPauloTodayKey(),
    hora: pick(row, "Hora", "hora", "HORA", "Hour", "hour"),
    esteira: pick(row, "nome_esteira", "esteira", "nome esteira", "Esteira", "ESTEIRA", "Linha", "line"),
    shipments: numberValue(
      pick(
        row,
        "contagem_shipment_id",
        "contagem shipment id",
        "contagem_shipment",
        "shipments",
        "shipment_id",
        "Pacotes",
        "pacotes",
        "Packed",
        "packed",
        "Packing",
        "packing",
        "PACKING",
        "Volume",
        "volume",
        "Produzido",
        "produzido",
        "Real",
        "REAL",
        "Quantidade",
        "QTD"
      )
    ),
    turno: pick(row, "TURNO", "turno"),
    metaHora: numberValue(
      pick(
        row,
        "META HORA",
        "meta hora",
        "Meta Hora",
        "META AJUSTADA",
        "meta ajustada",
        "Meta da Esteira",
        "meta da esteira",
        "META ESTEIRA",
        "meta_esteira",
        "Meta",
        "META"
      )
    ),
    key: pick(row, "KEY", "key")
  };
}

function buildHourRows(rows: ProductivityRawRow[]): ProductivityHour[] {
  const byHour = new Map<number, { real: number; metaKeys: Map<string, number> }>();

  rows.forEach((row) => {
    const hour = hourNumber(row.hora);
    if (hour < 0) return;
    const current = byHour.get(hour) ?? { real: 0, metaKeys: new Map<string, number>() };
    current.real += row.shipments;
    const metaKey = `${row.key || row.esteira}-${operationalDateKey(row)}-${hour}`;
    current.metaKeys.set(metaKey, Math.max(current.metaKeys.get(metaKey) ?? 0, row.metaHora));
    byHour.set(hour, current);
  });

  return OPERATION_HOURS.map((hour) => {
      const item = byHour.get(hour) ?? { real: 0, metaKeys: new Map<string, number>() };
      const meta = Array.from(item.metaKeys.values()).reduce((sum, value) => sum + value, 0);
      return {
        hora: hourLabel(hour),
        real: item.real,
        meta,
        gap: item.real - meta,
        eficiencia: efficiency(item.real, meta)
      };
    });
}

function buildBeltRows(rows: ProductivityRawRow[]): ProductivityBelt[] {
  const byBelt = new Map<
    string,
    {
      rows: ProductivityRawRow[];
      metaAtualKeys: Map<string, number>;
      metaTurnoKeys: Map<string, number>;
      atividadeMap: Map<string, number>;
      operadorMap: Map<string, number>;
      estacaoMap: Map<string, number>;
    }
  >();

  rows.forEach((row) => {
    const current =
      byBelt.get(row.esteira) ??
      {
        rows: [],
        metaAtualKeys: new Map<string, number>(),
        metaTurnoKeys: new Map<string, number>(),
        atividadeMap: new Map<string, number>(),
        operadorMap: new Map<string, number>(),
        estacaoMap: new Map<string, number>()
      };

    current.rows.push(row);
    const hour = hourNumber(row.hora);
    const hourKey = `${row.key || row.esteira}-${operationalDateKey(row)}-${hour}`;
    if (isMetaAteMomento(row)) {
      current.metaAtualKeys.set(hourKey, Math.max(current.metaAtualKeys.get(hourKey) ?? 0, row.metaHora));
    }
    current.metaTurnoKeys.set(hourKey, Math.max(current.metaTurnoKeys.get(hourKey) ?? 0, row.metaHora));
    current.atividadeMap.set(row.atividade || "N/A", (current.atividadeMap.get(row.atividade || "N/A") ?? 0) + row.shipments);
    current.operadorMap.set(row.nome || "N/A", (current.operadorMap.get(row.nome || "N/A") ?? 0) + row.shipments);
    current.estacaoMap.set(row.estacao || "N/A", (current.estacaoMap.get(row.estacao || "N/A") ?? 0) + row.shipments);
    byBelt.set(row.esteira, current);
  });

  return Array.from(byBelt.entries())
    .map(([esteira, item]) => {
      const real = item.rows.reduce((sum, row) => sum + row.shipments, 0);
      const metaAtual = Array.from(item.metaAtualKeys.values()).reduce((sum, value) => sum + value, 0);
      const metaTurno = Array.from(item.metaTurnoKeys.values()).reduce((sum, value) => sum + value, 0);
      return {
        esteira,
        real,
        metaAtual,
        metaTurno,
        eficiencia: efficiency(real, metaTurno),
        horas: buildHourRows(item.rows),
        atividades: topEntries(item.atividadeMap),
        operadores: topEntries(item.operadorMap),
        estacoes: topEntries(item.estacaoMap)
      };
    })
    .sort((a, b) => b.real - a.real);
}

function buildProductivity(rows: ProductivityRawRow[]): ProductivityDashboard {
  const horas = buildHourRows(rows);
  const esteiras = buildBeltRows(rows);
  const real = rows.reduce((sum, row) => sum + row.shipments, 0);
  const metaAtualMap = new Map<string, number>();
  rows.forEach((row) => {
    if (!isMetaAteMomento(row)) return;
    const hour = hourNumber(row.hora);
    const hourKey = `${row.key || row.esteira}-${operationalDateKey(row)}-${hour}`;
    metaAtualMap.set(hourKey, Math.max(metaAtualMap.get(hourKey) ?? 0, row.metaHora));
  });
  const metaAtual = Array.from(metaAtualMap.values()).reduce((sum, value) => sum + value, 0);
  const metaTurno = esteiras.reduce((sum, row) => sum + row.metaTurno, 0);

  return {
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    linhas: rows,
    filtros: {
      datas: uniq(rows.map((row) => operationalDateKey(row))),
      horas: OPERATION_HOURS.map(hourLabel),
      turnos: uniq(rows.map((row) => row.turno)),
      esteiras: uniq(rows.map((row) => row.esteira)),
      atividades: uniq(rows.map((row) => row.atividade)),
      operadores: uniq(rows.map((row) => row.nome)),
      estacoes: uniq(rows.map((row) => row.estacao))
    },
    resumo: {
      real,
      metaAtual,
      metaTurno,
      eficiencia: efficiency(real, metaTurno),
      esteiras: esteiras.length
    },
    horas,
    esteiras
  };
}

function generateMockProductivityRows(): ProductivityRawRow[] {
  const today = saoPauloTodayKey();
  const esteiras = ["ESTEIRA 01", "ESTEIRA 02", "ESTEIRA 03", "ESTEIRA 04", "PACKING MANUAL A", "PACKING MANUAL B"];
  const operators = [
    { id: "OP101", nome: "CARLOS MENDES" },
    { id: "OP102", nome: "MARIANA ROCHA" },
    { id: "OP103", nome: "LUCAS BARRETO" },
    { id: "OP104", nome: "FERNANDO SOUZA" },
    { id: "OP105", nome: "JULIANA PRADO" },
    { id: "OP106", nome: "RODRIGO RAMOS" },
    { id: "OP107", nome: "BEATRIZ LIMA" },
    { id: "OP108", nome: "ALEXANDRE NEVES" }
  ];

  const rows: ProductivityRawRow[] = [];
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  esteiras.forEach((esteira, eIdx) => {
    const metaBase = esteira.includes("PACKING") ? 280 : 380;
    hours.forEach((h) => {
      const turno = h < 14 ? "T1" : "T2";
      const op = operators[(eIdx + h) % operators.length];
      const shipments = Math.round(metaBase * (0.92 + ((eIdx * 7 + h * 13) % 22) / 100));

      rows.push({
        opsId: op.id,
        nome: op.nome,
        estacao: `STA-0${eIdx + 1}`,
        atividade: esteira.includes("PACKING") ? "Packing" : "Sorting",
        horasTrabalhadas: 1,
        hin: `${String(h).padStart(2, "0")}:00`,
        hout: `${String(h + 1).padStart(2, "0")}:00`,
        cutoffData: today,
        hora: `${String(h).padStart(2, "0")}h`,
        esteira,
        shipments,
        turno,
        metaHora: metaBase,
        key: `${esteira}-${h}`
      });
    });
  });

  return rows;
}

export async function getProductivityReal(options?: { forceRefresh?: boolean }): Promise<ProductivityDashboard> {
  const spreadsheetId = getNewPageSpreadsheetId();
  if (!spreadsheetId) {
    return buildProductivity(generateMockProductivityRows());
  }
  try {
    return withComputedCache(
      {
        key: `productivity:v1:${spreadsheetId || "mock"}`,
        label: "Live Prod Esteiras",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rows = await readSheetRows("raw", PRODUCTIVITY_RAW_RANGE, spreadsheetId, {
          ttlMs: LIVE_CACHE_TTL_MS,
          forceRefresh: options?.forceRefresh,
          cacheLabel: "Live Prod Esteiras"
        });
        const mapped = rows.map(mapRawRow).filter((row) => row.esteira);
        return buildProductivity(mapped.length ? mapped : generateMockProductivityRows());
      }
    );
  } catch (error) {
    console.error("Erro ao carregar produtividade:", error);
    return buildProductivity(generateMockProductivityRows());
  }
}

