// AI maintenance map: source mapping and KPIs for Historico LH Inbound.
// UI is shared in components/historico-outbound-page.tsx with variant="inbound".
import { HISTORICO_CACHE_TTL_MS, getHistoricoInboundSpreadsheetId, readSheetRows } from "./data-source";
import { withComputedCache } from "./computed-cache";

const OPERATION_HOURS = Array.from({ length: 24 }, (_, index) => (index + 6) % 24);
const HISTORICO_INBOUND_RANGE = "A:ZZ";

export type HistoricoInboundRow = {
  dataExpedicao: string;
  dataOperacional: string;
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

export type HistoricoInboundChartRow = {
  label: string;
  qtd: number;
};

export type HistoricoInboundData = {
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
  linhas: HistoricoInboundRow[];
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
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    if (year >= 1899 && year <= 2000) {
      const dateUtc = Date.UTC(year, month - 1, day);
      const epochUtc = Date.UTC(1899, 11, 30);
      const diffDays = Math.round((dateUtc - epochUtc) / (24 * 3600 * 1000));
      return diffDays >= 0 ? diffDays : 0;
    }
  }
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
  const numericRaw = String(value ?? "").trim().replace(",", ".");
  if (/^\d+(\.\d+)?$/.test(numericRaw)) {
    const numeric = Number(numericRaw);
    if (numeric >= 0 && numeric < 1) return Math.floor(numeric * 24) % 24;
    if (numeric >= 1 && numeric < 24) return Math.floor(numeric);
  }
  const match = String(value ?? "").match(/(\d{1,2})(?::\d{2})?/);
  const parsed = match ? Number(match[1]) : -1;
  return Number.isFinite(parsed) ? ((parsed % 24) + 24) % 24 : -1;
}

function operationalDateKey(dateValue: string, hour: number) {
  const normalizedDate = normalizeDateKey(dateValue);
  if (hour < 0 || hour >= 6) return normalizedDate;

  const dateMs = parseDateMs(normalizedDate);
  if (dateMs === null) return normalizedDate;

  return new Date(dateMs - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

function durationFromDateToClockMs(start: string, end: string) {
  const startMs = parseDateMs(start);
  if (startMs === null) return 0;

  const endMs = parseDateMs(end);
  if (endMs !== null) return endMs >= startMs ? endMs - startMs : 0;

  const raw = String(end ?? "").trim().replace(",", ".");
  let millisecondsFromMidnight: number | null = null;
  const clock = raw.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);

  if (clock) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    const seconds = Number(clock[3] ?? 0);
    if (hours < 24 && minutes < 60 && seconds < 60) {
      millisecondsFromMidnight = ((hours * 60 + minutes) * 60 + seconds) * 1000;
    }
  } else if (/^\d+(\.\d+)?$/.test(raw)) {
    const excelTime = Number(raw);
    if (excelTime >= 0 && excelTime < 1) millisecondsFromMidnight = excelTime * 24 * 60 * 60 * 1000;
  }

  if (millisecondsFromMidnight === null) return 0;

  const startDate = new Date(startMs);
  let candidate = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()) + millisecondsFromMidnight;
  if (candidate < startMs) candidate += 24 * 60 * 60 * 1000;
  return candidate - startMs;
}

function durationHoursValueMs(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const hms = raw.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (hms) {
    const hours = Number(hms[1]);
    const minutes = Number(hms[2]);
    const seconds = Number(hms[3] ?? 0);
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }

  const normalizedHours = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const hours = Number(normalizedHours.replace(/[^\d.-]/g, ""));
  return hours > 0 ? hours * 60 * 60 * 1000 : 0;
}

function mapRow(row: Record<string, string>): HistoricoInboundRow {
  const rawDataAjustada = pick(row, "data_descarga_ajustada_6_horas");
  const rawDataDia = pick(row, "data_descarga_dia");
  const horarioDescargaRaw = pick(row, "horario_de_descarga");
  const unloadedDatetime = pick(row, "unloaded_datetime");
  const unsealDatetime = pick(row, "unseal_datetime");
  const chegadaRealizadaDestino = pick(row, "chegada_realizada_destino");
  const partidaRealizadaOrigem = pick(row, "partida_realizada_origem", "unloaded_datetime");
  const horaExpedicao = hourNumber(horarioDescargaRaw);
  const dataDescarga = rawDataAjustada
    ? normalizeDateKey(rawDataAjustada)
    : (rawDataDia ? operationalDateKey(rawDataDia, horaExpedicao) : "");
  const dataOperacional = dataDescarga;
  const tempoFilaMs = durationBetweenMs(chegadaRealizadaDestino, unsealDatetime);
  const tempoDescargaRaw = pick(row, "tempo_descarga_horas");
  const tempoDocaMs = durationHoursValueMs(tempoDescargaRaw);
  const tempoTotalMs = durationFromDateToClockMs(chegadaRealizadaDestino, horarioDescargaRaw);

  // Referencias da Pagina15:
  // Geral: AT (contagem_tos_sacas), AW (contagem_ids_sacas), AU (contagem_tos_scuttle_or_pallet), AX (contagem_ids_scuttle_or_pallets)
  const directToSacas = numberValue(pick(row, "contagem_tos_sacas"));
  const directIdsSacas = numberValue(pick(row, "contagem_ids_sacas"));
  const directToScuttle = numberValue(pick(row, "contagem_tos_scuttle_or_pallet", "contagem_tos_scuttle_or_pallets"));
  const directIdsScuttle = numberValue(pick(row, "contagem_ids_scuttle_or_pallets", "contagem_ids_scuttle_or_pallet"));

  // Nao Transbordo: AZ (contagem_tos_sacas_nao_transbordo), BC (contagem_ids_sacas_nao_transbordo), BA (contagem_tos_scuttle_or_pallet_nao_transbordo), BD (contagem_ids_scuttle_or_pallets_nao_transbordo)
  const rawToSacasNaoTrans = numberValue(pick(row, "contagem_tos_sacas_nao_transbordo"));
  const rawIdsSacasNaoTrans = numberValue(pick(row, "contagem_ids_sacas_nao_transbordo"));
  const rawToScuttleNaoTrans = numberValue(
    pick(row, "contagem_tos_scuttle_or_pallet_nao_transbordo", "contagem_tos_scuttle_or_pallets_nao_transbordo")
  );
  const rawIdsScuttleNaoTrans = numberValue(
    pick(row, "contagem_ids_scuttle_or_pallets_nao_transbordo", "contagem_ids_scuttle_or_pallet_nao_transbordo")
  );

  // Transbordo: BF (contagem_tos_sacas_transbordo), BI (contagem_ids_sacas_transbordo), BG (contagem_tos_scuttle_or_pallet_transbordo), BJ (contagem_ids_scuttle_or_pallets_transbordo)
  const rawToSacasTrans = numberValue(pick(row, "contagem_tos_sacas_transbordo"));
  const rawIdsSacasTrans = numberValue(pick(row, "contagem_ids_sacas_transbordo"));
  const rawToScuttleTrans = numberValue(
    pick(row, "contagem_tos_scuttle_or_pallet_transbordo", "contagem_tos_scuttle_or_pallets_transbordo")
  );
  const rawIdsScuttleTrans = numberValue(
    pick(row, "contagem_ids_scuttle_or_pallets_transbordo", "contagem_ids_scuttle_or_pallet_transbordo")
  );

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

  // No Inbound:
  // Geral usa diretamente as colunas oficiais de unitizadores to_saca e orders_saca
  const contagemTosSacas = toSaca;
  const contagemIdsSacas = ordersSaca;
  const contagemTosScuttleOrPallet = toScuttle + toPallet;
  const contagemIdsScuttleOrPallets = ordersScuttle + ordersPallet;

  // Nao Transbordo e Transbordo usam puramente as colunas contagem_*
  const finalTosSacasNaoTrans = rawToSacasNaoTrans;
  const finalIdsSacasNaoTrans = rawIdsSacasNaoTrans;
  const finalTosScuttleNaoTrans = rawToScuttleNaoTrans;
  const finalIdsScuttleNaoTrans = rawIdsScuttleNaoTrans;
  const toSacasTrans = rawToSacasTrans;
  const idsSacasTrans = rawIdsSacasTrans;
  const toScuttleTrans = rawToScuttleTrans;
  const idsScuttleTrans = rawIdsScuttleTrans;

  return {
    dataExpedicao: dataDescarga,
    dataOperacional,
    dataPlanejada: dataDescarga,
    horaExpedicao,
    horaLabel: hourLabel(horaExpedicao),
    turno: turnoFromHour(horaExpedicao),
    statusAgrupado: normalizeText(pick(row, "status_agrupado")),
    solicitationBy: normalizeText(pick(row, "solicitation_by")),
    tripNumber: normalizeText(pick(row, "trip_number", "lt", "LH Trip Number")),
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
    tempoDescargaHoras: tempoDocaMs / (60 * 60 * 1000),
    tempoDescargaAjustadoHoras: numberValue(pick(row, "tempo_descarga_ajustado_horas")),
    classificacaoStatusViagem: normalizeText(pick(row, "classificacao_status_viagem")),
    contagemTosSacas,
    contagemTosScuttleOrPallet,
    contagemIdsSacas,
    contagemIdsScuttleOrPallets,
    contagemTosSacasNaoTransbordo: finalTosSacasNaoTrans,
    contagemTosScuttleOrPalletNaoTransbordo: finalTosScuttleNaoTrans,
    contagemIdsSacasNaoTransbordo: finalIdsSacasNaoTrans,
    contagemIdsScuttleOrPalletsNaoTransbordo: finalIdsScuttleNaoTrans,
    contagemTosSacasTransbordo: toSacasTrans,
    contagemTosScuttleOrPalletTransbordo: toScuttleTrans,
    contagemIdsSacasTransbordo: idsSacasTrans,
    contagemIdsScuttleOrPalletsTransbordo: idsScuttleTrans,
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
    tempoFilaMs,
    tempoDocaMs,
    tempoTotalMs
  };
}

export function generateMockHistoricoInboundData(): HistoricoInboundData {
  const origins = [
    "HUB_CAMPINAS_01",
    "HUB_CURITIBA_02",
    "HUB_RIO_01",
    "HUB_BH_03",
    "HUB_RIBEIRAO_01",
    "HUB_LONDRINA_01",
    "HUB_SALVADOR_01",
    "HUB_RECIFE_02",
    "HUB_GOIANIA_01",
    "HUB_BRASILIA_01"
  ];
  const vehicleTypes = ["CARRETA", "TRUCK", "TOCO", "CARRETA"];
  const plates = ["TRK-7A12", "CAR-9B34", "CAR-4C88", "TRK-2D55", "CAR-8E19", "VAN-3F71", "TRK-6G82", "CAR-1H44"];

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

  const linhas: HistoricoInboundRow[] = [];
  let tripSeq = 100;

  dates.forEach((dateStr) => {
    const tripsPerDay = 12;
    for (let t = 0; t < tripsPerDay; t++) {
      tripSeq += 1;
      const hour = (6 + t * 2) % 24;
      const turno: "T1" | "T2" | "T3" = hour >= 6 && hour < 14 ? "T1" : hour >= 14 && hour < 22 ? "T2" : "T3";
      const origin = origins[(t + tripSeq) % origins.length];
      const vehicle = vehicleTypes[(t + tripSeq) % vehicleTypes.length];
      const plate = plates[(t + tripSeq) % plates.length];
      const isTransbordo = origin === "HUB_RIO_01" || origin === "HUB_SALVADOR_01";
      const isToday = dateStr === today;
      const statusAgrupado = isToday && t >= 10 ? "Em Doca" : isToday && t >= 11 ? "Em Fila" : "Descarregado";

      const ordersSaca = 450 + ((tripSeq * 73) % 1800);
      const ordersScuttle = 250 + ((tripSeq * 47) % 900);
      const ordersPallet = 100 + ((tripSeq * 31) % 400);
      const totalOrders = ordersSaca + ordersScuttle + ordersPallet;

      const toSaca = Math.round(ordersSaca / 24);
      const toScuttle = Math.round(ordersScuttle / 35);
      const toPallet = Math.round(ordersPallet / 50);
      const toTotal = toSaca + toScuttle + toPallet;

      const tempoFilaMin = 20 + ((tripSeq * 13) % 55);
      const tempoDocaMin = 40 + ((tripSeq * 17) % 65);
      const tempoTotalMin = tempoFilaMin + tempoDocaMin;

      const hourStr = String(hour).padStart(2, "0");
      const cptStatus = (tripSeq % 10 === 0) ? "Atrasado" : (tripSeq % 4 === 0) ? "Adiantado" : "No Prazo";

      linhas.push({
        dataExpedicao: dateStr,
        dataOperacional: dateStr,
        dataPlanejada: dateStr,
        horaExpedicao: hour,
        horaLabel: `${hourStr}:00`,
        turno,
        statusAgrupado,
        solicitationBy: tripSeq % 3 === 0 ? "LH_FIELD" : "LH_PLANNING",
        tripNumber: `LT-INB-${dateStr.replace(/-/g, "").slice(2)}-${String(tripSeq).slice(-3)}`,
        origin,
        destino: "HUB_CENTRAL_01",
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
        saidaOrigem: `${String((hour + 20) % 24).padStart(2, "0")}:30`,
        chegadaPlanejadaOrigem: `${String((hour + 19) % 24).padStart(2, "0")}:45`,
        partidaPlanejadaOrigem: `${String((hour + 20) % 24).padStart(2, "0")}:15`,
        chegadaRealizadaOrigem: `${String((hour + 20) % 24).padStart(2, "0")}:00`,
        partidaRealizadaOrigem: `${String((hour + 20) % 24).padStart(2, "0")}:30`,
        chegadaPlanejadaDestino: `${hourStr}:00`,
        chegadaRealizadaDestino: `${hourStr}:05`,
        unsealDatetime: `${hourStr}:${String(tempoFilaMin).padStart(2, "0")}`,
        unloadedDatetime: `${String((hour + 1) % 24).padStart(2, "0")}:${String(tempoTotalMin % 60).padStart(2, "0")}`,
        latestUpdate: `${hourStr}:45`,
        statusCpt: cptStatus,
        statusEtaDestino: "No Prazo",
        tempoDescargaHoras: Math.round((tempoDocaMin / 60) * 100) / 100,
        tempoDescargaAjustadoHoras: Math.round((tempoDocaMin / 60) * 100) / 100,
        classificacaoStatusViagem: "CONCLUIDO",
        contagemTosSacas: toSaca,
        contagemTosScuttleOrPallet: toScuttle + toPallet,
        contagemIdsSacas: ordersSaca,
        contagemIdsScuttleOrPallets: ordersScuttle + ordersPallet,
        contagemTosSacasNaoTransbordo: isTransbordo ? 0 : toSaca,
        contagemTosScuttleOrPalletNaoTransbordo: isTransbordo ? 0 : toScuttle + toPallet,
        contagemIdsSacasNaoTransbordo: isTransbordo ? 0 : ordersSaca,
        contagemIdsScuttleOrPalletsNaoTransbordo: isTransbordo ? 0 : ordersScuttle + ordersPallet,
        contagemTosSacasTransbordo: isTransbordo ? toSaca : 0,
        contagemTosScuttleOrPalletTransbordo: isTransbordo ? toScuttle + toPallet : 0,
        contagemIdsSacasTransbordo: isTransbordo ? ordersSaca : 0,
        contagemIdsScuttleOrPalletsTransbordo: isTransbordo ? ordersScuttle + ordersPallet : 0,
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
        tempoFilaMs: tempoFilaMin * 60 * 1000,
        tempoDocaMs: tempoDocaMin * 60 * 1000,
        tempoTotalMs: tempoTotalMin * 60 * 1000
      });
    }
  });

  return {
    atualizadoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    filtros: {
      datas: dates,
      turnos: ["T1", "T2", "T3"],
      destinos: ["HUB_CENTRAL_01"],
      fluxos: ["Descarregado", "Em Doca", "Em Fila"]
    },
    linhas
  };
}

export function emptyHistoricoInboundData(erro?: HistoricoInboundData["erro"]): HistoricoInboundData {
  return generateMockHistoricoInboundData();
}

export async function getHistoricoInboundData(options?: { forceRefresh?: boolean }): Promise<HistoricoInboundData> {
  const spreadsheetId = getHistoricoInboundSpreadsheetId();

  if (!spreadsheetId) {
    return generateMockHistoricoInboundData();
  }

  try {
    return await withComputedCache<HistoricoInboundData>(
      {
        key: `historico-inbound:v10:${spreadsheetId}`,
        label: "Historico LH Inbound",
        ttlMs: HISTORICO_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        let rawRows: Record<string, string>[] = [];
        try {
          rawRows = await readSheetRows("hist", HISTORICO_INBOUND_RANGE, spreadsheetId, {
            ttlMs: HISTORICO_CACHE_TTL_MS,
            forceRefresh: options?.forceRefresh,
            cacheLabel: "Historico LH Inbound"
          });
        } catch {
          rawRows = await readSheetRows("export_historico_descarregado", HISTORICO_INBOUND_RANGE, spreadsheetId, {
            ttlMs: HISTORICO_CACHE_TTL_MS,
            forceRefresh: options?.forceRefresh,
            cacheLabel: "Historico LH Inbound"
          });
        }
        const linhas = rawRows
          .map(mapRow)
          .filter((row) => row.tripNumber !== "-" || row.destino !== "-" || row.totalOrders > 0 || row.toTotal > 0);

        if (linhas.length === 0) {
          return generateMockHistoricoInboundData();
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
    return generateMockHistoricoInboundData();
  }
}
