// AI maintenance map: source mapping and KPIs for Historico LH Outbound.
// UI is rendered by components/historico-outbound-page.tsx.
import { HISTORICO_CACHE_TTL_MS, getHistoricoOutboundSpreadsheetId, readSheetRows } from "./data-source";
import { withComputedCache } from "./computed-cache";

const OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);
const HISTORICO_OUTBOUND_RANGE = "A:BR";

export type HistoricoOutboundRow = {
  dataExpedicao: string;
  dataOperacional?: string;
  dataPlanejada: string;
  horaExpedicao: number;
  horaLabel: string;
  turno: "T1" | "T2" | "T3";
  statusAgrupado: string;
  solicitationBy: string;
  tripNumber: string;
  origin: string;
  destino: string;
  vehicleNumber: string;
  usedVehicle: string;
  totalOrders: number;
  ordersSaca: number;
  ordersScuttle: number;
  ordersPallet: number;
  ordersOthers: number;
  toSaca: number;
  toScuttle: number;
  toPallet: number;
  toOthers: number;
  toTotal: number;
  saidaOrigem: string;
  chegadaPlanejadaOrigem: string;
  partidaPlanejadaOrigem: string;
  chegadaRealizadaOrigem: string;
  partidaRealizadaOrigem: string;
  chegadaPlanejadaDestino: string;
  chegadaRealizadaDestino: string;
  unsealDatetime: string;
  unloadedDatetime: string;
  latestUpdate: string;
  statusCpt: string;
  statusEtaDestino: string;
  tempoDescargaHoras: number;
  tempoDescargaAjustadoHoras: number;
  classificacaoStatusViagem: string;
  contagemTosSacas: number;
  contagemTosScuttleOrPallet: number;
  contagemIdsSacas: number;
  contagemIdsScuttleOrPallets: number;
  contagemTosSacasNaoTransbordo: number;
  contagemTosScuttleOrPalletNaoTransbordo: number;
  contagemIdsSacasNaoTransbordo: number;
  contagemIdsScuttleOrPalletsNaoTransbordo: number;
  contagemTosSacasTransbordo: number;
  contagemTosScuttleOrPalletTransbordo: number;
  contagemIdsSacasTransbordo: number;
  contagemIdsScuttleOrPalletsTransbordo: number;
  contagemTosPOrPpNaoTransbordo: number;
  contagemTosPOrPpTransbordo: number;
  contagemTosMNaoTransbordo: number;
  contagemTosMTransbordo: number;
  contagemTosGNaoTransbordo: number;
  contagemTosGTransbordo: number;
  contagemTosBulkyOrUltrabulkyNaoTransbordo: number;
  contagemTosBulkyOrUltrabulkyTransbordo: number;
  contagemTosMais200NaoTransbordo: number;
  contagemTosMais200Transbordo: number;
  contagemIdsMais200NaoTransbordo: number;
  contagemIdsMais200Transbordo: number;
  tempoFilaMs: number;
  tempoDocaMs: number;
  tempoTotalMs: number;
};

export type HistoricoOutboundChartRow = {
  label: string;
  qtd: number;
};

export type HistoricoOutboundData = {
  atualizadoEm: string;
  erro?: {
    etapa: "variavel" | "permissao" | "leitura";
    mensagem: string;
    detalhe?: string;
  };
  filtros: {
    datas: string[];
    turnos: string[];
    destinos: string[];
    fluxos: string[];
  };
  linhas: HistoricoOutboundRow[];
};

function normalizeHeader(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function pick(row: Record<string, string>, ...columns: string[]) {
  const entries = Object.entries(row);
  const normalizedEntries = entries.map(([key, value]) => [normalizeHeader(key), value] as const);
  for (const col of columns) {
    const wanted = normalizeHeader(col);
    const found = normalizedEntries.find(([key, val]) => key === wanted && String(val ?? "").trim() !== "");
    if (found) return String(found[1] ?? "").trim();
  }
  return "";
}

function parseDateToExcelSerial(str: string) {
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (year >= 1899 && year <= 2000) {
      const dateUtc = Date.UTC(year, month - 1, day);
      const epochUtc = Date.UTC(1899, 11, 30);
      const diffDays = Math.round((dateUtc - epochUtc) / (24 * 3600 * 1000));
      return diffDays >= 0 ? diffDays : 0;
    }
  }
  return null;
}

function numberValue(value: string) {
  const str = String(value ?? "").trim();
  if (!str) return 0;
  const excelSerial = parseDateToExcelSerial(str);
  if (excelSerial !== null) {
    return excelSerial;
  }
  const normalized = str
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDateKey(value: string) {
  const raw = String(value ?? "").trim();
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;

  return raw;
}

function parseDateMs(value: string) {
  const raw = String(value ?? "").trim();
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    return Date.UTC(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] ?? 0),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0)
    );
  }

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    return Date.UTC(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      Number(br[4] ?? 0),
      Number(br[5] ?? 0),
      Number(br[6] ?? 0)
    );
  }

  return null;
}

function hourNumber(value: string) {
  const parsedDate = parseDateMs(value);
  if (parsedDate !== null) return new Date(parsedDate).getUTCHours();
  const match = String(value ?? "").match(/(\d{1,2})(?::\d{2})?/);
  const parsed = match ? Number(match[1]) : -1;
  return Number.isFinite(parsed) ? ((parsed % 24) + 24) % 24 : -1;
}

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}`;
}

function turnoFromHour(hour: number): "T1" | "T2" | "T3" {
  if (hour >= 6 && hour < 14) return "T1";
  if (hour >= 14 && hour < 22) return "T2";
  return "T3";
}

function normalizeText(value: string, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).filter((value) => value !== "-"))).sort((a, b) => a.localeCompare(b));
}

function durationBetweenMs(start: string, end: string) {
  const startMs = parseDateMs(start);
  const endMs = parseDateMs(end);
  if (startMs === null || endMs === null || endMs < startMs) return 0;
  return endMs - startMs;
}

function operationalDateKey(dateKey: string, hour: number) {
  const normalized = normalizeDateKey(dateKey);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  if (hour >= 6) return normalized;

  const [year, month, day] = normalized.split("-").map(Number);
  const previousDay = new Date(Date.UTC(year, month - 1, day - 1));
  const prevYear = previousDay.getUTCFullYear();
  const prevMonth = String(previousDay.getUTCMonth() + 1).padStart(2, "0");
  const prevDay = String(previousDay.getUTCDate()).padStart(2, "0");
  return `${prevYear}-${prevMonth}-${prevDay}`;
}

function mapRow(row: Record<string, string>): HistoricoOutboundRow {
  const rawDataAjustada = pick(row, "data_expedicao_ajustada_6_horas");
  const rawDataDia = pick(row, "data_expedicao_dia");
  const dataPlanejadaRaw = pick(row, "data_planejada_ajustada_6_horas", "chegada_planejada_destino", "chegada_planejada_origem");
  const unloadedDatetime = pick(row, "unloaded_datetime");
  const unsealDatetime = pick(row, "unseal_datetime");
  const chegadaRealizadaDestino = pick(row, "chegada_realizada_destino");
  const partidaRealizadaOrigem = pick(row, "partida_realizada_origem");
  const horaExpedicao = hourNumber(partidaRealizadaOrigem || rawDataAjustada || unloadedDatetime || pick(row, "saida_origem"));
  const dataExpedicao = rawDataAjustada
    ? normalizeDateKey(rawDataAjustada)
    : (rawDataDia ? operationalDateKey(rawDataDia, horaExpedicao) : "");
  const dataOperacional = dataExpedicao;

  const toSaca = numberValue(pick(row, "to_saca"));
  const toScuttle = numberValue(pick(row, "to_scuttle"));
  const toPallet = numberValue(pick(row, "to_pallet"));
  const toOthers = numberValue(pick(row, "to_others"));
  const sumToTotal = toSaca + toScuttle + toPallet + toOthers;
  const rawToTotal = numberValue(pick(row, "to_total"));
  const toTotal = sumToTotal > 0 ? sumToTotal : rawToTotal;

  const ordersSaca = numberValue(pick(row, "orders_saca"));
  const ordersScuttle = numberValue(pick(row, "orders_scuttle"));
  const ordersPallet = numberValue(pick(row, "orders_pallet"));
  const ordersOthers = numberValue(pick(row, "orders_others"));
  const totalOrders = numberValue(pick(row, "total_orders"));

  // No Outbound:
  // Geral usa diretamente as colunas oficiais de unitizadores to_saca e orders_saca
  const contagemTosSacas = toSaca;
  const contagemIdsSacas = ordersSaca;
  const contagemTosScuttleOrPallet = toScuttle + toPallet;
  const contagemIdsScuttleOrPallets = ordersScuttle + ordersPallet;

  return {
    dataExpedicao,
    dataOperacional,
    dataPlanejada: normalizeDateKey(dataPlanejadaRaw),
    horaExpedicao,
    horaLabel: hourLabel(horaExpedicao),
    turno: turnoFromHour(horaExpedicao),
    statusAgrupado: normalizeText(pick(row, "status_agrupado")),
    solicitationBy: normalizeText(pick(row, "solicitation_by")),
    tripNumber: normalizeText(pick(row, "trip_number", "LH Trip Number")),
    origin: normalizeText(pick(row, "origin_station_code")),
    destino: normalizeText(pick(row, "destination_station_code")),
    vehicleNumber: normalizeText(pick(row, "vehicle_number")),
    usedVehicle: normalizeText(pick(row, "used_vehicle")),
    totalOrders,
    ordersSaca,
    ordersScuttle,
    ordersPallet,
    ordersOthers,
    toSaca,
    toScuttle,
    toPallet,
    toOthers,
    toTotal,
    saidaOrigem: normalizeText(pick(row, "saida_origem")),
    chegadaPlanejadaOrigem: normalizeText(pick(row, "chegada_planejada_origem")),
    partidaPlanejadaOrigem: normalizeText(pick(row, "partida_planejada_origem")),
    chegadaRealizadaOrigem: normalizeText(pick(row, "chegada_realizada_origem")),
    partidaRealizadaOrigem: normalizeText(partidaRealizadaOrigem),
    chegadaPlanejadaDestino: normalizeText(pick(row, "chegada_planejada_destino")),
    chegadaRealizadaDestino: normalizeText(chegadaRealizadaDestino),
    unsealDatetime: normalizeText(unsealDatetime),
    unloadedDatetime: normalizeText(unloadedDatetime),
    latestUpdate: normalizeText(pick(row, "latest_update")),
    statusCpt: normalizeText(pick(row, "status_cpt")),
    statusEtaDestino: normalizeText(pick(row, "status_eta_destino")),
    tempoDescargaHoras: numberValue(pick(row, "tempo_descarga_horas")),
    tempoDescargaAjustadoHoras: numberValue(pick(row, "tempo_descarga_ajustado_horas")),
    classificacaoStatusViagem: normalizeText(pick(row, "classificacao_status_viagem")),
    contagemTosSacas,
    contagemTosScuttleOrPallet,
    contagemIdsSacas,
    contagemIdsScuttleOrPallets,
    contagemTosSacasNaoTransbordo: numberValue(pick(row, "contagem_tos_sacas_nao_transbordo")),
    contagemTosScuttleOrPalletNaoTransbordo: numberValue(
      pick(row, "contagem_tos_scuttle_or_pallet_nao_transbordo", "contagem_tos_scuttle_or_pallets_nao_transbordo")
    ),
    contagemIdsSacasNaoTransbordo: numberValue(pick(row, "contagem_ids_sacas_nao_transbordo")),
    contagemIdsScuttleOrPalletsNaoTransbordo: numberValue(
      pick(row, "contagem_ids_scuttle_or_pallets_nao_transbordo", "contagem_ids_scuttle_or_pallet_nao_transbordo")
    ),
    contagemTosSacasTransbordo: numberValue(pick(row, "contagem_tos_sacas_transbordo")),
    contagemTosScuttleOrPalletTransbordo: numberValue(
      pick(row, "contagem_tos_scuttle_or_pallet_transbordo", "contagem_tos_scuttle_or_pallets_transbordo")
    ),
    contagemIdsSacasTransbordo: numberValue(pick(row, "contagem_ids_sacas_transbordo")),
    contagemIdsScuttleOrPalletsTransbordo: numberValue(
      pick(row, "contagem_ids_scuttle_or_pallets_transbordo", "contagem_ids_scuttle_or_pallet_transbordo")
    ),
    contagemTosPOrPpNaoTransbordo: numberValue(pick(row, "contagem_tos_p_or_pp_nao_transbordo")),
    contagemTosPOrPpTransbordo: numberValue(pick(row, "contagem_tos_p_or_pp_transbordo")),
    contagemTosMNaoTransbordo: numberValue(pick(row, "contagem_tos_m_nao_transbordo")),
    contagemTosMTransbordo: numberValue(pick(row, "contagem_tos_m_transbordo")),
    contagemTosGNaoTransbordo: numberValue(pick(row, "contagem_tos_g_nao_transbordo")),
    contagemTosGTransbordo: numberValue(pick(row, "contagem_tos_g_transbordo")),
    contagemTosBulkyOrUltrabulkyNaoTransbordo: numberValue(pick(row, "contagem_tos_bulky_or_ultrabulky_nao_transbordo")),
    contagemTosBulkyOrUltrabulkyTransbordo: numberValue(pick(row, "contagem_tos_bulky_or_ultrabulky_transbordo")),
    contagemTosMais200NaoTransbordo: numberValue(pick(row, "contagem_tos_mais_200_nao_transbordo")),
    contagemTosMais200Transbordo: numberValue(pick(row, "contagem_tos_mais_200_transbordo")),
    contagemIdsMais200NaoTransbordo: numberValue(pick(row, "contagem_ids_mais_200_nao_transbordo")),
    contagemIdsMais200Transbordo: numberValue(pick(row, "contagem_ids_mais_200_transbordo")),
    tempoFilaMs: durationBetweenMs(chegadaRealizadaDestino, unsealDatetime),
    tempoDocaMs: durationBetweenMs(unsealDatetime, unloadedDatetime),
    tempoTotalMs: durationBetweenMs(chegadaRealizadaDestino, unloadedDatetime)
  };
}

export function generateMockHistoricoOutboundData(): HistoricoOutboundData {
  const destinations = [
    "HUB_CAMPINAS_01",
    "HUB_CURITIBA_02",
    "HUB_RIO_01",
    "HUB_BH_03",
    "HUB_FLORIPA_01",
    "HUB_GOIANIA_01",
    "HUB_SALVADOR_01",
    "HUB_VITORIA_01",
    "HUB_POUSO_ALEGRE_01"
  ];
  const vehicleTypes = ["CARRETA", "TRUCK", "BITREM", "TOCO"];
  const plates = ["TRK-4B11", "CAR-2C77", "BIT-9A32", "TRK-5E90", "CAR-7F43", "TOCO-1D20", "CAR-8H65"];

  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).format(new Date());

  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const linhas: HistoricoOutboundRow[] = [];
  let tripSeq = 200;

  dates.forEach((dateStr) => {
    const tripsPerDay = 12;
    for (let t = 0; t < tripsPerDay; t++) {
      tripSeq += 1;
      const hour = (6 + t * 2) % 24;
      const turno: "T1" | "T2" | "T3" = hour >= 6 && hour < 14 ? "T1" : hour >= 14 && hour < 22 ? "T2" : "T3";
      const destino = destinations[(t + tripSeq) % destinations.length];
      const vehicle = vehicleTypes[(t + tripSeq) % vehicleTypes.length];
      const plate = plates[(t + tripSeq) % plates.length];
      const isToday = dateStr === today;
      const statusAgrupado = isToday && t >= 10 ? "Em Carregamento" : isToday && t >= 11 ? "Aguardando" : "Expedido";

      const ordersSaca = 500 + ((tripSeq * 83) % 2000);
      const ordersScuttle = 300 + ((tripSeq * 53) % 1100);
      const ordersPallet = 120 + ((tripSeq * 37) % 500);
      const totalOrders = ordersSaca + ordersScuttle + ordersPallet;

      const toSaca = Math.round(ordersSaca / 24);
      const toScuttle = Math.round(ordersScuttle / 35);
      const toPallet = Math.round(ordersPallet / 50);
      const toTotal = toSaca + toScuttle + toPallet;

      const tempoCarregamentoMin = 35 + ((tripSeq * 15) % 50);
      const hourStr = String(hour).padStart(2, "0");
      const cptStatus = tripSeq % 11 === 0 ? "Atrasado" : tripSeq % 4 === 0 ? "Adiantado" : "No Prazo";

      linhas.push({
        dataExpedicao: dateStr,
        dataOperacional: dateStr,
        dataPlanejada: dateStr,
        horaExpedicao: hour,
        horaLabel: `${hourStr}:00`,
        turno,
        statusAgrupado,
        solicitationBy: tripSeq % 3 === 0 ? "LH_FIELD" : "LH_PLANNING",
        tripNumber: `LT-OUT-${dateStr.replace(/-/g, "").slice(2)}-${String(tripSeq).slice(-3)}`,
        origin: "HUB_CENTRAL_01",
        destino,
        vehicleNumber: plate,
        usedVehicle: vehicle,
        totalOrders,
        ordersSaca,
        ordersScuttle,
        ordersPallet,
        ordersOthers: 0,
        toSaca,
        toScuttle,
        toPallet,
        toOthers: 0,
        toTotal,
        saidaOrigem: `${hourStr}:40`,
        chegadaPlanejadaOrigem: `${hourStr}:00`,
        partidaPlanejadaOrigem: `${hourStr}:45`,
        chegadaRealizadaOrigem: `${hourStr}:05`,
        partidaRealizadaOrigem: `${hourStr}:40`,
        chegadaPlanejadaDestino: `${String((hour + 6) % 24).padStart(2, "0")}:00`,
        chegadaRealizadaDestino: `${String((hour + 6) % 24).padStart(2, "0")}:10`,
        unsealDatetime: `${String((hour + 6) % 24).padStart(2, "0")}:30`,
        unloadedDatetime: `${String((hour + 7) % 24).padStart(2, "0")}:20`,
        latestUpdate: `${hourStr}:50`,
        statusCpt: cptStatus,
        statusEtaDestino: "No Prazo",
        tempoDescargaHoras: Math.round((tempoCarregamentoMin / 60) * 100) / 100,
        tempoDescargaAjustadoHoras: Math.round((tempoCarregamentoMin / 60) * 100) / 100,
        classificacaoStatusViagem: "CONCLUIDO",
        contagemTosSacas: toSaca,
        contagemTosScuttleOrPallet: toScuttle + toPallet,
        contagemIdsSacas: ordersSaca,
        contagemIdsScuttleOrPallets: ordersScuttle + ordersPallet,
        contagemTosSacasNaoTransbordo: toSaca,
        contagemTosScuttleOrPalletNaoTransbordo: toScuttle + toPallet,
        contagemIdsSacasNaoTransbordo: ordersSaca,
        contagemIdsScuttleOrPalletsNaoTransbordo: ordersScuttle + ordersPallet,
        contagemTosSacasTransbordo: 0,
        contagemTosScuttleOrPalletTransbordo: 0,
        contagemIdsSacasTransbordo: 0,
        contagemIdsScuttleOrPalletsTransbordo: 0,
        contagemTosPOrPpNaoTransbordo: Math.round(toSaca * 0.4),
        contagemTosPOrPpTransbordo: 0,
        contagemTosMNaoTransbordo: Math.round(toSaca * 0.35),
        contagemTosMTransbordo: 0,
        contagemTosGNaoTransbordo: Math.round(toSaca * 0.25),
        contagemTosGTransbordo: 0,
        contagemTosBulkyOrUltrabulkyNaoTransbordo: toPallet,
        contagemTosBulkyOrUltrabulkyTransbordo: 0,
        contagemTosMais200NaoTransbordo: 2,
        contagemTosMais200Transbordo: 0,
        contagemIdsMais200NaoTransbordo: 28,
        contagemIdsMais200Transbordo: 0,
        tempoFilaMs: 15 * 60 * 1000,
        tempoDocaMs: tempoCarregamentoMin * 60 * 1000,
        tempoTotalMs: (15 + tempoCarregamentoMin) * 60 * 1000
      });
    }
  });

  return {
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    filtros: {
      datas: dates,
      turnos: ["T1", "T2", "T3"],
      destinos: destinations,
      fluxos: ["Expedido", "Em Carregamento", "Aguardando"]
    },
    linhas
  };
}

export function emptyHistoricoOutboundData(erro?: HistoricoOutboundData["erro"]): HistoricoOutboundData {
  return generateMockHistoricoOutboundData();
}

export async function getHistoricoOutboundData(options?: { forceRefresh?: boolean }): Promise<HistoricoOutboundData> {
  const spreadsheetId = getHistoricoOutboundSpreadsheetId();

  if (!spreadsheetId) {
    return generateMockHistoricoOutboundData();
  }

  try {
    return await withComputedCache<HistoricoOutboundData>(
      {
        key: `historico-outbound:v2:${spreadsheetId}`,
        label: "Historico LH Outbound",
        ttlMs: HISTORICO_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rawRows = await readSheetRows("hist", HISTORICO_OUTBOUND_RANGE, spreadsheetId, {
          ttlMs: HISTORICO_CACHE_TTL_MS,
          forceRefresh: options?.forceRefresh,
          cacheLabel: "Historico LH Outbound"
        });
        const linhas = rawRows
          .map(mapRow)
          .filter((row) => row.tripNumber !== "-" || row.destino !== "-" || row.totalOrders > 0 || row.toTotal > 0);

        if (linhas.length === 0) {
          return generateMockHistoricoOutboundData();
        }

        return {
          atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
          filtros: {
            datas: uniq(linhas.map((row) => row.dataExpedicao)),
            turnos: ["T1", "T2", "T3"],
            destinos: uniq(linhas.map((row) => row.destino)),
            fluxos: uniq(linhas.map((row) => row.statusAgrupado))
          },
          linhas
        };
      }
    );
  } catch (error) {
    return generateMockHistoricoOutboundData();
  }
}
