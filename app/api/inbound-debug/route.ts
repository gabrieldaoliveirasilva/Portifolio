import { NextResponse } from "next/server";
import { getGoogleSheetsEnvStatus, readSheetRows } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const INBOUND_SPREADSHEET_ID =
  process.env.GOOGLE_INBOUND_SPREADSHEET_ID || "18Oe0AErhmA25Ihtu5eW-pPf1GLy-lphkedTUwZkYUeE";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const exact = row[key];
    if (exact !== undefined && text(exact) !== "") return text(exact);

    const normalizedKey = key.toLowerCase().trim();
    const foundKey = Object.keys(row).find((candidate) => candidate.toLowerCase().trim() === normalizedKey);
    if (foundKey && text(row[foundKey]) !== "") return text(row[foundKey]);
  }
  return "";
}

function parseDateTimeMs(value: string) {
  const raw = text(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    return Date.UTC(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      Number(isoMatch[4]),
      Number(isoMatch[5]),
      Number(isoMatch[6] ?? 0)
    );
  }

  const brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (brMatch) {
    return Date.UTC(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1]),
      Number(brMatch[4]),
      Number(brMatch[5]),
      Number(brMatch[6] ?? 0)
    );
  }

  return null;
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

function currentShift() {
  const nowMs = saoPauloNowMs();
  const now = new Date(nowMs);
  const hour = now.getUTCHours();
  const turno = hour >= 6 && hour < 14 ? "T1" : hour >= 14 && hour < 22 ? "T2" : "T3";
  const inicioH = turno === "T1" ? 6 : turno === "T2" ? 14 : 22;
  const fimH = turno === "T1" ? 14 : turno === "T2" ? 22 : 6;

  let startTs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), inicioH, 0, 0);
  let endTs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), fimH, 0, 0);

  if (turno === "T3") {
    if (hour >= 22) {
      endTs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 6, 0, 0);
    } else {
      startTs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 22, 0, 0);
    }
  }

  return { turno, startTs, endTs };
}

function statusCounts(rows: Record<string, string>[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const status = pick(row, "Status") || "(vazio)";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function publicEnvStatus(env: ReturnType<typeof getGoogleSheetsEnvStatus>) {
  return {
    spreadsheetIdConfigured: env.spreadsheetIdConfigured,
    newPageSpreadsheetIdConfigured: env.newPageSpreadsheetIdConfigured,
    serviceAccountEmailConfigured: env.serviceAccountEmailConfigured,
    privateKeyConfigured: env.privateKeyConfigured,
    privateKeyLooksValid: env.privateKeyLooksValid,
    allConfigured: env.allConfigured
  };
}

export async function GET() {
  const env = getGoogleSheetsEnvStatus();
  if (!env.allConfigured) {
    return NextResponse.json({
      ok: false,
      etapa: "variaveis_google",
      mensagem: "Variaveis principais do Google Sheets incompletas.",
      env: publicEnvStatus(env)
    });
  }

  try {
    const [filaRows, histRows] = await Promise.all([
      readSheetRows("Fila atual", "A:CA", INBOUND_SPREADSHEET_ID),
      readSheetRows("export_historico_descarregado", "A:CA", INBOUND_SPREADSHEET_ID)
    ]);

    const shift = currentShift();
    const descarregadosTurno = histRows.filter((row) => {
      const dtDesc = parseDateTimeMs(pick(row, "descarga_unloaded_coalesce"));
      const chegada = parseDateTimeMs(pick(row, "chegada_realizada_destino"));
      const unseal = parseDateTimeMs(pick(row, "unseal_datetime"));
      return dtDesc !== null && dtDesc >= shift.startTs && dtDesc <= shift.endTs && chegada !== null && unseal !== null;
    });

    return NextResponse.json({
      ok: true,
      spreadsheetIdInboundConfigurado: Boolean(process.env.GOOGLE_INBOUND_SPREADSHEET_ID),
      usandoSpreadsheetIdPadrao: !process.env.GOOGLE_INBOUND_SPREADSHEET_ID,
      turnoAtual: {
        turno: shift.turno,
        inicio: new Date(shift.startTs).toISOString(),
        fim: new Date(shift.endTs).toISOString()
      },
      filaAtual: {
        linhasLidas: filaRows.length,
        colunasEncontradas: filaRows[0] ? Object.keys(filaRows[0]) : [],
        contagemPorStatus: statusCounts(filaRows),
        cardVeiculosNaFila: filaRows.filter((row) => pick(row, "Status") === "Arrived").length,
        cardVeiculosNaDoca: filaRows.filter((row) => pick(row, "Status") === "Unseal").length
      },
      historicoDescarregado: {
        linhasLidas: histRows.length,
        colunasEncontradas: histRows[0] ? Object.keys(histRows[0]) : [],
        cardDescarregados: descarregadosTurno.length,
        linhasComDescargaNoTurnoSemObrigatorias: histRows.filter((row) => {
          const dtDesc = parseDateTimeMs(pick(row, "descarga_unloaded_coalesce"));
          return dtDesc !== null && dtDesc >= shift.startTs && dtDesc <= shift.endTs;
        }).length
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      etapa: "leitura_inbound",
      erro: errorMessage(error),
      dica: "Confira permissao da conta de servico, ID da planilha inbound e nomes das abas."
    });
  }
}
