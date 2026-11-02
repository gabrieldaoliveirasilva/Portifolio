import { DashboardRoute, isForceRefresh } from "@/app/dashboard-route";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default function HistoricoOutboundRoute({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="historicoOutbound" forceRefresh={isForceRefresh(searchParams)} />;
}
