// AI maintenance map: single gateway for Google Sheets credentials, ranges,
// cache, concurrent-request deduplication and stale fallback. Domain modules
// should call this file instead of importing googleapis directly.
import { google } from "googleapis";
import { unstable_cache } from "next/cache";

export type SheetName =
  | "raw"
  | "hist"
  | "hist_prod"
  | "db_all"
  | "tos_packed"
  | "db_ajustada"
  | "db_banco"
  | "ultima_att"
  | "Fila atual"
  | "export_historico_descarregado"
  | "Configura\u00e7\u00f5es"
  | "Jutificativas In"
  | "Pr\u00e9_Calculo_Dash"
  | "Acompanhamento";

type SheetsClient = ReturnType<typeof google.sheets>;
export const LIVE_CACHE_TTL_MS = 60 * 1000;
export const HISTORICO_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export type SheetReadOptions = {
  ttlMs?: number;
  forceRefresh?: boolean;
  cacheLabel?: string;
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  fetchedAt: number;
};

let sheetsClient: SheetsClient | null = null;
const sheetCache = new Map<string, CacheEntry<unknown>>();
const pendingSheetReads = new Map<string, Promise<unknown>>();
let sheetCacheWarnings: string[] = [];

export function clearSheetCacheWarnings() {
  sheetCacheWarnings = [];
}

export function getSheetCacheWarnings() {
  return [...sheetCacheWarnings];
}

function addSheetCacheWarning(message: string) {
  if (!sheetCacheWarnings.includes(message)) {
    sheetCacheWarnings.push(message);
  }
}

export function hasGoogleSheetsEnv() {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

function hasGoogleAuthEnv() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export function getNewPageSpreadsheetId() {
  return process.env.GOOGLE_PRODUCTIVITY_SPREADSHEET_ID || "";
}

export function getHistoricoPackingSpreadsheetId() {
  return process.env.GOOGLE_HIST_PROD_SPREADSHEET_ID || "";
}

export function getHistoricoOutboundSpreadsheetId() {
  return process.env.GOOGLE_HIST_OUT_SPREADSHEET_ID || "";
}

export function getHistoricoInboundSpreadsheetId() {
  return process.env.GOOGLE_HIST_INB_SPREADSHEET_ID || process.env.GOOGLE_INBOUND_SPREADSHEET_ID || "";
}

export function getGerotSpreadsheetId() {
  return process.env.GOOGLE_GEROT_SPREADSHEET_ID || "";
}

export function hasNewPageSheetsEnv() {
  return Boolean(getNewPageSpreadsheetId() && hasGoogleAuthEnv());
}

function getPrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
}

export function getGoogleSheetsEnvStatus() {
  const privateKey = getPrivateKey();
  const trimmedPrivateKey = privateKey.trim();

  return {
    spreadsheetIdConfigured: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
    newPageSpreadsheetIdConfigured: Boolean(getNewPageSpreadsheetId()),
    serviceAccountEmailConfigured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
    privateKeyConfigured: Boolean(privateKey),
    privateKeyLooksValid:
      trimmedPrivateKey.startsWith("-----BEGIN PRIVATE KEY-----") &&
      trimmedPrivateKey.includes("-----END PRIVATE KEY-----"),
    allConfigured: hasGoogleSheetsEnv()
  };
}

function escapeSheetName(sheetName: string) {
  return sheetName.replace(/'/g, "''");
}

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getPrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

function rowToObject(headers: string[], row: unknown[]) {
  return headers.reduce<Record<string, string>>((acc, header, index) => {
    const key = String(header ?? "").trim();
    if (key) acc[key] = String(row[index] ?? "").trim();
    return acc;
  }, {});
}

function makeCacheKey(kind: string, spreadsheetId: string, sheetName: string, range: string) {
  return [kind, spreadsheetId, sheetName, range].join("::");
}

function getRevalidateSeconds(ttlMs: number) {
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

async function withSheetCache<T>(
  cacheKey: string,
  options: SheetReadOptions | undefined,
  loader: () => Promise<T>,
  label: string
) {
  const ttlMs = options?.ttlMs ?? LIVE_CACHE_TTL_MS;
  const cached = sheetCache.get(cacheKey) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (!options?.forceRefresh && cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pendingKey = `${cacheKey}::${options?.forceRefresh ? "refresh" : "cached"}`;
  const pending = pendingSheetReads.get(pendingKey) as Promise<T> | undefined;
  if (pending) return pending;

  const request = (async () => {
    try {
      const readFreshData = async () => {
        const data = await loader();
        const fetchedAt = Date.now();
        sheetCache.set(cacheKey, { data, fetchedAt, expiresAt: fetchedAt + ttlMs });
        return data;
      };

      const data = options?.forceRefresh
        ? await readFreshData()
        : await unstable_cache(readFreshData, ["google-sheet", cacheKey], {
            revalidate: getRevalidateSeconds(ttlMs)
          })();

      const fetchedAt = Date.now();
      sheetCache.set(cacheKey, { data, fetchedAt, expiresAt: fetchedAt + ttlMs });
      return data;
    } catch (error) {
      const fallback = sheetCache.get(cacheKey) as CacheEntry<T> | undefined;
      if (fallback) {
        const warning = `${label}: dados podem estar desatualizados.`;
        addSheetCacheWarning(warning);
        console.warn(`${warning} Usando ultimo cache valido.`, error);
        return fallback.data;
      }

      throw error;
    }
  })();

  pendingSheetReads.set(pendingKey, request);

  try {
    return await request;
  } finally {
    if (pendingSheetReads.get(pendingKey) === request) {
      pendingSheetReads.delete(pendingKey);
    }
  }
}

export async function readSheetRows(
  sheetName: SheetName,
  columnRange = "A:ZZ",
  spreadsheetIdOverride?: string,
  options?: SheetReadOptions
): Promise<Record<string, string>[]> {
  if (!hasGoogleAuthEnv()) return [];

  const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return [];

  const label = options?.cacheLabel || String(sheetName);

  return withSheetCache(
    makeCacheKey("rows", spreadsheetId, sheetName, columnRange),
    options,
    async () => {
      const sheets = getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${escapeSheetName(sheetName)}'!${columnRange}`,
        valueRenderOption: "FORMATTED_VALUE"
      });

      const values = response.data.values ?? [];
      const [rawHeaders, ...rows] = values;
      if (!rawHeaders?.length) return [];

      const headers = rawHeaders.map((header) => String(header ?? "").trim());
      return rows
        .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
        .map((row) => rowToObject(headers, row));
    },
    label
  );
}

export async function readSheetValues(
  sheetName: SheetName,
  range = "A:ZZ",
  spreadsheetIdOverride?: string,
  options?: SheetReadOptions
): Promise<string[][]> {
  if (!hasGoogleAuthEnv()) return [];

  const spreadsheetId = spreadsheetIdOverride || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return [];

  const label = options?.cacheLabel || String(sheetName);

  return withSheetCache(
    makeCacheKey("values", spreadsheetId, sheetName, range),
    options,
    async () => {
      const sheets = getSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${escapeSheetName(sheetName)}'!${range}`,
        valueRenderOption: "FORMATTED_VALUE"
      });

      return (response.data.values ?? []).map((row) => row.map((cell) => String(cell ?? "").trim()));
    },
    label
  );
}
