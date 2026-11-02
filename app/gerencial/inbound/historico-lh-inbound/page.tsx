import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialHistoricoInbound({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/historico-lh-inbound", searchParams);
}
