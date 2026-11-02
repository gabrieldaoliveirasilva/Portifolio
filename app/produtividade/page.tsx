import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function ProdutividadePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="produtividade" forceRefresh={isForceRefresh(searchParams)} />;
}
