import { NextResponse } from "next/server";
import { getHistoricoInboundData } from "@/lib/historico-inbound";
import { clearSheetCacheWarnings, getSheetCacheWarnings } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  clearSheetCacheWarnings();

  const data = await getHistoricoInboundData({ forceRefresh: searchParams.has("refresh") });

  return NextResponse.json({ ...data, cacheWarnings: getSheetCacheWarnings() });
}
