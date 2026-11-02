import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function HistoricoLHOutboundPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <DashboardRoute tab="historicoOutbound" forceRefresh={isForceRefresh(searchParams)} />;
}
