import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialHistoricoProdEsteiras({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/historico-packing", searchParams);
}
