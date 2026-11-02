import { NextResponse } from "next/server";
import { getGoogleSheetsEnvStatus, getNewPageSpreadsheetId, readSheetRows } from "@/lib/data-source";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function publicEnvStatus(env: ReturnType<typeof getGoogleSheetsEnvStatus>) {
  return {
    productivitySpreadsheetIdConfigured: env.newPageSpreadsheetIdConfigured,
    serviceAccountEmailConfigured: env.serviceAccountEmailConfigured,
    privateKeyConfigured: env.privateKeyConfigured,
    privateKeyLooksValid: env.privateKeyLooksValid
  };
}

export async function GET() {
  const env = getGoogleSheetsEnvStatus();

  if (!env.serviceAccountEmailConfigured || !env.privateKeyConfigured) {
    return NextResponse.json({
      ok: false,
      etapa: "variaveis_google",
      mensagem: "Faltam credenciais do Google na Vercel.",
      env: publicEnvStatus(env)
    });
  }

  if (!env.newPageSpreadsheetIdConfigured) {
    return NextResponse.json({
      ok: false,
      etapa: "planilha_produtividade",
      mensagem: "Falta configurar o ID da planilha usada pela Live Prod Esteiras e Live Prod HC.",
      dica: "Adicione na Vercel a variavel GOOGLE_PRODUCTIVITY_SPREADSHEET_ID com o ID da planilha que contem a aba raw.",
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
    const rows = await readSheetRows("raw", "A1:Q25", getNewPageSpreadsheetId());
    const columns = rows[0] ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      ok: rows.length > 0,
      etapa: "leitura_raw",
      mensagem: rows.length > 0 ? "A aba raw foi lida com sucesso." : "A aba raw foi encontrada, mas nao retornou linhas na amostra.",
      linhasLidasNaAmostra: rows.length,
      colunasEncontradas: columns,
      env: publicEnvStatus(env)
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      etapa: "google_sheets_raw",
      mensagem: "A Vercel recebeu as variaveis, mas nao conseguiu ler a aba raw.",
      erro: errorMessage(error),
      dica: "Confira se a planilha de produtividade foi compartilhada como leitor com o e-mail da conta de servico.",
      env: publicEnvStatus(env)
    });
  }
}
