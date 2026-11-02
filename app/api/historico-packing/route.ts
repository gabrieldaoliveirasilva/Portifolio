import { NextResponse } from "next/server";
import { getHistoricoPackingData } from "@/lib/historico-packing";
import { clearSheetCacheWarnings, getSheetCacheWarnings } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  clearSheetCacheWarnings();

  const data = await getHistoricoPackingData(
    {
      inicio: searchParams.get("inicio") ?? "",
      fim: searchParams.get("fim") ?? "",
      turno: searchParams.get("turno") ?? "",
      esteira: searchParams.get("esteira") ?? "",
      unitizador: searchParams.get("unitizador") ?? "",
      perfil: searchParams.get("perfil") ?? "",
      hora: searchParams.get("hora") ?? "",
      fifo: searchParams.get("fifo") ?? ""
    },
    { forceRefresh: searchParams.has("refresh") }
  );

  return NextResponse.json({ ...data, cacheWarnings: getSheetCacheWarnings() });
}
