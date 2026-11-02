import { NextResponse } from "next/server";
import { getGoogleSheetsEnvStatus, readSheetRows, readSheetValues } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const INBOUND_SPREADSHEET_ID =
  process.env.GOOGLE_INBOUND_SPREADSHEET_ID || "18Oe0AErhmA25Ihtu5eW-pPf1GLy-lphkedTUwZkYUeE";
const CONFIGURACOES_SHEET = "Configura\u00e7\u00f5es";

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

async function checkRows(sheetName: "Fila atual" | "export_historico_descarregado") {
  try {
    const rows = await readSheetRows(sheetName, "A1:CA25", INBOUND_SPREADSHEET_ID);
    return {
      ok: true,
      linhasLidasNaAmostra: rows.length,
      colunasEncontradas: rows[0] ? Object.keys(rows[0]) : []
    };
  } catch (error) {
    return {
      ok: false,
      erro: errorMessage(error)
    };
  }
}

async function checkConfig() {
  try {
    const values = await readSheetValues(CONFIGURACOES_SHEET, "B5:B5", INBOUND_SPREADSHEET_ID);
    return {
      ok: true,
      valorB5: values[0]?.[0] ?? ""
    };
  } catch (error) {
    return {
      ok: false,
      erro: errorMessage(error),
      observacao: "A pagina Inbound continua funcionando sem essa aba, usando meta AWT padrao de 4,6h."
    };
  }
}

export async function GET() {
  const env = getGoogleSheetsEnvStatus();

  if (!env.allConfigured) {
    return NextResponse.json({
      ok: false,
      etapa: "variaveis_google",
      mensagem: "As variaveis principais da conta de servico do Google Sheets nao estao completas.",
      env: publicEnvStatus(env)
    });
  }

  const [filaAtual, historico, configuracoes] = await Promise.all([
    checkRows("Fila atual"),
    checkRows("export_historico_descarregado"),
    checkConfig()
  ]);

  return NextResponse.json({
    ok: Boolean(filaAtual.ok),
    spreadsheetIdInboundConfigurado: Boolean(process.env.GOOGLE_INBOUND_SPREADSHEET_ID),
    usandoSpreadsheetIdPadrao: !process.env.GOOGLE_INBOUND_SPREADSHEET_ID,
    mensagem: filaAtual.ok
      ? "A aba principal do Inbound foi lida."
      : "Nao foi possivel ler a aba principal do Inbound.",
    abas: {
      "Fila atual": filaAtual,
      export_historico_descarregado: historico,
      Configuracoes: configuracoes
    }
  });
}
