import { NextResponse } from "next/server";
import { getInboundReal } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getInboundReal();
  return NextResponse.json(data);
}
