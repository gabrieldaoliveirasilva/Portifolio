import { redirectTo, type RouteSearchParams } from "@/lib/route-redirect";

export default function GerencialLiveProdEsteiras({ searchParams }: { searchParams?: RouteSearchParams }) {
  redirectTo("/live-prod-esteiras", searchParams);
}
