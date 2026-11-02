import { DashboardRoute, isForceRefresh } from "@/app/dashboard-route";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default function HistoricoInboundRoute({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="historicoInbound" forceRefresh={isForceRefresh(searchParams)} />;
}
