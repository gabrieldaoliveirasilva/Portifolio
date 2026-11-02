import { NextResponse } from "next/server";
import { getStageOutReal } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await getStageOutReal());
}
