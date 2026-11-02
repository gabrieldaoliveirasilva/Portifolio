import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function ContagemPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="contagem" forceRefresh={isForceRefresh(searchParams)} />;
}
