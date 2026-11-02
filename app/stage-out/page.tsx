import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function StageOutPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="stage" forceRefresh={isForceRefresh(searchParams)} />;
}
