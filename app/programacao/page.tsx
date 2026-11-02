import { DashboardRoute, isForceRefresh } from "../dashboard-route";

export { dynamic, revalidate } from "../dashboard-route";

export default function ProgramacaoPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <DashboardRoute tab="programacao" forceRefresh={isForceRefresh(searchParams)} />;
}
