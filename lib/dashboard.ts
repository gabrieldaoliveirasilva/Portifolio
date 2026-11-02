// AI maintenance map: live operational rules for inbound and legacy outbound.
// UI belongs in components/dashboard-shell.tsx; Sheets transport is data-source.ts.
import { LIVE_CACHE_TTL_MS, hasGoogleSheetsEnv, readSheetRows, readSheetValues } from "./data-source";
import { withComputedCache } from "./computed-cache";
import type { ContagemDestino, Doca, InboundDashboard, InboundVehicle, Insight, ProgramacaoRow, StageRow } from "./types";

const INBOUND_SPREADSHEET_ID =
  process.env.GOOGLE_INBOUND_SPREADSHEET_ID ||
  process.env.GOOGLE_INBOUND_SPREADSHEET_IDpackin ||
  "18Oe0AErhmA25Ihtu5eW-pPf1GLy-lphkedTUwZkYUeE";
const DB_ALL_RANGE = "A:Q";
const INBOUND_FILA_RANGE = "A:CA";
const INBOUND_HIST_RANGE = "A:CA";
const TOS_PACKED_RANGE = "A:Q";

function generateMockProgramacao(): ProgramacaoRow[] {
  const now = new Date();
  const destinations = [
    { dest: "HUB_CAMPINAS_01", station: "SOC-SP01" },
    { dest: "HUB_CURITIBA_02", station: "SOC-PR02" },
    { dest: "HUB_RIO_01", station: "SOC-RJ01" },
    { dest: "HUB_BH_03", station: "SOC-MG03" },
    { dest: "HUB_FLORIPA_01", station: "SOC-SC01" },
    { dest: "HUB_GOIANIA_01", station: "SOC-GO01" },
    { dest: "HUB_SALVADOR_01", station: "SOC-BA01" },
    { dest: "HUB_VITORIA_01", station: "SOC-ES01" },
    { dest: "HUB_POUSO_ALEGRE_01", station: "SOC-MG05" },
    { dest: "HUB_LONDRINA_01", station: "SOC-PR03" },
    { dest: "HUB_RIBEIRAO_01", station: "SOC-SP04" },
    { dest: "HUB_SANTOS_01", station: "SOC-SP08" }
  ];
  const drivers = ["Carlos Mendes", "Lucas Ferreira", "Marcos Oliveira", "Rafael Santos", "Andre Souza", "Felipe Almeida", "Bruno Costa", "Thiago Lima"];
  const operators = ["Igor Henrique", "Marcos P.", "Juliana M.", "Ricardo S.", "Fernanda T."];
  const agencies = ["Atlas Cargo", "TransLog Brasil", "Veloce Express", "Rodonaves Log"];
  const vehicles = ["CARRETA", "TRUCK", "CARRETA", "BITREM", "TOCO"];

  const trips: ProgramacaoRow[] = [];
  const offsets = [-90, -45, -15, 18, 25, 40, 52, 70, 95, 120, 150, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 840, 960, 1080, 1200, 1320];

  offsets.forEach((offsetMin, idx) => {
    const stdDate = new Date(now.getTime() + offsetMin * 60 * 1000);
    const staDate = new Date(stdDate.getTime() - 45 * 60 * 1000);
    const dInfo = destinations[idx % destinations.length];
    const driver = drivers[idx % drivers.length];
    const operator = idx % 5 === 0 ? "PENDENTE" : operators[idx % operators.length];
    const agency = agencies[idx % agencies.length];
    const vehicle = vehicles[idx % vehicles.length];

    const staStr = `${String(staDate.getHours()).padStart(2, "0")}:${String(staDate.getMinutes()).padStart(2, "0")}`;
    const stdStr = `${String(stdDate.getHours()).padStart(2, "0")}:${String(stdDate.getMinutes()).padStart(2, "0")}`;
    const staRaw = `${stdDate.toISOString().slice(0, 10)} ${staStr}:00`;
    const stdRaw = `${stdDate.toISOString().slice(0, 10)} ${stdStr}:00`;
    const datePt = `${String(stdDate.getDate()).padStart(2, "0")}/${String(stdDate.getMonth() + 1).padStart(2, "0")}/${stdDate.getFullYear()}`;

    let status = "Packed";
    let ontime = "No Prazo";
    let dock = "-";

    if (offsetMin < 0) {
      status = "Departed";
      ontime = "No Prazo";
      dock = `EXTERNA${70 + (idx % 25)}`;
    } else if (offsetMin <= 30) {
      status = "Loading";
      ontime = "Chegada no Prazo";
      dock = `EXTERNA${70 + (idx % 25)}`;
    } else if (offsetMin <= 60) {
      status = "Loading";
      ontime = "Chegada no Prazo";
      dock = `EXTERNA${70 + (idx % 25)}`;
    } else if (offsetMin <= 90) {
      status = "Arrived";
      ontime = "No Prazo";
      dock = `EXTERNA${70 + (idx % 25)}`;
    } else if (offsetMin <= 120) {
      status = "In Queue";
      ontime = "No Prazo";
      dock = "-";
    } else {
      status = idx % 2 === 0 ? "Packed" : "Packing";
      ontime = "No Prazo";
      dock = "-";
    }

    const hour = stdDate.getHours();
    const turno = hour >= 6 && hour < 14 ? "T1" : hour >= 14 && hour < 22 ? "T2" : "T3";

    trips.push({
      lh: `LT${String(idx + 101).padStart(4, "0")}-BR`,
      status,
      ontime,
      vehicle,
      data: datePt,
      stdData: datePt,
      turno,
      staRaw,
      stdRaw,
      sta: staStr,
      std: stdStr,
      ata: offsetMin <= 90 ? staStr : "-",
      etd: offsetMin < 0 ? stdStr : "-",
      dock,
      destino: dInfo.dest,
      station: dInfo.station,
      driver,
      operator,
      agency,
      classif: idx % 3 === 0 ? "LH_FIELD" : "LH_PLANNING"
    });
  });

  return trips;
}

function generateMockStageRows(): StageRow[] {
  const stations = [
    { st: "SOC-SP01", area: "Azul e Branco" },
    { st: "SOC-PR02", area: "Verde e Branco" },
    { st: "SOC-RJ01", area: "Vermelho e Branco" },
    { st: "SOC-MG03", area: "Amarelo" },
    { st: "SOC-SC01", area: "Azul e Branco" },
    { st: "SOC-GO01", area: "Verde e Branco" },
    { st: "SOC-BA01", area: "Laranja" },
    { st: "SOC-ES01", area: "Cinza" }
  ];
  const packs = ["Saca", "Scuttle", "Pallet", "Volumoso", "Saca", "Scuttle"];
  const rows: StageRow[] = [];

  for (let i = 1; i <= 24; i++) {
    const sInfo = stations[(i - 1) % stations.length];
    const packName = packs[(i - 1) % packs.length];
    const ruaLetter = i <= 8 ? "A" : i <= 16 ? "B" : "C";
    const ruaNum = String(((i - 1) % 8) + 1).padStart(2, "0");
    const rua = `${ruaLetter}-${ruaNum}`;
    const isPackingStatus = i % 5 === 0;
    const tos = 20 + ((i * 19) % 180);
    const spp = 15.5 + ((i * 1.3) % 9);
    const pacotes = Math.round(tos * spp);
    const durHours = (5 + ((i * 3.7) % 45)).toFixed(1).replace(".", ",");

    rows.push({
      toNumber: `TO202610${String(i).padStart(2, "0")}`,
      status: isPackingStatus ? "Packing" : "Packed",
      ilha: i % 4 === 0 ? "PENDENTE" : "ALOCADO",
      rua,
      station: sInfo.st,
      area: sInfo.area,
      packName,
      cage: "-",
      stagedDuration: `${durHours}h`,
      transbordo: i % 6 === 0 ? "Sim" : "Nao",
      spp: Math.round(spp * 10) / 10,
      tos,
      pacotes,
      packed: isPackingStatus ? 0 : tos,
      packing: isPackingStatus ? tos : 0
    });
  }

  return rows;
}

export function generateMockInboundFilaRows(): Record<string, string>[] {
  const now = new Date();
  const rows: Record<string, string>[] = [];
  const origins = ["HUB_CAMPINAS_01", "HUB_CURITIBA_02", "HUB_RIO_01", "HUB_BH_03", "SOC-SP8", "HUB_RIBEIRAO_01", "HUB_LONDRINA_01", "SOC-RJ2"];
  const drivers = ["Lucas Ferreira", "Marcos Oliveira", "Rafael Santos", "Andre Souza", "Carlos Mendes", "Felipe Almeida"];
  const operators = ["Carlos M.", "Juliana S.", "Ricardo T.", "Fernanda L.", "Igor H."];

  for (let i = 1; i <= 14; i++) {
    const isDoca = i <= 6;
    const origin = origins[(i - 1) % origins.length];
    const isTransbordo = origin === "SOC-SP8" || origin === "SOC-RJ2" || origin === "HUB_RIO_01";
    const queueMins = 25 + i * 8;
    const updateMins = isDoca ? 10 + i * 5 : 0;
    const ataDate = new Date(now.getTime() - queueMins * 60 * 1000);
    const updateDate = new Date(now.getTime() - updateMins * 60 * 1000);

    const ata = `${ataDate.toISOString().slice(0, 10)} ${String(ataDate.getHours()).padStart(2, "0")}:${String(ataDate.getMinutes()).padStart(2, "0")}:00`;
    const timeUpdate = `${updateDate.toISOString().slice(0, 10)} ${String(updateDate.getHours()).padStart(2, "0")}:${String(updateDate.getMinutes()).padStart(2, "0")}:00`;

    const toSacas = 25 + ((i * 7) % 45);
    const toScuttle = 12 + ((i * 5) % 25);
    const toPallet = 6 + ((i * 3) % 15);
    const toTotal = toSacas + toScuttle + toPallet;

    rows.push({
      Status: isDoca ? "Unseal" : "Arrived",
      origin_station_code: origin,
      contagem_tos_sacas_nao_transbordo: isTransbordo ? "0" : String(toSacas),
      contagem_tos_scuttle_or_pallet_nao_transbordo: isTransbordo ? "0" : String(toScuttle + toPallet),
      contagem_tos_sacas_transbordo: isTransbordo ? String(toSacas) : "0",
      contagem_tos_scuttle_or_pallet_transbordo: isTransbordo ? String(toScuttle + toPallet) : "0",
      contagem_ids_sacas_transbordo: isTransbordo ? String(toSacas * 22) : "0",
      contagem_ids_sacas_nao_transbordo: isTransbordo ? "0" : String(toSacas * 22),
      to_scuttle: String(toScuttle),
      to_pallet: String(toPallet),
      to_others: "0",
      orders_scuttle: String(toScuttle * 32),
      orders_pallet: String(toPallet * 45),
      orders_others: "0",
      to_saca: String(toSacas),
      contagem_id_g_nao_transbordo: "80",
      contagem_ids_p_or_pp_nao_transbordo: "210",
      contagem_id_m_nao_transbordo: "150",
      contagem_id_bulky_or_ultrabulky_nao_transbordo: "45",
      ATA: ata,
      "Time Update": timeUpdate,
      "meta descarga": "01:00:00",
      "LH Trip Number": `LT-INB-${100 + i}`,
      "Vehicle Plate Number": `TRK-${10 + i}A${i}`,
      Turno: "T1",
      Operator: operators[(i - 1) % operators.length],
      Driver: drivers[(i - 1) % drivers.length],
      Doca: isDoca ? `EXTERNA${70 + i}` : "-",
      "Pending Inbound TO Pack Type": i % 2 === 0 ? "Saca" : "Scuttle",
      to_total: String(toTotal),
      "Pending Inbound TO": isDoca ? String(Math.round(toTotal * 0.4)) : String(toTotal)
    });
  }

  return rows;
}

export function generateMockInboundHistRows(): Record<string, string>[] {
  const now = new Date();
  const rows: Record<string, string>[] = [];
  const origins = ["HUB_CAMPINAS_01", "HUB_CURITIBA_02", "HUB_RIO_01", "HUB_BH_03", "SOC-SP8", "HUB_RIBEIRAO_01", "HUB_LONDRINA_01", "SOC-RJ2"];

  for (let i = 1; i <= 28; i++) {
    const origin = origins[(i - 1) % origins.length];
    const unloadedAgoMins = 15 + i * 14;
    const unsealAgoMins = unloadedAgoMins + 45;
    const arrivalAgoMins = unsealAgoMins + 30;

    const dtUnloaded = new Date(now.getTime() - unloadedAgoMins * 60 * 1000);
    const dtUnseal = new Date(now.getTime() - unsealAgoMins * 60 * 1000);
    const dtArrival = new Date(now.getTime() - arrivalAgoMins * 60 * 1000);

    const fmt = (d: Date) =>
      `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

    rows.push({
      descarga_unloaded_coalesce: fmt(dtUnloaded),
      chegada_realizada_destino: fmt(dtArrival),
      unseal_datetime: fmt(dtUnseal),
      "tempo descarga": "00:45:00",
      "meta descarga": "01:00:00",
      origin_station_code: origin
    });
  }

  return rows;
}

const programacao: ProgramacaoRow[] = generateMockProgramacao();
const stageRows: StageRow[] = generateMockStageRows();

const docas: Doca[] = Array.from({ length: 30 }, (_, index) => {
  const numero = index + 71;
  const viagem = programacao.find((row) => row.dock === `EXTERNA${numero}`);
  const status = viagem?.status === "Loading" ? "CARREGANDO" : viagem ? "ESPERA" : "LIVRE";

  return {
    numero,
    nome: `EXTERNA${numero}`,
    status,
    trip: viagem?.lh ?? "",
    destino: viagem?.destino ?? "",
    std: viagem?.std ?? "-",
    vehicle: viagem?.vehicle ?? "",
    toPacked: viagem ? 34 : 0,
    toLoaded: viagem?.status === "Loading" ? 18 : 0
  };
});

function toMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function saoPauloNowMs() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

function getTurnoInfo(nowMs = saoPauloNowMs()) {
  const hour = new Date(nowMs).getUTCHours();
  if (hour >= 6 && hour < 14) return { turno: "T1", inicioH: 6, fimH: 14 };
  if (hour >= 14 && hour < 22) return { turno: "T2", inicioH: 14, fimH: 22 };
  return { turno: "T3", inicioH: 22, fimH: 6 };
}

function getJanelaOperacional(turnoInfo: ReturnType<typeof getTurnoInfo>, nowMs = saoPauloNowMs()) {
  const now = new Date(nowMs);
  let start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), turnoInfo.inicioH, 0, 0);
  let end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), turnoInfo.fimH, 0, 0);

  if (turnoInfo.turno === "T3") {
    if (now.getUTCHours() >= 22) {
      end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 6, 0, 0);
    } else {
      start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 22, 0, 0);
      end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0);
    }
  }

  return { startTs: start, endTs: end };
}

function saoPauloCurrentMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function saoPauloCurrentHourStartMs() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), 0, 0);
}

function parseSheetDateTimeMs(value: string) {
  const textValue = text(value);
  const iso = textValue.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (iso) {
    return Date.UTC(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4]),
      Number(iso[5]),
      Number(iso[6] ?? 0)
    );
  }

  const br = textValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (br) {
    const first = Number(br[1]);
    const second = Number(br[2]);
    const day = first > 12 ? first : second > 12 ? second : first;
    const month = first > 12 ? second : second > 12 ? first : second;
    return Date.UTC(
      Number(br[3]),
      month - 1,
      day,
      Number(br[4]),
      Number(br[5]),
      Number(br[6] ?? 0)
    );
  }

  return null;
}

function diffMinutesFromNow(rawDateTime: string, fallbackTime: string) {
  const parsed = parseSheetDateTimeMs(rawDateTime);
  if (parsed !== null) return (parsed - saoPauloNowMs()) / 60000;

  const target = toMinutes(fallbackTime);
  if (target === null) return 9999;
  return target - saoPauloCurrentMinutes();
}

function minutesUntil(time: string) {
  const target = toMinutes(time);
  if (target === null) return 9999;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const diff = target - current;
  return diff < 0 ? diff + 1440 : diff;
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeColumnName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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

function numberValue(value: unknown) {
  const normalized = text(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function durationStrMs(value: unknown) {
  const raw = text(value);
  if (!raw) return 0;
  const timeMatch = raw.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    return (
      Number(timeMatch[1]) * 60 * 60 * 1000 +
      Number(timeMatch[2]) * 60 * 1000 +
      Number(timeMatch[3] ?? 0) * 1000
    );
  }
  const numeric = Number(raw.replace(",", "."));
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 0 && numeric < 10 ? numeric * 24 * 60 * 60 * 1000 : numeric;
}

function formatMsToHms(ms: number) {
  if (ms <= 0 || !Number.isFinite(ms)) return "00:00:00";
  const seconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function extractTime(value: string) {
  const match = text(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "-";
}

function extractDate(value: string) {
  const valueText = text(value);
  const match = valueText.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return `${match[3].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[1]}`;
  const brMatch = valueText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!brMatch) return "-";
  const first = Number(brMatch[1]);
  const second = Number(brMatch[2]);
  const day = first > 12 ? first : second > 12 ? second : first;
  const month = first > 12 ? second : second > 12 ? first : second;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${brMatch[3]}`;
}

function turnoFromTime(time: string) {
  const hour = Number(time.slice(0, 2));
  if (!Number.isFinite(hour)) return "Outros";
  if (hour >= 6 && hour < 14) return "T1";
  if (hour >= 14 && hour < 22) return "T2";
  return "T3";
}

function normalizePackName(packName: string) {
  const upper = packName.toUpperCase();
  if (upper.includes("SCUTTLE") || upper.includes("PALLET") || upper.includes("VOLUMOSO")) {
    return "Scuttle";
  }
  return packName || "N/A";
}

function normalizeStagePackName(packName: string) {
  const value = packName.trim();
  const upper = value.toUpperCase();
  if (upper.includes("PALLET")) return "Pallet";
  if (upper.includes("SCUTTLE")) return "Scuttle";
  if (upper.includes("VOLUMOSO")) return "Volumoso";
  if (upper.includes("SACA")) return "Saca";
  return value || "N/A";
}

function isPacked(status: string) {
  return status.toUpperCase().includes("PACKED");
}

function isPacking(status: string) {
  return status.toUpperCase().includes("PACKING");
}

function isDeparted(status: string) {
  return status.toUpperCase() === "DEPARTED";
}

function isLoading(status: string) {
  const upper = status.toUpperCase();
  return upper === "LOADING" || upper === "CARREGANDO";
}

function isWaiting(status: string) {
  const upper = status.toUpperCase();
  return upper === "IN QUEUE" || upper === "ARRIVED" || upper === "ESPERA" || upper === "AGUARDANDO";
}

function hasOutboundDock(dock: string) {
  const value = dock.trim().toUpperCase();
  return Boolean(value && value !== "-" && value !== "N/A" && value !== "NULL" && value !== "UNDEFINED");
}

function normalizeDockName(value: string) {
  const upper = value.toUpperCase().replace(/\s+/g, "");
  const numberMatch = upper.match(/(\d{2,3})$/);
  if (!numberMatch) return upper;
  return `EXTERNA${numberMatch[1]}`;
}

function mapProgramacaoRow(row: Record<string, string>): ProgramacaoRow {
  const staRaw = pick(row, "STA");
  const sta = extractTime(staRaw);
  const stdRaw = pick(row, "STD");

  return {
    lh: pick(row, "LH Trip Number", "Trip", "LH", "Trip Number"),
    status: pick(row, "Status", "Sts") || "-",
    ontime: pick(row, "On Time Indicator", "On Time", "Ont") || "-",
    vehicle: pick(row, "Vehicle", "Veh") || "-",
    data: extractDate(staRaw),
    stdData: extractDate(stdRaw),
    turno: pick(row, "Turno", "Trn") || turnoFromTime(sta),
    staRaw,
    stdRaw,
    sta,
    std: extractTime(stdRaw),
    ata: extractTime(pick(row, "ATA")),
    etd: extractTime(pick(row, "ETD")),
    dock: pick(row, "Outbound Dock", "Dock") || "-",
    destino: pick(row, "Destino Viagem", "Destino", "Destination", "Dest") || "-",
    station: pick(row, "station_code", "Station Code", "Station") || "N/A",
    driver: pick(row, "Driver", "Motorista", "Dr", "Dr2") || "-",
    operator: pick(row, "Operator", "Operador", "Op") || "-",
    agency: pick(row, "Agency", "Agencia", "Ag", "Agência") || "-",
    classif: pick(row, "Trip Classification", "Classificacao", "Cls") || "-"
  };
}

function mapStageRow(row: Record<string, string>): StageRow | null {
  const toNumber = pick(row, "TO Number", "TO", "TO_Number", "TO number");
  const rua = pick(row, "Rua", "RUA", "street", "Street") || "Sem rua";
  const status = pick(row, "TO Status", "Status", "status") || "-";
  const packName = normalizeStagePackName(pick(row, "Pack_Name", "Pack Name", "pack_name", "PackName"));
  const station = pick(row, "station_code", "Station Code", "Station", "Destino") || "N/A";
  const pacoteColumns = ["TO Order Quantity", "TO_ORDER_QUANTITY", "Order Quantity", "Pacotes", "Packages", "Package", "Package Qty", "Qty Packages", "Total Packages"];
  const pacotes = pacoteColumns.reduce((total, column) => total || numberValue(row[column]), 0);

  if (!toNumber && rua === "Sem rua" && station === "N/A" && packName === "N/A") return null;

  return {
    toNumber,
    status,
    ilha: pick(row, "Ilha", "ilha", "Island") || "-",
    rua,
    station,
    area: pick(row, "Area", "AREA", "area") || "",
    packName,
    cage: pick(row, "Cage", "CAGE", "cage") || "-",
    stagedDuration: pick(row, "Staged Duration", "Duration", "Duracao", "duracao") || "",
    transbordo: pick(row, "Transbordo", "TRANSBORDO", "transbordo") || "Nao",
    minimoAdo: pick(row, "MÍNIMO ADO", "MINIMO ADO", "Mínimo ADO", "Minimo ADO", "minimo_ado", "mínimo ado") || "",
    spp: numberValue(pick(row, "SPP", "spp")),
    tos: 1,
    pacotes,
    packed: isPacked(status) ? 1 : 0,
    packing: isPacking(status) ? 1 : 0
  };
}

function mapDocasRows(rows: Record<string, string>[]): Doca[] {
  const statusDocas = new Map<string, Doca>();

  for (let numero = 70; numero <= 99; numero++) {
    statusDocas.set(`EXTERNA${numero}`, {
      numero,
      nome: `EXTERNA${numero}`,
      status: "LIVRE",
      trip: "",
      destino: "",
      std: "-",
      vehicle: "",
      toPacked: 0,
      toLoaded: 0
    });
  }

  rows.forEach((row) => {
    const dockName = normalizeDockName(pick(row, "Outbound Dock", "Dock"));
    if (!hasOutboundDock(dockName)) return;

    const parsedNumber = Number(dockName.match(/(\d{2,3})$/)?.[1] ?? 0);
    const current =
      statusDocas.get(dockName) ??
      ({
        numero: parsedNumber,
        nome: dockName,
        status: "LIVRE",
        trip: "",
        destino: "",
        std: "-",
        vehicle: "",
        toPacked: 0,
        toLoaded: 0
      } satisfies Doca);

    const status = pick(row, "Status", "Sts");
    current.trip = pick(row, "LH Trip Number", "Trip", "LH", "Trip Number");
    current.destino = pick(row, "Destino Viagem", "Destino", "Destination", "Dest");
    current.std = extractTime(pick(row, "STD"));
    current.vehicle = pick(row, "Vehicle", "Veh");
    current.toPacked = numberValue(pick(row, "TO Packed", "TPck", "Packed"));
    current.toLoaded = numberValue(pick(row, "TO Loaded", "TLd", "Loaded"));

    if (isLoading(status)) current.status = "CARREGANDO";
    else if (!isDeparted(status)) current.status = "ESPERA";

    statusDocas.set(dockName, current);
  });

  return Array.from(statusDocas.values()).sort((a, b) => a.numero - b.numero);
}

function buildStageOut(rows: StageRow[]) {
  const kpis = {
    totalTos: rows.reduce((sum, row) => sum + row.tos, 0),
    totalPacotes: rows.reduce((sum, row) => sum + row.pacotes, 0),
    packed: rows.reduce((sum, row) => sum + row.packed, 0),
    packing: rows.reduce((sum, row) => sum + row.packing, 0),
    ruasOcupadas: uniqueCount(rows.map((row) => row.rua)),
    conclusaoTo: 0
  };

  kpis.conclusaoTo = kpis.totalTos ? Math.round((kpis.packed / kpis.totalTos) * 100) : 0;

  return {
    kpis,
    linhas: rows.map((row) => ({ ...row, packName: normalizeStagePackName(row.packName) }))
  };
}

function buildContagem(rows: StageRow[]) {
  const byStation = new Map<string, ContagemDestino>();

  rows.forEach((row) => {
    const current =
      byStation.get(row.station) ??
      ({
        nome: row.station,
        station: row.station,
        capacidade: 28,
        paletes: 0,
        tos: 0,
        pacotes: 0,
        sacas: 0,
        hora: "22:00",
        ultimoTo: "-",
        ocupacao: 0,
        nivel: "normal"
      } satisfies ContagemDestino);

    const pack = normalizePackName(row.packName);
    current.tos += row.tos;
    current.pacotes += row.pacotes;
    if (pack === "Scuttle" && row.ilha.toUpperCase() === "ALOCADO") current.paletes += row.tos;
    if (pack.toUpperCase().includes("SACA")) current.sacas += row.tos;
    byStation.set(row.station, current);
  });

  const destinos = Array.from(byStation.values())
    .map((item) => {
      const ocupacao = item.capacidade ? Math.round((item.paletes / item.capacidade) * 100) : 0;
      return {
        ...item,
        ocupacao,
        nivel: ocupacao >= 100 ? "critico" : ocupacao >= 70 ? "alerta" : "normal"
      } satisfies ContagemDestino;
    })
    .sort((a, b) => minutesUntil(a.hora) - minutesUntil(b.hora) || b.ocupacao - a.ocupacao);

  return {
    kpis: {
      destinos: destinos.length,
      pacotes: destinos.reduce((sum, item) => sum + item.pacotes, 0),
      tos: destinos.reduce((sum, item) => sum + item.tos, 0),
      criticos: destinos.filter((item) => item.ocupacao >= 70).length
    },
    criticos: destinos.filter((item) => item.ocupacao >= 70),
    destinos
  };
}

function getOcupacaoCritica(rows: StageRow[]) {
  const byStation = new Map<string, { station: string; tos: number; packs: Map<string, number> }>();

  rows.forEach((row) => {
    const current = byStation.get(row.station) ?? { station: row.station, tos: 0, packs: new Map<string, number>() };
    current.tos += row.tos;
    const pack = normalizePackName(row.packName);
    current.packs.set(pack, (current.packs.get(pack) ?? 0) + row.tos);
    byStation.set(row.station, current);
  });

  const list = Array.from(byStation.values()).sort((a, b) => b.tos - a.tos).slice(0, 8);
  const maior = list[0]?.tos ?? 0;

  return list.map((item) => {
    const percentual = maior ? Math.round((item.tos / maior) * 100) : 0;
    return {
      station: item.station,
      tos: item.tos,
      packsQtd: item.packs.size,
      percentual,
      nivel: percentual >= 85 ? "critico" : percentual >= 60 ? "alerta" : "normal",
      packs: Array.from(item.packs.entries()).map(([nome, qtd]) => ({ nome, qtd }))
    };
  });
}

function buildPainel(programacaoRows: ProgramacaoRow[], docasRows: Doca[], stageRowsData: StageRow[]) {
  const monitorCpt = programacaoRows
    .filter((row) => !isDeparted(row.status))
    .map((row) => {
      const minutos = Math.floor(diffMinutesFromNow(row.stdRaw, row.std));
      return {
        lh: row.lh,
        destino: row.destino,
        operador: row.operator,
        cpt: row.std,
        minutos,
        criticidade: minutos < 30 ? "critico" : "alerta"
      };
    })
    .filter((row) => row.minutos >= 0 && row.minutos <= 60)
    .sort((a, b) => a.minutos - b.minutos);

  const currentHourStart = saoPauloCurrentHourStartMs();
  const demanda = Array.from({ length: 24 }, (_, index) => {
    const slotStart = currentHourStart + index * 60 * 60 * 1000;
    const slotEnd = slotStart + 60 * 60 * 1000;
    const hora = new Date(slotStart).getUTCHours();
    const label = `${String(hora).padStart(2, "0")}:00`;
    const qtd = programacaoRows.filter((row) => {
      const stdMs = parseSheetDateTimeMs(row.stdRaw);
      return stdMs !== null && stdMs >= slotStart && stdMs < slotEnd;
    }).length;
    return { hora: label, qtd };
  });

  return {
    kpis: {
      docasOperando: programacaoRows.filter((row) => hasOutboundDock(row.dock)).length,
      limiteCpt: monitorCpt.filter((item) => item.minutos < 30).length,
      chegadasProximas: programacaoRows.filter((row) => {
        const diff = diffMinutesFromNow(row.staRaw, row.sta);
        return !isDeparted(row.status) && diff >= 0 && diff <= 90;
      }).length,
      atrasadasCpt: programacaoRows.filter((row) => !isDeparted(row.status) && diffMinutesFromNow(row.stdRaw, row.std) < 0).length,
      carregando: programacaoRows.filter((row) => isLoading(row.status)).length,
      aguardando: programacaoRows.filter((row) => isWaiting(row.status)).length
    },
    graficoDemandaHoras: demanda,
    monitorCpt,
    ocupacaoCritica: getOcupacaoCritica(stageRowsData)
  };
}

function buildInteligencia(
  painel: ReturnType<typeof buildPainel>,
  contagem: ReturnType<typeof buildContagem>,
  stage: ReturnType<typeof buildStageOut>
) {
  const insights: Insight[] = [];

  painel.monitorCpt.slice(0, 4).forEach((item, index) => {
    insights.push({
      id: `cpt-${index}`,
      tipo: "CPT",
      prioridade: item.minutos < 30 ? "Alta" : "Media",
      titulo: `CPT proximo: ${item.destino}`,
      insight: `A viagem ${item.lh} tem CPT ${item.cpt} e restam ${item.minutos} min.`,
      acao: item.minutos < 30 ? "Acionar doca e operador imediatamente." : "Validar se a carga ja esta em fluxo.",
      impacto: "Reduz risco de perda de SLA.",
      destino: "programacao",
      lh: item.lh,
      valor: `${item.minutos} min`,
      peso: 100 - item.minutos
    });
  });

  painel.ocupacaoCritica
    .filter((item) => item.percentual >= 60)
    .forEach((item, index) => {
      insights.push({
        id: `station-${index}`,
        tipo: "Ocupacao",
        prioridade: item.percentual >= 85 ? "Alta" : "Media",
        titulo: `Station com alta concentracao: ${item.station}`,
        insight: `${item.station} concentra ${item.tos} TOs e esta em ${item.percentual}% do maior volume atual.`,
        acao: "Abrir Stage Out filtrado pela station e verificar Pack_Name dominante.",
        impacto: "Ajuda a balancear rua e prioridade de separacao.",
        destino: "stage",
        station: item.station,
        valor: `${item.percentual}%`,
        peso: 70 + item.percentual
      });
    });

  contagem.criticos.forEach((item, index) => {
    insights.push({
      id: `contagem-${index}`,
      tipo: "Contagem",
      prioridade: item.ocupacao >= 100 ? "Alta" : "Media",
      titulo: `Destino pressionando capacidade: ${item.nome}`,
      insight: `${item.nome} esta com ${item.paletes}/${item.capacidade} PLT.`,
      acao: "Checar retirada, liberacao de espaco ou redistribuicao.",
      impacto: "Reduz gargalo fisico em contagem e stage.",
      destino: "contagem",
      station: item.station,
      valor: `${item.ocupacao}%`,
      peso: 60 + item.ocupacao
    });
  });

  if (stage.kpis.packing > 0) {
    insights.push({
      id: "packing",
      tipo: "Fluxo",
      prioridade: "Baixa",
      titulo: "TOs ainda em Packing",
      insight: `${stage.kpis.packing} TOs ainda nao chegaram ao estado Packed.`,
      acao: "Conferir gargalo entre packing e stage antes do CPT.",
      impacto: "Evita que o risco apareca tarde demais.",
      destino: "stage",
      valor: `${stage.kpis.packing} TOs`,
      peso: 40 + stage.kpis.packing
    });
  }

  const sorted = insights.sort((a, b) => b.peso - a.peso);

  return {
    geradoEm: new Date().toLocaleString("pt-BR"),
    resumo: {
      totalInsights: sorted.length,
      alta: sorted.filter((item) => item.prioridade === "Alta").length,
      media: sorted.filter((item) => item.prioridade === "Media").length,
      baixa: sorted.filter((item) => item.prioridade === "Baixa").length,
      cptMonitorados: painel.monitorCpt.length,
      stationsCriticas: painel.ocupacaoCritica.filter((item) => item.nivel === "critico").length
    },
    insights: sorted,
    fundamentos: {
      cpt: painel.monitorCpt,
      ocupacao: painel.ocupacaoCritica,
      ruas: stage.linhas
    }
  };
}

function isInboundTransbordo(origem: string) {
  const value = origem.trim().toUpperCase();
  return value === "SOC-SP8" || value === "SOC-RJ2";
}

function buildInbound(filaRows: Record<string, string>[], histRows: Record<string, string>[], metaAwtHours: number): InboundDashboard {
  const nowMs = saoPauloNowMs();
  const turnoInfo = getTurnoInfo(nowMs);
  const janela = getJanelaOperacional(turnoInfo, nowMs);
  const metaFilaMs = 3 * 60 * 60 * 1000;
  const metaAwtMs = (metaAwtHours || 4.6) * 60 * 60 * 1000;
  let somaFila = 0;
  let somaDoca = 0;
  let somaMetaDoca = 0;
  let qtdDesc = 0;
  let somaFilaT = 0;
  let somaDocaT = 0;
  let qtdDescT = 0;

  histRows.forEach((row) => {
    const dtDesc = parseSheetDateTimeMs(pick(row, "descarga_unloaded_coalesce"));
    if (dtDesc === null || dtDesc < janela.startTs || dtDesc > janela.endTs) return;

    const tsChegada = parseSheetDateTimeMs(pick(row, "chegada_realizada_destino"));
    const tsDocagem = parseSheetDateTimeMs(pick(row, "unseal_datetime"));
    const tempoDocaMs = durationStrMs(pick(row, "tempo descarga", "tempo_descarga_horas"));
    const metaDocaMs = durationStrMs(pick(row, "meta descarga")) || 60 * 60 * 1000;
    const origem = pick(row, "origin_station_code");
    const transbordo = isInboundTransbordo(origem);

    if (tsChegada !== null && tsDocagem !== null) {
      const tempoFilaMs = tsDocagem - tsChegada;
      somaFila += tempoFilaMs;
      somaDoca += tempoDocaMs;
      somaMetaDoca += metaDocaMs;
      qtdDesc += 1;

      if (transbordo) {
        somaFilaT += tempoFilaMs;
        somaDocaT += tempoDocaMs;
        qtdDescT += 1;
      }
    }
  });

  let countFila = 0;
  let countDoca = 0;
  let countFilaT = 0;
  let countDocaT = 0;
  const veiculos: InboundVehicle[] = [];

  filaRows.forEach((row) => {
    const status = pick(row, "Status", "status", "status_agrupado");
    const normalizedStatus = status.trim().toLowerCase();
    const isArrivedStatus = normalizedStatus === "arrived" || normalizedStatus.includes("arrived");
    const isUnsealStatus = normalizedStatus === "unseal" || normalizedStatus.includes("unseal");
    if (!isUnsealStatus && !isArrivedStatus) return;

    const origem = pick(row, "origin_station_code");
    const isTransbordo = isInboundTransbordo(origem);
    const sacasNaoTrans = numberValue(pick(row, "contagem_tos_sacas_nao_transbordo"));
    const palletsNaoTrans = numberValue(pick(row, "contagem_tos_scuttle_or_pallet_nao_transbordo"));
    const sacasTrans = numberValue(pick(row, "contagem_tos_sacas_transbordo"));
    const palletsTrans = numberValue(pick(row, "contagem_tos_scuttle_or_pallet_transbordo"));
    const inboundMetrics: InboundVehicle["inboundMetrics"] = {
      contagemIdsSacasTransbordo: numberValue(pick(row, "contagem_ids_sacas_transbordo")),
      contagemIdsSacasNaoTransbordo: numberValue(pick(row, "contagem_ids_sacas_nao_transbordo")),
      toScuttle: numberValue(pick(row, "to_scuttle")),
      toPallet: numberValue(pick(row, "to_pallet")),
      toOthers: numberValue(pick(row, "to_others")),
      ordersScuttle: numberValue(pick(row, "orders_scuttle")),
      ordersPallet: numberValue(pick(row, "orders_pallet")),
      ordersOthers: numberValue(pick(row, "orders_others")),
      toSaca: numberValue(pick(row, "to_saca")),
      contagemIdGNaoTransbordo: numberValue(pick(row, "contagem_id_g_nao_transbordo")),
      contagemIdsPOrPpNaoTransbordo: numberValue(pick(row, "contagem_ids_p_or_pp_nao_transbordo")),
      contagemIdMNaoTransbordo: numberValue(pick(row, "contagem_id_m_nao_transbordo")),
      contagemIdBulkyOrUltrabulkyNaoTransbordo: numberValue(pick(row, "contagem_id_bulky_or_ultrabulky_nao_transbordo"))
    };
    let tipoCarga: InboundVehicle["tipoCarga"] = "Comum";
    if (isTransbordo) tipoCarga = "Transbordo";
    else if (sacasTrans > 0 || palletsTrans > 0) tipoCarga = "Mista";

    const tsQueue = parseSheetDateTimeMs(pick(row, "ATA"));
    const tsUpdate = parseSheetDateTimeMs(pick(row, "Time Update"));
    let metaDocaFmt = pick(row, "meta descarga") || "01:00:00";
    let metaDocaMs = durationStrMs(metaDocaFmt);
    if (metaDocaMs === 0) {
      metaDocaMs = 60 * 60 * 1000;
      metaDocaFmt = "01:00:00";
    }

    let tempoFilaAtual = 0;
    let tempoDocaAtual = 0;
    if (isArrivedStatus) {
      countFila += 1;
      if (isTransbordo) countFilaT += 1;
      if (tsQueue !== null) tempoFilaAtual = nowMs - tsQueue;
    }
    if (isUnsealStatus) {
      countDoca += 1;
      if (isTransbordo) countDocaT += 1;
      if (tsQueue !== null && tsUpdate !== null) {
        tempoFilaAtual = tsUpdate - tsQueue;
        tempoDocaAtual = nowMs - tsUpdate;
      }
    }

    somaFila += tempoFilaAtual;
    somaDoca += tempoDocaAtual;
    somaMetaDoca += metaDocaMs;
    if (isTransbordo) {
      somaFilaT += tempoFilaAtual;
      somaDocaT += tempoDocaAtual;
    }

    veiculos.push({
      lt: pick(row, "LH Trip Number", "trip_number") || "-",
      origem,
      placa: pick(row, "Vehicle Plate Number", "vehicle_number") || "-",
      turno: pick(row, "Turno") || "-",
      operador: pick(row, "Operator") || "-",
      driver: pick(row, "Driver", "driver", "Motorista") || "-",
      doca: pick(row, "Doca", "Outbound Dock") || "-",
      status,
      processo: isArrivedStatus ? "Em Fila" : "Em Doca",
      tipoCarga,
      pendingInboundToPackType: pick(row, "Pending Inbound TO Pack Type") || "-",
      toTotal: pick(row, "to_total", "TO Total", "Total TO") || "-",
      pendingInboundTo: pick(row, "Pending Inbound TO") || "-",
      mixCounts: {
        sacasNaoTransbordo: sacasNaoTrans,
        scuttleOuPalletNaoTransbordo: palletsNaoTrans,
        sacasTransbordo: sacasTrans,
        scuttleOuPalletTransbordo: palletsTrans
      },
      inboundMetrics,
      tsQueue,
      tsUpdate,
      metaFilaMs,
      metaFilaFmt: "03:00:00",
      metaDocaMs,
      metaDocaFmt,
      metaAwtMs: metaFilaMs + metaDocaMs,
      metaAwtFmt: formatMsToHms(metaFilaMs + metaDocaMs),
      isTransbordo
    });
  });

  const denFila = qtdDesc + countFila + countDoca;
  const denDoca = qtdDesc + countDoca;
  const denTotal = qtdDesc + countFila + countDoca;
  const denFilaT = qtdDescT + countFilaT + countDocaT;
  const denDocaT = qtdDescT + countDocaT;
  const denTotalT = qtdDescT + countFilaT + countDocaT;

  return {
    serverNowMs: nowMs,
    veiculos,
    resumo: {
      turno: turnoInfo.turno,
      descarregados: qtdDesc,
      emFila: countFila,
      emDoca: countDoca,
      transbordo: { desc: qtdDescT, fila: countFilaT, doca: countDocaT },
      fila: { real: denFila > 0 ? somaFila / denFila : 0, meta: metaFilaMs, tReal: denFilaT > 0 ? somaFilaT / denFilaT : 0 },
      doca: { real: denDoca > 0 ? somaDoca / denDoca : 0, meta: denTotal > 0 ? somaMetaDoca / denTotal : 60 * 60 * 1000, tReal: denDocaT > 0 ? somaDocaT / denDocaT : 0 },
      total: {
        real: denTotal > 0 ? (somaFila + somaDoca) / denTotal : 0,
        meta: metaAwtMs,
        tReal: denTotalT > 0 ? (somaFilaT + somaDocaT) / denTotalT : 0
      }
    }
  };
}

type DashboardReadOptions = { forceRefresh?: boolean };

function liveSheetOptions(options?: DashboardReadOptions, cacheLabel?: string) {
  return {
    ttlMs: LIVE_CACHE_TTL_MS,
    forceRefresh: options?.forceRefresh,
    cacheLabel
  };
}

async function readDbAllRows(options?: DashboardReadOptions) {
  if (!hasGoogleSheetsEnv()) return [];
  return readSheetRows("db_all", DB_ALL_RANGE, undefined, liveSheetOptions(options, "db_all"));
}

async function readInboundRows(options?: DashboardReadOptions) {
  if (!hasGoogleSheetsEnv() || !INBOUND_SPREADSHEET_ID) {
    return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
  }
  try {
    const [filaRows, histRows] = await Promise.all([
      readSheetRows("Fila atual", INBOUND_FILA_RANGE, INBOUND_SPREADSHEET_ID, liveSheetOptions(options, "Live Inbound - fila atual")),
      readSheetRows(
        "export_historico_descarregado",
        INBOUND_HIST_RANGE,
        INBOUND_SPREADSHEET_ID,
        liveSheetOptions(options, "Live Inbound - historico descarregado")
      )
    ]);

    if (filaRows.length === 0 && histRows.length === 0) {
      return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
    }

    let metaAwtHours = 4.6;
    try {
      const configB5 = await readSheetValues(
        "Configura\u00e7\u00f5es",
        "B5:B5",
        INBOUND_SPREADSHEET_ID,
        liveSheetOptions(options, "Live Inbound - configuracoes")
      );
      metaAwtHours = numberValue(configB5[0]?.[0]) || 4.6;
    } catch {
      // standard fallback
    }

    return { filaRows, histRows, metaAwtHours };
  } catch {
    return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
  }
}

async function readStageInRows(options?: DashboardReadOptions) {
  if (!hasGoogleSheetsEnv() || !INBOUND_SPREADSHEET_ID) {
    return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
  }
  try {
    const filaRows = await readSheetRows(
      "Fila atual",
      INBOUND_FILA_RANGE,
      INBOUND_SPREADSHEET_ID,
      liveSheetOptions(options, "Live Inbound - fila atual")
    );

    if (filaRows.length === 0) {
      return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
    }

    return { filaRows, histRows: [], metaAwtHours: 4.6 };
  } catch {
    return { filaRows: generateMockInboundFilaRows(), histRows: generateMockInboundHistRows(), metaAwtHours: 4.6 };
  }
}

async function readTosPackedRows(options?: DashboardReadOptions) {
  if (!hasGoogleSheetsEnv()) return [];
  return readSheetRows("tos_packed", TOS_PACKED_RANGE, undefined, liveSheetOptions(options, "tos_packed"));
}

function programacaoFromDbRows(rows: Record<string, string>[]) {
  return rows
    .filter((row) => pick(row, "LH Trip Number", "Trip", "LH", "Trip Number"))
    .map(mapProgramacaoRow)
    .sort((a, b) => {
      const aTime = toMinutes(a.sta) ?? 9999;
      const bTime = toMinutes(b.sta) ?? 9999;
      return aTime - bTime || a.lh.localeCompare(b.lh);
    });
}

function stageFromTosRows(rows: Record<string, string>[]) {
  return rows.map(mapStageRow).filter((row): row is StageRow => Boolean(row));
}

export function getProgramacao() {
  return programacao;
}

export async function getProgramacaoReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-programacao:v1",
        label: "Programacao",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rows = await readDbAllRows(options);
        const viagens = programacaoFromDbRows(rows);
        return viagens.length ? viagens : getProgramacao();
      }
    );
  } catch (error) {
    console.error("Erro ao ler a aba db_all no Google Sheets:", error);
    return getProgramacao();
  }
}

export function getDocas() {
  return docas;
}

export async function getDocasReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-docas:v1",
        label: "Docas",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rows = await readDbAllRows(options);
        const realDocas = mapDocasRows(rows);
        return rows.length ? realDocas : getDocas();
      }
    );
  } catch (error) {
    console.error("Erro ao montar docas reais:", error);
    return getDocas();
  }
}

export function getStageOut() {
  return buildStageOut(stageRows);
}

export async function getStageOutReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-stage-out:v1",
        label: "Stage Out",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rows = await readTosPackedRows(options);
        const realStageRows = stageFromTosRows(rows);
        return realStageRows.length ? buildStageOut(realStageRows) : getStageOut();
      }
    );
  } catch (error) {
    console.error("Erro ao montar Stage Out real:", error);
    return getStageOut();
  }
}

export function getContagem() {
  return buildContagem(stageRows);
}

export async function getContagemReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-contagem:v1",
        label: "Contagem",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const rows = await readTosPackedRows(options);
        const realStageRows = stageFromTosRows(rows);
        return realStageRows.length ? buildContagem(realStageRows) : getContagem();
      }
    );
  } catch (error) {
    console.error("Erro ao montar Contagem real:", error);
    return getContagem();
  }
}

export function getPainel() {
  return buildPainel(programacao, docas, stageRows);
}

export async function getPainelReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-painel:v1",
        label: "Painel geral",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const [dbAllRows, tosRows] = await Promise.all([readDbAllRows(options), readTosPackedRows(options)]);
        const realProgramacao = programacaoFromDbRows(dbAllRows);
        const realDocas = dbAllRows.length ? mapDocasRows(dbAllRows) : docas;
        const realStageRows = stageFromTosRows(tosRows);

        return buildPainel(
          realProgramacao.length ? realProgramacao : programacao,
          realDocas,
          realStageRows.length ? realStageRows : stageRows
        );
      }
    );
  } catch (error) {
    console.error("Erro ao montar Painel real:", error);
    return getPainel();
  }
}

export function getInteligencia() {
  const painel = getPainel();
  const contagem = getContagem();
  const stage = getStageOut();
  return buildInteligencia(painel, contagem, stage);
}

export function getInbound(): InboundDashboard {
  return buildInbound(generateMockInboundFilaRows(), generateMockInboundHistRows(), 4.6);
}

export async function getInboundReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: `dashboard-inbound:v1:${INBOUND_SPREADSHEET_ID}`,
        label: "Live Inbound",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const { filaRows, histRows, metaAwtHours } = await readInboundRows(options);
        return buildInbound(filaRows, histRows, metaAwtHours);
      }
    );
  } catch (error) {
    console.error("Erro ao montar Live Inbound real:", error);
    return getInbound();
  }
}

export async function getStageInReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: `dashboard-stage-in:v1:${INBOUND_SPREADSHEET_ID}`,
        label: "Stage In",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const { filaRows, histRows, metaAwtHours } = await readStageInRows(options);
        return buildInbound(filaRows, histRows, metaAwtHours);
      }
    );
  } catch (error) {
    console.error("Erro ao montar Live Inbound real:", error);
    return getInbound();
  }
}

export async function getInteligenciaReal(options?: DashboardReadOptions) {
  try {
    return withComputedCache(
      {
        key: "dashboard-inteligencia:v1",
        label: "Inteligencia",
        ttlMs: LIVE_CACHE_TTL_MS,
        forceRefresh: options?.forceRefresh
      },
      async () => {
        const [dbAllRows, tosRows] = await Promise.all([readDbAllRows(options), readTosPackedRows(options)]);
        const realProgramacao = programacaoFromDbRows(dbAllRows);
        const realDocas = dbAllRows.length ? mapDocasRows(dbAllRows) : docas;
        const realStageRows = stageFromTosRows(tosRows);
        const safeProgramacao = realProgramacao.length ? realProgramacao : programacao;
        const safeStageRows = realStageRows.length ? realStageRows : stageRows;
        const painel = buildPainel(safeProgramacao, realDocas, safeStageRows);
        const contagem = buildContagem(safeStageRows);
        const stage = buildStageOut(safeStageRows);
        return buildInteligencia(painel, contagem, stage);
      }
    );
  } catch (error) {
    console.error("Erro ao montar Inteligencia real:", error);
    return getInteligencia();
  }
}

export async function getDashboardReal() {
  try {
    return withComputedCache(
      {
        key: "dashboard-completo:v1",
        label: "Dashboard completo",
        ttlMs: LIVE_CACHE_TTL_MS
      },
      async () => {
        const [dbAllRows, tosRows] = await Promise.all([readDbAllRows(), readTosPackedRows()]);
        const realProgramacao = programacaoFromDbRows(dbAllRows);
        const realDocas = dbAllRows.length ? mapDocasRows(dbAllRows) : docas;
        const realStageRows = stageFromTosRows(tosRows);
        const safeProgramacao = realProgramacao.length ? realProgramacao : programacao;
        const safeStageRows = realStageRows.length ? realStageRows : stageRows;
        const stage = buildStageOut(safeStageRows);
        const contagem = buildContagem(safeStageRows);
        const painel = buildPainel(safeProgramacao, realDocas, safeStageRows);
        const inteligencia = buildInteligencia(painel, contagem, stage);
        const inbound = await getInboundReal();

        return {
          painel,
          programacao: safeProgramacao,
          stage,
          docas: realDocas,
          contagem,
          inteligencia,
          inbound
        };
      }
    );
  } catch (error) {
    console.error("Erro ao montar dashboard real:", error);
    return {
      painel: getPainel(),
      programacao: getProgramacao(),
      stage: getStageOut(),
      docas: getDocas(),
      contagem: getContagem(),
      inteligencia: getInteligencia(),
      inbound: getInbound()
    };
  }
}
