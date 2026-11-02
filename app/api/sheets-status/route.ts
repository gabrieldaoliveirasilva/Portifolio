import { NextResponse } from "next/server";
import { getGoogleSheetsEnvStatus, readSheetRows } from "@/lib/data-source";

export const dynamic = "force-dynamic";

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
      etapa: "variaveis",
      mensagem: "A Vercel ainda nao esta recebendo todas as variaveis do Google Sheets.",
      env: publicEnvStatus(env)
    });
  }

  if (!env.privateKeyLooksValid) {
    return NextResponse.json({
      ok: false,
      etapa: "private_key",
      mensagem: "A variavel GOOGLE_PRIVATE_KEY nao parece ser a chave privada do JSON da conta de servico.",
      env: publicEnvStatus(env)
    });
  }

  try {
    const dbAllRows = await readSheetRows("db_all", "A1:Q25");
    const tosPackedRows = await readSheetRows("tos_packed", "A1:Q25");
    const dbAllColumns = dbAllRows[0] ? Object.keys(dbAllRows[0]) : [];
    const tosPackedColumns = tosPackedRows[0] ? Object.keys(tosPackedRows[0]) : [];

    return NextResponse.json({
      ok: true,
      etapa: "leitura",
      mensagem: "Conexao com Google Sheets funcionando.",
      abas: {
        db_all: {
          linhasLidasNaAmostra: dbAllRows.length,
          colunasEncontradas: dbAllColumns
        },
        tos_packed: {
          linhasLidasNaAmostra: tosPackedRows.length,
          colunasEncontradas: tosPackedColumns
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      etapa: "google_sheets",
      mensagem: "A Vercel recebeu as variaveis, mas nao conseguiu ler a planilha.",
      erro: errorMessage(error),
      dica: "Confira se a planilha foi compartilhada como leitor com o e-mail da conta de servico e se o SPREADSHEET_ID esta correto.",
      env: publicEnvStatus(env)
    });
  }
}
