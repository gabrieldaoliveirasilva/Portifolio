import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialHistoricoOutbound({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/historico-lh-outbound", searchParams);
}
