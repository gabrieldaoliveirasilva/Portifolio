import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function InboundLivePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="stageIn" forceRefresh={isForceRefresh(searchParams)} />;
}
