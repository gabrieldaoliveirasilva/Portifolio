import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function HistoricoLHInboundPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return <DashboardRoute tab="historicoInbound" forceRefresh={isForceRefresh(searchParams)} />;
}
